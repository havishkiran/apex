import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const isNative = Capacitor.isNativePlatform();

let watchId = null;
let lastPos = null;
let lastTime = null;
let smoothSpeed = 0;

export async function requestLocationPermission() {
  if (!isNative) return 'granted';
  const status = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
  return status.location;
}

export function startLocationWatch(onUpdate) {
  if (!isNative) return;

  Geolocation.watchPosition(
    { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 },
    (pos, err) => {
      if (err || !pos) return;
      const now = pos.timestamp;
      const coords = pos.coords;

      // smooth speed: blend GPS speed (m/s → mph) with previous
      const rawSpeed = (coords.speed != null && coords.speed >= 0)
        ? coords.speed * 2.23694  // m/s to mph
        : smoothSpeed;
      smoothSpeed = smoothSpeed * 0.6 + rawSpeed * 0.4;

      // distance increment from previous position
      let distDelta = 0;
      if (lastPos && lastTime) {
        const dt = (now - lastTime) / 1000;
        distDelta = (smoothSpeed / 3600) * dt; // miles
      }

      lastPos = coords;
      lastTime = now;

      onUpdate({
        speed: smoothSpeed,
        distDelta,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
      });
    }
  ).then((id) => { watchId = id; });
}

export function stopLocationWatch() {
  if (watchId != null) {
    Geolocation.clearWatch({ id: watchId });
    watchId = null;
  }
  lastPos = null;
  lastTime = null;
  smoothSpeed = 0;
}
