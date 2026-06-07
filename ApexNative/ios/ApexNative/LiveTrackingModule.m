#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveTrackingModule, NSObject)

RCT_EXTERN_METHOD(startActivity:(NSString *)rideName
                  isKm:(BOOL)isKm
                  startTimestampMs:(double)startTimestampMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateActivity:(double)speedKmh
                  distKm:(double)distKm
                  maxSpeedKmh:(double)maxSpeedKmh)

RCT_EXTERN_METHOD(endActivity:(double)speedKmh
                  distKm:(double)distKm
                  maxSpeedKmh:(double)maxSpeedKmh)

@end
