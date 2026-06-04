// apex-devices.jsx — paired sensors & GPS sources. The one-color challenge:
// with orange reserved for "live", connection status reads through BRIGHTNESS,
// MOTION and ICON — not green/red. Only the device actively streaming live data
// carries an orange pulse; searching = animated grayscale; disconnected = faint.

const { useState: useStateD } = React;

const SAIRA_D = "'Saira', system-ui, sans-serif";
const COND_D = "var(--apex-num, 'Saira Condensed'), sans-serif";

// state → luminance tokens
const STATE = {
  live:    { tileBg: AX.surface, tileBorder: 'rgba(255,107,26,0.5)', icon: AX.text, name: AX.text, sub: AX.dim },
  connected:{ tileBg: AX.surface, tileBorder: AX.border, icon: AX.text, name: AX.text, sub: AX.dim },
  searching:{ tileBg: AX.surface, tileBorder: AX.border2, icon: AX.dim, name: AX.text, sub: AX.dim },
  off:     { tileBg: 'rgba(23,25,29,0.5)', tileBorder: AX.border2, icon: AX.faint, name: AX.dim, sub: AX.faint },
};

function StatusIndicator({ status, level, battery }) {
  if (status === 'live' || status === 'connected') {
    const live = status === 'live';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {battery != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Glyph name="battery" size={17} color={AX.dim} sw={1.7} />
            <span style={{ fontFamily: COND_D, fontSize: 16, fontWeight: 600, color: AX.dim,
              fontVariantNumeric: 'tabular-nums' }}>{battery}</span>
          </span>
        )}
        <Bars level={level} color={live ? AX.orange : AX.text} height={15} />
      </div>
    );
  }
  if (status === 'searching') {
    return (
      <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="apex-ping" style={{ position: 'absolute', width: 12, height: 12, borderRadius: 8,
          border: `1.5px solid ${AX.dim}` }} />
        <span className="apex-ping apex-ping2" style={{ position: 'absolute', width: 12, height: 12, borderRadius: 8,
          border: `1.5px solid ${AX.dim}` }} />
        <span style={{ width: 7, height: 7, borderRadius: 4, background: AX.dim }} />
      </div>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px',
      borderRadius: 16, border: `1px solid ${AX.border}`, background: AX.surface,
      fontFamily: SAIRA_D, fontSize: 12.5, fontWeight: 600, color: AX.dim }}>Connect</span>
  );
}

function statusText(status) {
  return { live: 'Streaming live', connected: 'Connected', searching: 'Searching…', off: 'Disconnected' }[status];
}

function DeviceCard({ dev, isSource, onSelect }) {
  const s = STATE[dev.status];
  const clickable = (dev.status === 'live' || dev.status === 'connected') && dev.canSource;
  return (
    <div onClick={clickable ? () => onSelect(dev.id) : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 14,
      background: s.tileBg, border: `1px solid ${isSource ? 'rgba(255,107,26,0.5)' : s.tileBorder}`,
      borderRadius: 18, cursor: clickable ? 'pointer' : 'default',
    }}>
      {/* icon tile — brightness encodes liveness */}
      <div style={{ position: 'relative', width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: AX.bg, border: `1px solid ${dev.status === 'live' ? 'rgba(255,107,26,0.4)' : AX.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name={dev.icon} size={24} color={s.icon} sw={1.8} />
        {dev.status === 'live' && (
          <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6,
            background: AX.orange, border: `2px solid ${AX.bg}`, boxShadow: `0 0 7px ${AX.orange}`,
            animation: 'apexBlink 1.5s ease-in-out infinite' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SAIRA_D, fontSize: 15.5, fontWeight: 600, color: s.name,
            whiteSpace: 'nowrap' }}>{dev.name}</span>
          {isSource && (
            <span style={{ fontFamily: SAIRA_D, fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: AX.orange, border: '1px solid rgba(255,107,26,0.45)',
              borderRadius: 5, padding: '1px 6px' }}>Source</span>
          )}
        </div>
        <div style={{ fontFamily: SAIRA_D, fontSize: 12, color: AX.faint, marginTop: 1 }}>{dev.kind}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3,
            background: dev.status === 'live' ? AX.orange : dev.status === 'off' ? AX.ghost : AX.dim }} />
          <span style={{ fontFamily: SAIRA_D, fontSize: 12, fontWeight: 600, letterSpacing: 0.4,
            color: s.sub }}>{statusText(dev.status)}</span>
        </div>
      </div>

      <StatusIndicator status={dev.status} level={dev.level} battery={dev.battery} />
    </div>
  );
}

function ApexDevices({ t, onNavigate, gpsSource, onSetSource }) {
  // GPS sources reflect the Track screen's tweak: phone vs external
  const devices = [
    { id: 'phone', name: 'iPhone GPS', kind: 'Built-in · GNSS', icon: 'pin',
      status: gpsSource === 'phone' ? 'live' : 'connected', level: 3, canSource: true },
    { id: 'apexgps', name: 'Apex GPS Puck', kind: '10 Hz external · GNSS', icon: 'satellite',
      status: gpsSource === 'external' ? 'live' : 'connected', level: 4, battery: 84, canSource: true },
    { id: 'hr', name: 'Polar H10', kind: 'Heart rate strap', icon: 'heart', status: 'searching', canSource: false },
    { id: 'comms', name: 'Cardo Packtalk', kind: 'Helmet comms', icon: 'helmet', status: 'off', canSource: false },
  ];
  const sourceId = gpsSource === 'external' ? 'apexgps' : 'phone';
  const select = (id) => {
    if (id === 'apexgps') onSetSource('external');
    else if (id === 'phone') onSetSource('phone');
  };

  return (
    <Screen tab="devices" onNavigate={onNavigate}>
      <ScreenHeader subtitle="2 connected · 1 paired" title="Devices"
        right={<HeaderIconBtn name="search" />} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 12px' }}>
        <Glyph name="satellite" size={14} color={AX.faint} sw={1.8} />
        <SectionLabel style={{ padding: 0 }}>Location source</SectionLabel>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {devices.filter((d) => d.canSource).map((d) => (
          <DeviceCard key={d.id} dev={d} isSource={d.id === sourceId} onSelect={select} />
        ))}
      </div>

      <SectionLabel style={{ padding: '22px 4px 10px' }}>Sensors</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {devices.filter((d) => !d.canSource).map((d) => (
          <DeviceCard key={d.id} dev={d} isSource={false} onSelect={() => {}} />
        ))}
      </div>

      <p style={{ fontFamily: SAIRA_D, fontSize: 12, color: AX.faint, textAlign: 'center',
        margin: '20px 16px 8px', lineHeight: 1.5 }}>
        Tap a connected location source to make it the active feed. Orange marks the device streaming live.
      </p>

      <style>{`
        .apex-ping { animation: apexPing 1.8s cubic-bezier(0,0,0.2,1) infinite; }
        .apex-ping2 { animation-delay: 0.9s; }
        @keyframes apexPing { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(2.6); opacity: 0; } }
      `}</style>
    </Screen>
  );
}

Object.assign(window, { ApexDevices });
