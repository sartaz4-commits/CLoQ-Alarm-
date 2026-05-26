import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AlarmKit from "@/src/utils/AlarmKitModule";
import type { Alarm } from "@/types";

const ALARM_TAG = "cloq-alarm";
const CATEGORY_ID = "cloq-alarm";

/**
 * Configure CloQ's lock-screen notification behaviour. Calling this once on
 * app start registers the "Open CloQ" action button and tells the system to
 * show alarms as banners + play sound + use lists even while the app is in
 * the foreground.
 */
export async function configureAlarmNotifications(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: "open",
        buttonTitle: "Open CloQ",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (e) {
    console.log("[alarmNotifications] configure error", e);
  }
}

/**
 * Cancel any previously-scheduled CloQ alarms and (re)schedule one notification
 * per enabled alarm. iOS notifications fire even from a fully-suspended app
 * and — with timeSensitive interruption — break through Focus modes and
 * appear prominently on the lock screen.
 */
export async function rescheduleAlarms(alarms: Alarm[]): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content?.data && (n.content.data as Record<string, unknown>).tag === ALARM_TAG) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.log("[alarmNotifications] cancel error", e);
  }

  for (const a of alarms) {
    if (!a.enabled) continue;
    try {
      const scheduledByAlarmKit = await scheduleAlarmSafely(a);
      if (scheduledByAlarmKit) continue;

      if (a.days.length === 0) {
        await Notifications.scheduleNotificationAsync({
          content: buildContent(a),
          trigger: nextOneShotTrigger(a.hour, a.minute),
        });
      } else {
        // iOS supports weekly repeating calendar triggers (weekday 1=Sun..7=Sat).
        for (const day of a.days) {
          const weekday = ((day + 1) % 7) + 1; // 0=Mon → 2, ... 6=Sun → 1
          await Notifications.scheduleNotificationAsync({
            content: buildContent(a),
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday,
              hour: a.hour,
              minute: a.minute,
            },
          });
        }
      }
    } catch (e) {
      console.log("[alarmNotifications] schedule error", e);
    }
  }
}



const scheduleAlarmSafely = async (alarm: Alarm): Promise<boolean> => {
  if (!AlarmKit.isAvailable()) return false;

  if (alarm.days.length > 0) {
    // AlarmKit bridge currently supports one-shot scheduling only.
    return false;
  }

  const timestamp = nextOneShotDate(alarm.hour, alarm.minute).getTime();
  const soundName = alarm.sound?.builtInId ?? alarm.sound?.recordingId ?? "default";
  const result = await AlarmKit.scheduleAlarm(alarm.id, timestamp, soundName, alarm.mode);
  return result === "scheduled";
};

function buildContent(a: Alarm): Notifications.NotificationContentInput {
  return {
    title: "Alarm",
    body: "Tap Open CloQ to dismiss",
    sound: "default",
    data: { tag: ALARM_TAG, alarmId: a.id },
    categoryIdentifier: CATEGORY_ID,
    interruptionLevel: "timeSensitive",
  } as Notifications.NotificationContentInput;
}

function nextOneShotDate(hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

function nextOneShotTrigger(hour: number, minute: number): Notifications.NotificationTriggerInput {
  const target = nextOneShotDate(hour, minute);
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
        allowProvisional: false,
      },
    });
    return req.granted;
  } catch (e) {
    console.log("[alarmNotifications] permission error", e);
    return false;
  }
}

export const PLATFORM_SUPPORTS_NOTIFICATIONS = Platform.OS === "ios" || Platform.OS === "android";
