import AsyncStorage from '@react-native-async-storage/async-storage';

async function get(key, def = null) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v != null ? JSON.parse(v) : def;
  } catch { return def; }
}

async function set(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const storage = {
  getBikes:      () => get('apex_bikes', []),
  saveBikes:     (v) => set('apex_bikes', v),
  getProfile:    () => get('apex_profile', { name: '', avatar: null }),
  saveProfile:   (v) => set('apex_profile', v),
  getEmergency:  () => get('apex_emergency', { name: '', phone: '' }),
  saveEmergency: (v) => set('apex_emergency', v),
  getSettings:   () => get('apex_settings', {}),
  saveSettings:  (v) => set('apex_settings', v),
  getRides:      () => get('apex_rides', []),
  saveRides:     (v) => set('apex_rides', v),
};

export async function saveRide(ride) {
  const rides = await storage.getRides();
  await storage.saveRides([ride, ...rides].slice(0, 100));
}
