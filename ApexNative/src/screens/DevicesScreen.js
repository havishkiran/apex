import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Platform, Alert,
} from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { Glyph } from '../components/Glyph';

const manager = new BleManager();

function categorize(name = '') {
  const n = name.toLowerCase();
  if (/obd|elm|vgate|car|obdii/.test(n)) return 'obd';
  if (/sena|cardo|uclear|intercom|headset/.test(n)) return 'intercom';
  if (/polar|garmin|wahoo|hrm|heart/.test(n)) return 'hrm';
  if (/tpms|tire|pressure/.test(n)) return 'tpms';
  return 'generic';
}

const CATEGORY_META = {
  obd:      { label: 'OBD-II Adapter', icon: 'gauge' },
  intercom: { label: 'Helmet Intercom', icon: 'bell' },
  hrm:      { label: 'Heart Rate Monitor', icon: 'heart' },
  tpms:     { label: 'Tire Pressure Sensor', icon: 'gauge' },
  generic:  { label: 'Bluetooth Device', icon: 'devices' },
};

function StatusDot({ color }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function SignalBars({ rssi }) {
  const level = rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return (
    <View style={styles.bars}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.bar, { height: 4 + i * 3,
          backgroundColor: i <= level ? AX.dim : AX.border }]} />
      ))}
    </View>
  );
}

