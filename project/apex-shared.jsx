// apex-shared.jsx — shared chrome + tokens for the Apex suite.
// IMPORTANT: cross-file sharing — colors live on window.AX (bare global access,
// no `const C` redeclaration across babel scripts), components are global
// function declarations. Reference AX.* and call <Glyph/> etc. from any screen.

window.AX = {
  orange: '#FF6B1A',
  bg: '#0E1014',
  surface: '#17191D',
  surface2: 'rgba(23,25,29,0.72)',
  glass: 'rgba(15,16,20,0.78)',
  border: '#2A2D33',
  border2: '#21242A',
  text: '#F2F2F0',
  dim: 'rgba(242,242,240,0.56)',
  faint: 'rgba(242,242,240,0.34)',
  ghost: 'rgba(242,242,240,0.18)',
};

const SAIRA = "'Saira', system-ui, sans-serif";
const COND = "var(--apex-num, 'Saira Condensed'), 'Saira Condensed', sans-serif";

// ── Icons (stroke glyphs only — no illustrative art) ─────────────
function Glyph({ name, size = 24, color = 'currentColor', sw = 2, style = {} }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'track': return <svg {...p} fill={color} stroke="none" style={style}><path d="M12 2 L20.5 21 L12 16.6 L3.5 21 Z" /></svg>;
    case 'history': return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case 'garage': return <svg {...p}><path d="M3.5 10 L12 4.5 L20.5 10" /><path d="M5.5 10.5V20h13V10.5" /><path d="M8 14h8M8 17h8" /></svg>;
    case 'devices': return <svg {...p}><path d="M6 7l12 10-6 5V2l6 5L6 17" /></svg>;
    case 'settings': return <svg {...p}><path d="M4 7h11M19 7h1M4 17h7M15 17h5" /><circle cx="16.5" cy="7" r="2.2" /><circle cx="12.5" cy="17" r="2.2" /></svg>;
    case 'satellite': return <svg {...p}><path d="M4 20a8 8 0 0 1 0-11l2 2a5 5 0 0 0 0 7Z" /><path d="M11 6l7 7M14 3a7 7 0 0 1 7 7" /></svg>;
    case 'recenter': return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    case 'chevron': return <svg {...p}><path d="M9 5l7 7-7 7" /></svg>;
    case 'chevron-down': return <svg {...p}><path d="M5 9l7 7 7-7" /></svg>;
    case 'back': return <svg {...p}><path d="M15 5l-7 7 7 7" /></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'speed': return <svg {...p}><path d="M12 14l5-5" /><circle cx="12" cy="13" r="9" /><path d="M12 4v1.5M21 13h-1.5M4.5 13H3" /></svg>;
    case 'elevation': return <svg {...p}><path d="M3 19l6-9 4 5 3-4 5 8z" /></svg>;
    case 'lean': return <svg {...p}><path d="M5 20h14" /><path d="M12 20 L8 7" /><path d="M8 7a4 4 0 0 1 7 1" /></svg>;
    case 'distance': return <svg {...p}><path d="M4 12h16" /><path d="M4 9v6M20 9v6M12 10v4" /></svg>;
    case 'calendar': return <svg {...p}><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9.5h16M8 3v4M16 3v4" /></svg>;
    case 'battery': return <svg {...p}><rect x="3" y="8" width="15" height="9" rx="2" /><path d="M21 11v3" /></svg>;
    case 'check': return <svg {...p}><path d="M5 12.5l4.5 4.5L19 6.5" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>;
    case 'link-off': return <svg {...p}><path d="M9 12h6" /><path d="M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 4 8" /><path d="M3 3l18 18" /></svg>;
    case 'gauge': return <svg {...p}><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 18l4-5" /></svg>;
    case 'fuel': return <svg {...p}><rect x="4" y="4" width="9" height="16" rx="1.5" /><path d="M7 9h3M13 8l3 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6l-3-3" /></svg>;
    case 'helmet': return <svg {...p}><path d="M4 14a8 8 0 0 1 16 0v2a2 2 0 0 1-2 2h-3l-1-2H7a3 3 0 0 1-3-3z" /></svg>;
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>;
    case 'bell': return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
    case 'moon': return <svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>;
    case 'share': return <svg {...p}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>;
    case 'trophy': return <svg {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 18h6M10 14h4l1 4H9z" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case 'unlock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 7.5-1.9" /></svg>;
    // maneuver arrows (nav) — stem rises then turns; arrowhead at the exit
    case 'm-right': return <svg {...p}><path d="M7 21v-7a4 4 0 0 1 4-4h6" /><path d="M13 6l5 4-5 4" /></svg>;
    case 'm-left': return <svg {...p}><path d="M17 21v-7a4 4 0 0 0-4-4H7" /><path d="M11 6L6 10l5 4" /></svg>;
    case 'm-slight-right': return <svg {...p}><path d="M8 21V14a5 5 0 0 1 1.6-3.6L16 5" /><path d="M11 4.5h6v6" /></svg>;
    case 'm-slight-left': return <svg {...p}><path d="M16 21v-7a5 5 0 0 0-1.6-3.6L8 5" /><path d="M13 4.5H7v6" /></svg>;
    case 'm-straight': return <svg {...p}><path d="M12 21V5" /><path d="M6 11l6-6 6 6" /></svg>;
    case 'm-uturn': return <svg {...p}><path d="M8 21v-9a4 4 0 0 1 8 0v3" /><path d="M12 12l4 4 4-4" /></svg>;
    case 'arrive': return <svg {...p}><path d="M7 21V4" /><path d="M7 5h9l-2.5 3L16 11H7" fill={color} stroke="none" /></svg>;
    default: return null;
  }
}

