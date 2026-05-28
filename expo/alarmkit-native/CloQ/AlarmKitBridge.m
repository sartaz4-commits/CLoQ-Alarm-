// Created for CloQ AlarmKit integration — requires Apple entitlement com.apple.developer.alarmkit
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

RCT_EXTERN_METHOD(cancelAlarm:
                  (NSString *)alarmId
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(testBridge:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
