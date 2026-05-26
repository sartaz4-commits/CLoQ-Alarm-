// Created for CloQ AlarmKit integration — requires Apple entitlement com.apple.developer.alarmkit
import { NativeModules, Platform } from 'react-native';

const { AlarmKitManager } = NativeModules;

const isAlarmKitAvailable = (): boolean => {
  return (
    Platform.OS === 'ios' &&
    Number(Platform.Version) >= 26 &&
    AlarmKitManager != null
  );
};

export const AlarmKit = {
  requestPermission: async (): Promise<string> => {
    if (!isAlarmKitAvailable()) return 'unavailable';
    try {
      return await AlarmKitManager.requestPermission();
    } catch (e) {
      console.error('AlarmKit requestPermission error:', e);
      return 'error';
    }
  },

  scheduleAlarm: async (
    alarmId: string,
    timestamp: number,
    soundName: string,
    mode: 'challenge' | 'loud'
  ): Promise<string> => {
    if (!isAlarmKitAvailable()) return 'unavailable';
    try {
      return await AlarmKitManager.scheduleAlarm(
        alarmId,
        timestamp,
        soundName,
        mode
      );
    } catch (e) {
      console.error('AlarmKit scheduleAlarm error:', e);
      return 'error';
    }
  },

  cancelAlarm: async (alarmId: string): Promise<string> => {
    if (!isAlarmKitAvailable()) return 'unavailable';
    try {
      return await AlarmKitManager.cancelAlarm(alarmId);
    } catch (e) {
      console.error('AlarmKit cancelAlarm error:', e);
      return 'error';
    }
  },

  testBridge: async (): Promise<string> => {
    if (!AlarmKitManager) return 'Native module not found';
    try {
      return await AlarmKitManager.testBridge();
    } catch (e) {
      return `Error: ${e}`;
    }
  },

  isAvailable: isAlarmKitAvailable,
};

export default AlarmKit;