function DeviceCard({ device, connected, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false);
  const meta = CATEGORY_META[categorize(device.name)];

  const handleTap = async () => {
    setBusy(true);
    try {
      if (connected) await onDisconnect(device.id);
      else await onConnect(device.id);
    } finally { setBusy(false); }
  };

  return (
    <View style={[styles.card, connected && styles.cardActive]}>
      <View style={[styles.cardIcon, connected && styles.cardIconActive]}>
        <Glyph name={meta.icon} size={22} color={connected ? AX.text : AX.dim} sw={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardName} numberOfLines={1}>{device.name || 'Unknown Device'}</Text>
        <Text style={styles.cardSub}>{meta.label}</Text>
        <View style={styles.cardStatus}>
          <StatusDot color={connected ? AX.orange : AX.ghost} />
          <Text style={[styles.cardStatusText, { color: connected ? AX.orange : AX.dim }]}>
            {connected ? 'Connected' : 'Nearby'}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <SignalBars rssi={device.rssi || -80} />
        <TouchableOpacity onPress={handleTap} disabled={busy}
          style={[styles.connectBtn, connected && styles.connectBtnActive]}>
          <Text style={[styles.connectBtnText, { color: connected ? AX.orange : AX.text }]}>
            {busy ? '…' : connected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GpsSourceCard({ source, active, onSelect }) {
  return (
    <TouchableOpacity onPress={() => onSelect(source.id)} activeOpacity={0.8}
      style={[styles.gpsCard, active && styles.gpsCardActive]}>
      <View style={[styles.gpsIcon, active && styles.gpsIconActive]}>
        <Glyph name={source.icon} size={22} color={active ? AX.text : AX.dim} sw={1.8} />
        {active && <View style={styles.gpsPulse} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.gpsNameRow}>
          <Text style={styles.gpsName}>{source.name}</Text>
          {active && (
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.gpsSub}>{source.kind}</Text>
        <View style={styles.cardStatus}>
          <StatusDot color={active ? AX.orange : AX.dim} />
          <Text style={[styles.cardStatusText, { color: active ? AX.orange : AX.dim }]}>
            {active ? 'Streaming live' : 'Available'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const GPS_SOURCES = [
  { id: 'phone',    name: 'Phone GPS',    kind: 'Built-in · GNSS',         icon: 'pin' },
  { id: 'external', name: 'External GPS', kind: 'Bluetooth LE · 10 Hz',    icon: 'satellite' },
];

export default function DevicesScreen({ gpsSource = 'phone', onSetSource }) {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState({});
  const [connected, setConnected] = useState(new Set());
  const [bleState, setBleState] = useState(null);
  const [error, setError] = useState('');
  const foundRef = useRef({});
  const scanTimer = useRef(null);

  useEffect(() => {
    const sub = manager.onStateChange((state) => {
      setBleState(state);
    }, true);
    return () => { sub.remove(); stopScan(); };
  }, []);

  const startScan = async () => {
    if (bleState !== State.PoweredOn) {
      setError('Bluetooth is off — enable it in Settings');
      return;
    }
    foundRef.current = {};
    setFound({});
    setError('');
    setScanning(true);

    manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
      if (err) {
        setError(err.message);
        setScanning(false);
        return;
      }
      if (device?.name) {
        foundRef.current = { ...foundRef.current, [device.id]: {
          id: device.id, name: device.name, rssi: device.rssi,
        }};
        setFound({ ...foundRef.current });
      }
    });

    scanTimer.current = setTimeout(stopScan, 30000);
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setScanning(false);
    if (scanTimer.current) { clearTimeout(scanTimer.current); scanTimer.current = null; }
  };

  const toggleScan = () => scanning ? stopScan() : startScan();

  const handleConnect = async (id) => {
    try {
      await manager.connectToDevice(id);
      setConnected(s => new Set([...s, id]));
    } catch (e) { Alert.alert('Connection failed', e.message); }
  };

  const handleDisconnect = async (id) => {
    try {
      await manager.cancelDeviceConnection(id);
      setConnected(s => { const n = new Set(s); n.delete(id); return n; });
    } catch {}
  };

  const devices = Object.values(found);
  const connectedDevices = devices.filter(d => connected.has(d.id));
  const nearbyDevices = devices.filter(d => !connected.has(d.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{connected.size} connected</Text>
          <Text style={styles.headerTitle}>Devices</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* GPS Source */}
        <View style={styles.sectionRow}>
          <Glyph name="satellite" size={13} color={AX.faint} sw={1.8} />
          <Text style={styles.sectionLabel}>Location Source</Text>
        </View>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {GPS_SOURCES.map(s => (
            <GpsSourceCard key={s.id} source={s}
              active={s.id === gpsSource}
              onSelect={onSetSource || (() => {})} />
          ))}
        </View>

        {/* Bluetooth */}
        <View style={[styles.sectionRow, { justifyContent: 'space-between', marginBottom: 14 }]}>
          <Text style={styles.sectionLabel}>Bluetooth</Text>
          <TouchableOpacity onPress={toggleScan} style={[styles.scanBtn,
            scanning && styles.scanBtnActive]}>
            {scanning
              ? <><View style={styles.scanDot} /><Text style={styles.scanBtnTextActive}>{devices.length > 0 ? `${devices.length} found` : 'Scanning…'}</Text></>
              : <><Glyph name="search" size={13} color="#0E1014" sw={2.2} /><Text style={styles.scanBtnText}>Scan</Text></>
            }
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error} — check Bluetooth in Settings → Apex</Text> : null}

        {connectedDevices.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Connected</Text>
            <View style={{ gap: 10, marginBottom: 18 }}>
              {connectedDevices.map(d => (
                <DeviceCard key={d.id} device={d} connected
                  onConnect={handleConnect} onDisconnect={handleDisconnect} />
              ))}
            </View>
          </>
        )}

        {nearbyDevices.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Nearby</Text>
            <View style={{ gap: 10, marginBottom: 18 }}>
              {nearbyDevices.map(d => (
                <DeviceCard key={d.id} device={d} connected={false}
                  onConnect={handleConnect} onDisconnect={handleDisconnect} />
              ))}
            </View>
          </>
        )}

        {!scanning && devices.length === 0 && (
          <View style={styles.empty}>
            <Glyph name="link-off" size={36} color={AX.ghost} sw={1.4} />
            <Text style={styles.emptyTitle}>No devices found</Text>
            <Text style={styles.emptySub}>
              Tap Scan to discover nearby Bluetooth devices — OBD-II adapters, helmet intercoms, heart rate monitors and more
            </Text>
          </View>
        )}

        <Text style={styles.footer}>OBD-II · Helmet intercoms · Heart rate · Tire pressure</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  headerSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginBottom: 2 },
  headerTitle: { fontFamily: FONTS.cond, fontSize: 32, color: AX.text, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { fontFamily: FONTS.sairaBold, fontSize: 11.5, color: AX.faint,
    letterSpacing: 1.2, textTransform: 'uppercase' },

  // GPS cards
  gpsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: AX.surface, borderRadius: 18,
    borderWidth: 1, borderColor: AX.border,
  },
  gpsCardActive: { borderColor: 'rgba(255,107,26,0.5)' },
  gpsIcon: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: AX.bg,
    borderWidth: 1, borderColor: AX.border2,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  gpsIconActive: { borderColor: 'rgba(255,107,26,0.4)' },
  gpsPulse: {
    position: 'absolute', top: -3, right: -3, width: 12, height: 12,
    borderRadius: 6, backgroundColor: AX.orange, borderWidth: 2, borderColor: AX.bg,
  },
  gpsNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  gpsName: { fontFamily: FONTS.sairaBold, fontSize: 15.5, color: AX.text },
  gpsSub: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginBottom: 6 },
  activeTag: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5,
    backgroundColor: 'rgba(255,107,26,0.14)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.45)',
  },
  activeTagText: { fontFamily: FONTS.sairaBold, fontSize: 9.5, color: AX.orange,
    letterSpacing: 1, textTransform: 'uppercase' },

  // Device cards
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: AX.surface, borderRadius: 18,
    borderWidth: 1, borderColor: AX.border2,
  },
  cardActive: { borderColor: 'rgba(255,107,26,0.45)' },
  cardIcon: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: AX.bg,
    borderWidth: 1, borderColor: AX.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconActive: { borderColor: 'rgba(255,107,26,0.3)' },
  cardName: { fontFamily: FONTS.sairaBold, fontSize: 15, color: AX.text, marginBottom: 2 },
  cardSub: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginBottom: 5 },
  cardStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardStatusText: { fontFamily: FONTS.sairaBold, fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 8 },

  dot: { width: 7, height: 7, borderRadius: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 1.5 },

  connectBtn: {
    height: 30, paddingHorizontal: 14, borderRadius: 15,
    backgroundColor: AX.border, alignItems: 'center', justifyContent: 'center',
  },
  connectBtnActive: { backgroundColor: 'rgba(255,107,26,0.15)' },
  connectBtnText: { fontFamily: FONTS.sairaBold, fontSize: 12 },

  // Scan button
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 36, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: AX.orange,
  },
  scanBtnActive: { backgroundColor: 'rgba(255,107,26,0.15)' },
  scanBtnText: { fontFamily: FONTS.sairaBold, fontSize: 13, color: '#0E1014' },
  scanBtnTextActive: { fontFamily: FONTS.sairaBold, fontSize: 13, color: AX.orange },
  scanDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: AX.orange },

  error: { fontFamily: FONTS.saira, fontSize: 13, color: 'rgba(255,80,50,0.85)',
    marginBottom: 14, lineHeight: 20 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontFamily: FONTS.sairaBold, fontSize: 15, color: AX.dim },
  emptySub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint,
    textAlign: 'center', lineHeight: 20 },

  footer: { fontFamily: FONTS.saira, fontSize: 11.5, color: AX.faint,
    textAlign: 'center', marginTop: 16, lineHeight: 20 },
});
