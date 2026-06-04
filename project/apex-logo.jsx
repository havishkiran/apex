// apex-logo.jsx — the Apex "A" mark.
// A bold A whose sharp top point is the apex (marked by a light dot),
// with a gentle curved crossbar = the racing line through the corner.
// Geometry only; renders crisp from favicon size up.

function ApexMark({ size = 40, color = '#FF6B1A', dotColor = '#F2F2F0', style = {} }) {
  // viewBox 0..100 ; apex peak at (50, 8)
  const sw = 13; // leg stroke weight
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ display: 'block', ...style }}>
      {/* left + right legs meeting at the sharp apex */}
      <path d="M16 92 L50 12 L84 92" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="miter" />
      {/* racing line — gentle curve clipping the inside of the corner */}
      <path d="M30 66 Q50 52 70 66" stroke={color} strokeWidth={sw}
        strokeLinecap="round" fill="none" />
      {/* the apex itself — the point you clip */}
      <circle cx="50" cy="11" r="7.5" fill={dotColor} />
    </svg>
  );
}

// Wordmark lockup: mark + "APEX"
function ApexWordmark({ height = 28, color = '#F2F2F0', accent = '#FF6B1A', style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.34, ...style }}>
      <ApexMark size={height * 1.04} color={accent} dotColor={color} />
      <span style={{
        fontFamily: "'Saira Condensed', system-ui, sans-serif",
        fontWeight: 700, fontSize: height, lineHeight: 1,
        letterSpacing: height * 0.04, color, textTransform: 'uppercase',
      }}>Apex</span>
    </div>
  );
}

// Dark rounded app-icon tile with the mark centered.
function ApexIconTile({ size = 96, accent = '#FF6B1A', radius }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius ?? size * 0.225,
      background: '#17191D', display: 'flex', alignItems: 'center',
      justifyContent: 'center', boxShadow: 'inset 0 0 0 1px #2A2D33',
    }}>
      <ApexMark size={size * 0.62} color={accent} dotColor="#F2F2F0" />
    </div>
  );
}

Object.assign(window, { ApexMark, ApexWordmark, ApexIconTile });
