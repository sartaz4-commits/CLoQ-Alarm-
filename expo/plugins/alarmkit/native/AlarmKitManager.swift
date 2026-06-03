// CloQ AlarmKit integration (iOS 26+). Requires NSAlarmKitUsageDescription in Info.plist.
import ActivityKit
import AlarmKit
import AppIntents
import CryptoKit
import Foundation
import React
import SwiftUI

// AlarmMetadata is an empty marker protocol; AlarmKit requires a concrete type.
@available(iOS 26.0, *)
struct CloQAlarmMetadata: AlarmMetadata {}

// Tapping the alarm's "Solve to dismiss" button runs this intent: it silences
// the AlarmKit alarm, stashes the alarm id for JS to pick up, and foregrounds
// the app so CloQ can present its challenge screen.
@available(iOS 26.0, *)
struct OpenPuzzleIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Solve to dismiss"
  static var openAppWhenRun: Bool { true }

  @Parameter(title: "Alarm ID") var alarmID: String

  init() {}
  init(alarmID: String) { self.alarmID = alarmID }

  func perform() async throws -> some IntentResult {
    UserDefaults.standard.set(alarmID, forKey: "cloq_pending_alarm_id")
    if let uuid = UUID(uuidString: alarmID) {
      try? AlarmManager.shared.stop(id: uuid)
    }
    return .result()
  }
}

