const STORAGE_KEY = 'apex_rides';

export function saveRide(ride) {
  const rides = loadRides();
  rides.unshift(ride);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rides.slice(0, 100))); } catch {}
}

export function loadRides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
