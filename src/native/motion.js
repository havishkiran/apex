import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

const isNative = Capacitor.isNativePlatform();

// Crash detection: watch for sudden high-G event (>4G) sustained briefly
const CRASH_G_THRESHOLD = 4.0;
const CRASH_WINDOW_MS = 400;

let motionListener = null;
let crashArmed = false;
let highGStart = null;

export function startMotionWatch(onCrash) {
  if (!isNative) return;

  crashArmed = true;
  Motion.addListener('accel', (event) => {
    const { x, y, z } = event.accelerationIncludingGravity;
    const g = Math.sqrt(x * x + y * y + z * z) / 9.81;

    if (g > CRASH_G_THRESHOLD) {
      if (!highGStart) highGStart = Date.now();
      else if (Date.now() - highGStart > CRASH_WINDOW_MS && crashArmed) {
        crashArmed = false; // prevent repeat firing
        onCrash();
        setTimeout(() => { crashArmed = true; highGStart = null; }, 15000);
      }
    } else {
      highGStart = null;
    }
  }).then((handle) => { motionListener = handle; });
}

export function stopMotionWatch() {
  if (motionListener) { motionListener.remove(); motionListener = null; }
  highGStart = null;
}

export function resetCrashArm() {
  crashArmed = true;
  highGStart = null;
}
