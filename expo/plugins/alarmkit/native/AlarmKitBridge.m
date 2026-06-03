// CloQ AlarmKit RN bridge.
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AlarmKitManager, NSObject)

RCT_EXTERN_METHOD(requestPermission:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scheduleAlarm:
                  (NSString *)alarmId
                  timestamp:(double)timestamp
                  soundName:(NSString *)soundName
                  mode:(NSString *)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scheduleRecurringAlarm:
                  (NSString *)alarmId
                  hour:(double)hour
                  minute:(double)minute
                  weekdays:(NSArray *)weekdays
                  soundName:(NSString *)soundName
                  mode:(NSString *)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelAlarm:
                  (NSString *)alarmId
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelAllAlarms:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(consumePendingAlarm:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(debugLog:(NSString *)message)

RCT_EXTERN_METHOD(testBridge:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
