// Created for CloQ AlarmKit integration — requires Apple entitlement com.apple.developer.alarmkit
import AlarmKit
import Foundation
import React

@objc(AlarmKitManager)
class AlarmKitManager: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        let manager = AlarmManager.shared
        let status = try await manager.requestAuthorization()
        resolve(status == .authorized ? "authorized" : "denied")
      } catch {
        reject("ALARM_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc func scheduleAlarm(_ alarmId: String,
                           timestamp: Double,
                           soundName: String,
                           mode: String,
                           resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        let manager = AlarmManager.shared
        let date = Date(timeIntervalSince1970: timestamp / 1000)

        let attributes = AlarmAttributes(
          title: "CloQ Alarm",
          stopButtonLabel: "Stop",
          snoozeButtonLabel: nil
        )

        let alarm = Alarm(
          id: UUID(uuidString: alarmId) ?? UUID(),
          date: date,
          recurrence: .none,
          attributes: attributes
        )

        try await manager.schedule(alarm)
        resolve("scheduled")
      } catch {
        reject("ALARM_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc func cancelAlarm(_ alarmId: String,
                         resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        let manager = AlarmManager.shared
        if let uuid = UUID(uuidString: alarmId) {
          try await manager.cancel(uuid)
        }
        resolve("cancelled")
      } catch {
        reject("ALARM_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc func testBridge(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve("AlarmKit bridge is working correctly")
  }
}
