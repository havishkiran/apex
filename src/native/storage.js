function get(key, def = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const storage = {
  getBikes: ()           => get('apex_bikes', []),
  saveBikes: (v)         => set('apex_bikes', v),
  getProfile: ()         => get('apex_profile', { name: '', avatar: null }),
  saveProfile: (v)       => set('apex_profile', v),
  getEmergency: ()       => get('apex_emergency', { name: '', phone: '' }),
  saveEmergency: (v)     => set('apex_emergency', v),
  getSettings: ()        => get('apex_settings', {}),
  saveSettings: (v)      => set('apex_settings', v),
};

// Compress image file to base64 JPEG, max 400px, for localStorage storage
export function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = url;
  });
}
