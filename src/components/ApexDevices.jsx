import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';
import { Bars, SectionLabel, ScreenHeader, HeaderIconBtn, Screen } from './shared';
import { startBleScan, stopBleScan, connectDevice, disconnectDevice,
  isConnected, categorizeDevice, categoryIcon, categoryLabel } from '../native/bluetooth';

const isNative = Capacitor.isNativePlatform();

function StatusDot({ color }) {
  return <span style={{ width: 7, height: 7, borderRadius: 4, background: color, flexShrink: 0 }} />;
}

function SignalBars({ rssi }) {
  const level = rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return <Bars level={level} color={AX.dim} height={14} />;
}

function GpsSourceCard({ dev, isSource, onSelect }) {
  const live = isSource;
  return (
    <div onClick={() => onSelect(dev.id)} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 14,
      background: AX.surface, borderRadius: 18, cursor: 'pointer',
      border: `1px solid ${live ? 'rgba(255,107,26,0.5)' : AX.border}`,
    }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: AX.bg, border: `1px solid ${live ? 'rgba(255,107,26,0.4)' : AX.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Glyph name={dev.icon} size={24} color={live ? AX.text : AX.dim} sw={1.8} />
        {live && <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12,
          borderRadius: 6, background: AX.orange, border: `2px solid ${AX.bg}`,
          boxShadow: `0 0 7px ${AX.orange}`, animation: 'apexBlink 1.5s ease-in-out infinite' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SAIRA, fontSize: 15.5, fontWeight: 600, color: AX.text }}>{dev.name}</span>
          {live && <span style={{ fontFamily: SAIRA, fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: AX.orange, border: '1px solid rgba(255,107,26,0.45)',
            borderRadius: 5, padding: '1px 6px' }}>Active</span>}
        </div>
        <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginTop: 2 }}>{dev.kind}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <StatusDot color={live ? AX.orange : AX.dim} />
          <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600,
            color: live ? AX.orange : AX.dim }}>{live ? 'Streaming live' : 'Available'}</span>
        </div>
      </div>
      {live && <Bars level={3} color={AX.orange} height={15} />}
    </div>
  );
}

function BleDeviceCard({ device, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false);
  const connected = isConnected(device.id);
  const icon = categoryIcon(device.category);

  const handleTap = async () => {
    setBusy(true);
    try {
      if (connected) await onDisconnect(device.id);
      else await onConnect(device.id);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14,
      background: AX.surface, borderRadius: 18,
      border: `1px solid ${connected ? 'rgba(255,107,26,0.45)' : AX.border2}` }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: AX.bg, border: `1px solid ${connected ? 'rgba(255,107,26,0.3)' : AX.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name={icon} size={24} color={connected ? AX.text : AX.dim} sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: SAIRA, fontSize: 15, fontWeight: 600, color: AX.text,
          display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {device.name}
        </span>
        <span style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint }}>
          {categoryLabel(device.category)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <StatusDot color={connected ? AX.orange : AX.ghost} />
          <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600,
            color: connected ? AX.orange : AX.dim }}>
            {connected ? 'Connected' : 'Nearby'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <SignalBars rssi={device.rssi} />
        <button onClick={handleTap} disabled={busy} style={{
          height: 30, padding: '0 14px', borderRadius: 15, border: 'none', cursor: busy ? 'wait' : 'pointer',
          background: connected ? 'rgba(255,107,26,0.15)' : AX.border,
          color: connected ? AX.orange : AX.text,
          fontFamily: SAIRA, fontSize: 12, fontWeight: 700,
          opacity: busy ? 0.5 : 1,
        }}>
          {busy ? '…' : connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

function ScanButton({ scanning, onToggle, count }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px',
      borderRadius: 18, border: 'none', cursor: 'pointer',
      background: scanning ? 'rgba(255,107,26,0.15)' : AX.orange,
      color: scanning ? AX.orange : '#0E1014',
      fontFamily: SAIRA, fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {scanning ? (
        <>
          <span className="apex-ping" style={{ width: 9, height: 9, borderRadius: 5,
            border: `1.5px solid ${AX.orange}`, display: 'inline-block' }} />
          {count > 0 ? `${count} found` : 'Scanning…'}
        </>
      ) : (
        <>
          <Glyph name="search" size={14} color="#0E1014" sw={2.2} />
          Scan
        </>
      )}
    </button>
  );
}

export function ApexDevices({ t, onNavigate, gpsSource, onSetSource }) {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState({});
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [error, setError] = useState('');
  const devicesRef = useRef({});

  const gpsSources = [
    { id: 'phone', name: 'iPhone GPS', kind: 'Built-in · GNSS', icon: 'pin' },
    { id: 'external', name: 'External GPS', kind: 'Bluetooth LE · 10 Hz', icon: 'satellite' },
  ];

  const toggleScan = async () => {
    if (scanning) {
      await stopBleScan();
      setScanning(false);
    } else {
      setFound({});
      devicesRef.current = {};
      setError('');
      setScanning(true);
      await startBleScan(
        (device) => {
          devicesRef.current = { ...devicesRef.current, [device.id]: device };
          setFound({ ...devicesRef.current });
        },
        (err) => { setError(err); setScanning(false); }
      );
    }
  };

  useEffect(() => () => { stopBleScan(); }, []);

  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => { stopBleScan(); setScanning(false); }, 30000);
    return () => clearTimeout(timer);
  }, [scanning]);

  const handleConnect = async (id) => {
    await connectDevice(id);
    setConnectedIds((s) => new Set([...s, id]));
  };

  const handleDisconnect = async (id) => {
    await disconnectDevice(id);
    setConnectedIds((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const devices = Object.values(found);
  const connectedDevices = devices.filter((d) => connectedIds.has(d.id));
  const nearbyDevices = devices.filter((d) => !connectedIds.has(d.id));

  return (
    <Screen tab="devices" onNavigate={onNavigate}>
      <ScreenHeader title="Devices" subtitle={`${connectedIds.size} connected`}
        right={<HeaderIconBtn name="search" />} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 10px' }}>
        <Glyph name="satellite" size={14} color={AX.faint} sw={1.8} />
        <SectionLabel style={{ padding: 0 }}>Location source</SectionLabel>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {gpsSources.map((d) => (
          <GpsSourceCard key={d.id} dev={d} isSource={d.id === gpsSource} onSelect={onSetSource} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px 14px' }}>
        <SectionLabel style={{ padding: 0 }}>Bluetooth</SectionLabel>
        <ScanButton scanning={scanning} onToggle={toggleScan} count={devices.length} />
      </div>

      {error && (
        <div style={{ fontFamily: SAIRA, fontSize: 13, color: 'rgba(255,80,50,0.85)',
          padding: '0 4px 14px', lineHeight: 1.5 }}>
          {error} — check Bluetooth permissions in Settings → Apex
        </div>
      )}

      {connectedDevices.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionLabel style={{ padding: '0 4px 10px' }}>Connected</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connectedDevices.map((d) => (
              <BleDeviceCard key={d.id} device={d}
                onConnect={handleConnect} onDisconnect={handleDisconnect} />
            ))}
          </div>
        </div>
      )}

      {nearbyDevices.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionLabel style={{ padding: '0 4px 10px' }}>Nearby</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nearbyDevices.map((d) => (
              <BleDeviceCard key={d.id} device={d}
                onConnect={handleConnect} onDisconnect={handleDisconnect} />
            ))}
          </div>
        </div>
      )}

      {!scanning && devices.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 24px', gap: 12 }}>
          <Glyph name="link-off" size={36} color={AX.ghost} sw={1.4} />
          <span style={{ fontFamily: SAIRA, fontSize: 15, fontWeight: 600, color: AX.dim }}>
            No devices found
          </span>
          <span style={{ fontFamily: SAIRA, fontSize: 13, color: AX.faint, textAlign: 'center',
            lineHeight: 1.6 }}>
            Tap Scan to discover nearby Bluetooth devices — OBD-II adapters, helmet intercoms, heart rate monitors and more
          </span>
        </div>
      )}

      <p style={{ fontFamily: SAIRA, fontSize: 11.5, color: AX.faint, textAlign: 'center',
        margin: '16px 8px 8px', lineHeight: 1.6 }}>
        OBD-II · Helmet intercoms · Heart rate · Tire pressure sensors
      </p>
    </Screen>
  );
}
