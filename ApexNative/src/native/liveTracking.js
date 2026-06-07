import { NativeModules, Platform } from 'react-native';

const mod = NativeModules.LiveTrackingModule;

export const liveTracking = {
  start(rideName = 'Ride', isKm = true, startTimestampMs = Date.now()) {
    if (Platform.OS !== 'ios' || !mod) return;
    mod.startActivity(rideName, isKm, startTimestampMs).catch(() => {});
  },
  update(speedKmh, distKm, maxSpeedKmh) {
    if (Platform.OS !== 'ios' || !mod) return;
    mod.updateActivity(speedKmh, distKm, maxSpeedKmh);
  },
  end(speedKmh, distKm, maxSpeedKmh) {
    if (Platform.OS !== 'ios' || !mod) return;
    mod.endActivity(speedKmh, distKm, maxSpeedKmh);
  },
};
