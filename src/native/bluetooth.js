import { Capacitor } from '@capacitor/core';
import { BleClient, ScanMode } from '@capacitor-community/bluetooth-le';

const isNative = Capacitor.isNativePlatform();

let initialized = false;
let scanning = false;

// Guess device category from name
export function categorizeDevice(name = '') {
  const n = name.toLowerCase();
  if (/obd|elm|obdii|vlink|carista|bluedriver/.test(n)) return 'obd';
  if (/sena|cardo|packtalk|momentum|scala|uclear/.test(n)) return 'intercom';
  if (/polar|garmin|wahoo|tickr|hrm|heart/.test(n)) return 'heartrate';
  if (/tpms|tire/.test(n)) return 'tpms';
  if (/gopro|insta360|camera/.test(n)) return 'camera';
  if (/airpods|headset|headphone|bose|jabra|beats/.test(n)) return 'audio';
  return 'generic';
}

export function categoryIcon(cat) {
  return { obd: 'gauge', intercom: 'helmet', heartrate: 'heart',
    tpms: 'gauge', camera: 'pin', audio: 'bell', generic: 'link-off' }[cat] || 'link-off';
}

export function categoryLabel(cat) {
  return { obd: 'OBD-II Adapter', intercom: 'Helmet Intercom', heartrate: 'Heart Rate',
    tpms: 'Tire Pressure', camera: 'Action Camera', audio: 'Audio Device', generic: 'Bluetooth Device' }[cat] || 'Device';
}

async function init() {
  if (initialized || !isNative) return true;
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    initialized = true;
    return true;
  } catch (e) {
    console.warn('BLE init failed', e);
    return false;
  }
}

export async function startBleScan(onDevice, onError) {
  if (!isNative) return;
  const ok = await init();
  if (!ok) { onError?.('Bluetooth not available'); return; }

  if (scanning) await stopBleScan();
  scanning = true;

  try {
    await BleClient.requestLEScan(
      { scanMode: ScanMode.SCAN_MODE_LOW_LATENCY, allowDuplicates: false },
      (result) => {
        const name = result.localName || result.device?.name || '';
        if (!name) return; // skip unnamed devices
        onDevice({
          id: result.device.deviceId,
          name,
          rssi: result.rssi,
          category: categorizeDevice(name),
        });
      }
    );
  } catch (e) {
    scanning = false;
    onError?.(e.message || 'Scan failed');
  }
}

export async function stopBleScan() {
  if (!isNative || !scanning) return;
  scanning = false;
  try { await BleClient.stopLEScan(); } catch {}
}

const connected = new Set();

export async function connectDevice(deviceId) {
  if (!isNative) return;
  await init();
  await BleClient.connect(deviceId, () => connected.delete(deviceId));
  connected.add(deviceId);
}

export async function disconnectDevice(deviceId) {
  if (!isNative) return;
  try { await BleClient.disconnect(deviceId); } catch {}
  connected.delete(deviceId);
}

export function isConnected(deviceId) {
  return connected.has(deviceId);
}