// signal bars — brightness encodes strength (grayscale; orange only when "live")
function Bars({ level = 4, color, height = 13, gap = 2 }) {
  const c = color || AX.text;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap, height }}>
      {[0.45, 0.62, 0.82, 1].map((f, i) => (
        <div key={i} style={{ width: 3, height: Math.round(height * f), borderRadius: 1,
          background: i < level ? c : AX.ghost }} />
      ))}
    </div>
  );
}

// large screen header with optional left/right slots
function ScreenHeader({ title, subtitle, right, left, dense = false }) {
  return (
    <div style={{ padding: dense ? '54px 20px 12px' : '58px 20px 14px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {left}
          <div>
            {subtitle && <div style={{ fontFamily: SAIRA, fontSize: 11.5, fontWeight: 600,
              letterSpacing: 1.6, textTransform: 'uppercase', color: AX.faint, marginBottom: 3,
              whiteSpace: 'nowrap' }}>{subtitle}</div>}
            <h1 style={{ margin: 0, fontFamily: COND, fontWeight: 700, fontSize: 34,
              lineHeight: 0.95, letterSpacing: -0.4, color: AX.text, whiteSpace: 'nowrap' }}>{title}</h1>
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

function HeaderIconBtn({ name, onClick, accent = false }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 20, border: `1px solid ${AX.border}`,
      background: AX.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0, flexShrink: 0,
    }}>
      <Glyph name={name} size={19} color={accent ? AX.orange : AX.dim} sw={2} />
    </button>
  );
}

// instrument readout cell (label over big condensed number)
function Stat({ label, value, unit, size = 30, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontFamily: SAIRA, fontSize: 11, fontWeight: 600, letterSpacing: 1.4,
        textTransform: 'uppercase', color: AX.faint }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: COND, fontWeight: 600, fontSize: size, lineHeight: 1,
          color: color || AX.text, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {unit && <span style={{ fontFamily: SAIRA, fontSize: Math.max(11, size * 0.36), fontWeight: 600,
          color: AX.dim, textTransform: 'uppercase', letterSpacing: 0.4 }}>{unit}</span>}
      </span>
    </div>
  );
}

// section label inside a scrolling screen
function SectionLabel({ children, style = {} }) {
  return <div style={{ fontFamily: SAIRA, fontSize: 11.5, fontWeight: 600, letterSpacing: 1.6,
    textTransform: 'uppercase', color: AX.faint, padding: '0 4px 10px', ...style }}>{children}</div>;
}

// tiny route trace thumbnail (a recorded path; muted orange = a route line)
function RouteThumb({ d, size = 56, accent, dim = false }) {
  const c = accent || AX.orange;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="0" y="0" width="56" height="56" rx="14" fill={AX.surface} stroke={AX.border2} />
      <path d={d} fill="none" stroke={c} strokeOpacity={dim ? 0.6 : 0.9}
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// the fixed bottom tab bar — drives navigation
function TabBar({ active = 'track', onNavigate }) {
  const tabs = [
    ['track', 'Track'], ['history', 'History'], ['garage', 'Garage'],
    ['devices', 'Devices'], ['settings', 'Settings'],
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
      padding: '11px 8px 26px', background: 'rgba(12,13,16,0.92)',
      borderTop: `1px solid ${AX.border}`, flexShrink: 0,
      backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    }}>
      {tabs.map(([id, label]) => {
        const on = id === active;
        return (
          <button key={id} onClick={() => onNavigate && onNavigate(id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minWidth: 52, color: on ? AX.text : AX.faint, background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 0',
          }}>
            <Glyph name={id} size={24} color={on ? AX.text : AX.faint} sw={1.9} />
            <span style={{ fontFamily: SAIRA, fontSize: 10.5, fontWeight: on ? 600 : 500, letterSpacing: 0.3 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// scaffold: absolute-fill screen with scrollable body between fixed header & tabs
function Screen({ children, tab, onNavigate, scroll = true, pad = true }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: AX.bg }}>
      <div style={{ flex: 1, overflowY: scroll ? 'auto' : 'hidden', overflowX: 'hidden',
        padding: pad ? '0 20px 20px' : 0, scrollbarWidth: 'none' }}
        className="apex-scroll">
        {children}
      </div>
      <TabBar active={tab} onNavigate={onNavigate} />
    </div>
  );
}

Object.assign(window, {
  Glyph, Bars, ScreenHeader, HeaderIconBtn, Stat, SectionLabel, RouteThumb, TabBar, Screen,
  AX_SAIRA: SAIRA, AX_COND: COND,
});