@objc(AlarmKitManager)
class AlarmKitManager: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  // Logs to both the unified log (filter: CLOQ_ALARMKIT) and a file in the app
  // container (Documents/cloq_alarmkit.log) that can be pulled with devicectl.
  private func log(_ message: String) {
    NSLog("CLOQ_ALARMKIT %@", message)
    let stamp = ISO8601DateFormatter().string(from: Date())
    let line = "\(stamp) CLOQ_ALARMKIT \(message)\n"
    guard let data = line.data(using: .utf8),
          let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    else { return }
    let url = dir.appendingPathComponent("cloq_alarmkit.log")
    if FileManager.default.fileExists(atPath: url.path) {
      if let handle = try? FileHandle(forWritingTo: url) {
        handle.seekToEndOfFile()
        handle.write(data)
        try? handle.close()
      }
    } else {
      try? data.write(to: url)
    }
  }

  // Built-in tones bundled as .caf in the app. Recordings / unknown ids fall
  // back to the system alarm sound.
  @available(iOS 26.0, *)
  private func alarmSound(for soundName: String) -> AlertConfiguration.AlertSound {
    let known: Set<String> = [
      "classic_alarm", "retro_bell", "goat_bleat", "angry_cat",
      "sad_trombone", "cow_moo", "scottish_man", "indian_auntie", "french_man",
    ]
    // The app's "default" selection is the Classic Alarm tone.
    let id = (soundName == "default" || soundName.isEmpty) ? "classic_alarm" : soundName
    if known.contains(id) {
      return .named("\(id).caf")
    }
    return .default
  }

  // The app's alarm ids (e.g. "a_1779995416412") aren't valid UUIDs, so derive
  // a stable UUID from the app id. Same app alarm → same AlarmKit id, enabling
  // deterministic reschedule/cancel.
  private func stableUUID(from string: String) -> UUID {
    let digest = Insecure.MD5.hash(data: Data(string.utf8))
    let b = Array(digest)
    return UUID(uuid: (
      b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7],
      b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]
    ))
  }

  @available(iOS 26.0, *)
  private func makeConfiguration(schedule: Alarm.Schedule, soundName: String, appAlarmId: String) -> AlarmManager.AlarmConfiguration<CloQAlarmMetadata> {
    let alert = AlarmPresentation.Alert(
      title: "CloQ Alarm",
      stopButton: AlarmButton(
        text: "Stop",
        textColor: .white,
        systemImageName: "stop.fill"
      ),
      secondaryButton: AlarmButton(
        text: "Solve to dismiss",
        textColor: .white,
        systemImageName: "puzzlepiece.fill"
      ),
      secondaryButtonBehavior: .custom
    )
    let attributes = AlarmAttributes<CloQAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert),
      metadata: CloQAlarmMetadata(),
      tintColor: Color.orange
    )
    return AlarmManager.AlarmConfiguration.alarm(
      schedule: schedule,
      attributes: attributes,
      stopIntent: nil,
      secondaryIntent: OpenPuzzleIntent(alarmID: appAlarmId),
      sound: alarmSound(for: soundName)
    )
  }

  @available(iOS 26.0, *)
  private func weekday(from day: Int) -> Locale.Weekday {
    // App convention: 0=Mon, 1=Tue, ... 6=Sun.
    switch day {
    case 0: return .monday
    case 1: return .tuesday
    case 2: return .wednesday
    case 3: return .thursday
    case 4: return .friday
    case 5: return .saturday
    default: return .sunday
    }
  }

  @available(iOS 26.0, *)
  private func ensureAuthorized() async throws -> Bool {
    let manager = AlarmManager.shared
    if manager.authorizationState == .authorized { return true }
    let state = try await manager.requestAuthorization()
    return state == .authorized
  }

  @objc func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    log("requestPermission called")
    if #available(iOS 26.0, *) {
      Task {
        do {
          let manager = AlarmManager.shared
          log("requestPermission current authorizationState=\(String(describing: manager.authorizationState))")
          if manager.authorizationState == .authorized {
            resolve("authorized")
            return
          }
          let state = try await manager.requestAuthorization()
          log("requestPermission result=\(String(describing: state))")
          resolve(state == .authorized ? "authorized" : "denied")
        } catch {
          log("requestPermission ERROR \(error)")
          reject("ALARM_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      log("requestPermission unavailable (iOS < 26)")
      resolve("unavailable")
    }
  }

  @objc func scheduleAlarm(_ alarmId: String,
                           timestamp: Double,
                           soundName: String,
                           mode: String,
                           resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    log("scheduleAlarm called id=\(alarmId) timestamp=\(timestamp) sound=\(soundName) mode=\(mode)")
    if #available(iOS 26.0, *) {
      Task {
        do {
          guard try await ensureAuthorized() else {
            log("scheduleAlarm DENIED")
            reject("ALARM_DENIED", "Alarm authorization not granted", nil)
            return
          }
          let date = Date(timeIntervalSince1970: timestamp / 1000.0)
          let id = stableUUID(from: alarmId)
          log("scheduleAlarm scheduling id=\(id) appId=\(alarmId) fireDate=\(date) (now=\(Date())) sound=\(soundName)")
          let configuration = makeConfiguration(schedule: .fixed(date), soundName: soundName, appAlarmId: alarmId)
          let scheduled = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
          log("scheduleAlarm SUCCESS scheduledId=\(scheduled.id) state=\(String(describing: scheduled.state))")
          resolve("scheduled")
        } catch {
          let ns = error as NSError
          log("scheduleAlarm ERROR domain=\(ns.domain) code=\(ns.code) desc=\(ns.localizedDescription) full=\(error)")
          reject("ALARM_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      log("scheduleAlarm unavailable (iOS < 26)")
      resolve("unavailable")
    }
  }

  @objc func scheduleRecurringAlarm(_ alarmId: String,
                                    hour: Double,
                                    minute: Double,
                                    weekdays: NSArray,
                                    soundName: String,
                                    mode: String,
                                    resolve: @escaping RCTPromiseResolveBlock,
                                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    let dayInts = weekdays.compactMap { ($0 as? NSNumber)?.intValue }
    log("scheduleRecurringAlarm called id=\(alarmId) hour=\(hour) minute=\(minute) days=\(dayInts) sound=\(soundName) mode=\(mode)")
    if #available(iOS 26.0, *) {
      Task {
        do {
          guard try await ensureAuthorized() else {
            log("scheduleRecurringAlarm DENIED")
            reject("ALARM_DENIED", "Alarm authorization not granted", nil)
            return
          }
          let id = stableUUID(from: alarmId)
          let mapped = dayInts.map { weekday(from: $0) }
          let time = Alarm.Schedule.Relative.Time(hour: Int(hour), minute: Int(minute))
          let recurrence: Alarm.Schedule.Relative.Recurrence = mapped.isEmpty ? .never : .weekly(mapped)
          let schedule = Alarm.Schedule.relative(
            Alarm.Schedule.Relative(time: time, repeats: recurrence)
          )
          log("scheduleRecurringAlarm scheduling id=\(id) appId=\(alarmId) hour=\(Int(hour)) minute=\(Int(minute)) weekdays=\(mapped) sound=\(soundName)")
          let configuration = makeConfiguration(schedule: schedule, soundName: soundName, appAlarmId: alarmId)
          let scheduled = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
          log("scheduleRecurringAlarm SUCCESS scheduledId=\(scheduled.id) state=\(String(describing: scheduled.state))")
          resolve("scheduled")
        } catch {
          let ns = error as NSError
          log("scheduleRecurringAlarm ERROR domain=\(ns.domain) code=\(ns.code) desc=\(ns.localizedDescription) full=\(error)")
          reject("ALARM_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      log("scheduleRecurringAlarm unavailable (iOS < 26)")
      resolve("unavailable")
    }
  }

  @objc func cancelAlarm(_ alarmId: String,
                         resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    log("cancelAlarm called id=\(alarmId)")
    if #available(iOS 26.0, *) {
      do {
        let uuid = stableUUID(from: alarmId)
        try AlarmManager.shared.cancel(id: uuid)
        log("cancelAlarm cancelled id=\(uuid) appId=\(alarmId)")
        resolve("cancelled")
      } catch {
        log("cancelAlarm ERROR \(error)")
        reject("ALARM_ERROR", error.localizedDescription, error)
      }
    } else {
      resolve("unavailable")
    }
  }

  @objc func cancelAllAlarms(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    log("cancelAllAlarms called")
    if #available(iOS 26.0, *) {
      do {
        let all = try AlarmManager.shared.alarms
        log("cancelAllAlarms found \(all.count) scheduled")
        for alarm in all {
          do {
            try AlarmManager.shared.cancel(id: alarm.id)
          } catch {
            log("cancelAllAlarms cancel error id=\(alarm.id) \(error)")
          }
        }
        resolve("cancelled \(all.count)")
      } catch {
        log("cancelAllAlarms list error \(error)")
        reject("ALARM_ERROR", error.localizedDescription, error)
      }
    } else {
      resolve("unavailable")
    }
  }

  // Returns (and clears) the alarm id stashed by OpenPuzzleIntent when the user
  // tapped "Solve to dismiss". JS calls this on app foreground to route into the
  // challenge screen. Resolves null when there's nothing pending.
  @objc func consumePendingAlarm(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    let key = "cloq_pending_alarm_id"
    let id = UserDefaults.standard.string(forKey: key)
    if let id = id, !id.isEmpty {
      UserDefaults.standard.removeObject(forKey: key)
      log("consumePendingAlarm returning \(id)")
      resolve(id)
    } else {
      resolve(nil)
    }
  }

  // Fire-and-forget logging hook callable from JS so the JS routing decision
  // lands in the same log file as the native steps.
  @objc func debugLog(_ message: String) {
    log("[JS] \(message)")
  }

  @objc func testBridge(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    log("testBridge called")
    resolve("AlarmKit bridge is working correctly")
  }
}
