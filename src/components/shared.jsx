import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';

export { SAIRA, COND };

// signal bars — brightness encodes strength (grayscale; orange only when "live")
export function Bars({ level = 4, color, height = 13, gap = 2 }) {
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
export function ScreenHeader({ title, subtitle, right, left, dense = false }) {
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

export function HeaderIconBtn({ name, onClick, accent = false }) {
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
export function Stat({ label, value, unit, size = 30, color }) {
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
export function SectionLabel({ children, style = {} }) {
  return <div style={{ fontFamily: SAIRA, fontSize: 11.5, fontWeight: 600, letterSpacing: 1.6,
    textTransform: 'uppercase', color: AX.faint, padding: '0 4px 10px', ...style }}>{children}</div>;
}

// tiny route trace thumbnail
export function RouteThumb({ d, size = 56, accent, dim = false }) {
  const c = accent || AX.orange;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="0" y="0" width="56" height="56" rx="14" fill={AX.surface} stroke={AX.border2} />
      <path d={d} fill="none" stroke={c} strokeOpacity={dim ? 0.6 : 0.9}
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// the fixed bottom tab bar
export function TabBar({ active = 'track', onNavigate }) {
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
export function Screen({ children, tab, onNavigate, scroll = true, pad = true }) {
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
