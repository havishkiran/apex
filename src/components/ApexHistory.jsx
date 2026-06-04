import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';
import { Stat, SectionLabel, RouteThumb, ScreenHeader, HeaderIconBtn, Screen } from './shared';

function axRand(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function makeSeries(seed, n, lo, hi, smooth = 0.55) {
  const r = axRand(seed); const out = []; let v = lo + (hi - lo) * r();
  for (let i = 0; i < n; i++) { v += (lo + (hi - lo) * r() - v) * smooth; out.push(Math.max(lo, Math.min(hi, v))); }
  return out;
}

export const RIDES = [
  { id: 'r1', name: 'Mulholland Run', where: 'Santa Monica Mtns', date: 'Today · 8:42 AM',
    dist: 24.7, dur: '43:21', avg: 34, top: 78, lean: 47, elev: 2840, pr: true, seed: 11,
    route: 'M8 46 C16 30 30 38 34 24 C37 14 28 12 22 16' },
  { id: 'r2', name: 'Coast to Topanga', where: 'PCH · Topanga Cyn', date: 'Yesterday · 5:10 PM',
    dist: 38.2, dur: '1:08:55', avg: 33, top: 71, lean: 41, elev: 3110, pr: false, seed: 27,
    route: 'M10 48 C14 36 26 40 24 28 C22 18 34 16 44 22' },
  { id: 'r3', name: 'Angeles Crest', where: 'CA-2 · La Cañada', date: 'Sat · 7:05 AM',
    dist: 61.4, dur: '1:52:30', avg: 33, top: 84, lean: 52, elev: 6720, pr: false, seed: 39,
    route: 'M8 40 C20 44 18 26 30 30 C40 33 36 14 46 18' },
  { id: 'r4', name: 'Sunday Canyon Loop', where: 'Latigo · Kanan', date: 'Sun · 9:20 AM',
    dist: 29.8, dur: '54:12', avg: 33, top: 69, lean: 44, elev: 3380, pr: false, seed: 53,
    route: 'M10 44 C18 28 30 36 32 22 C33 14 22 12 14 18' },
  { id: 'r5', name: 'Decker Commute', where: 'Westlake', date: 'Fri · 6:48 PM',
    dist: 12.1, dur: '22:04', avg: 33, top: 58, lean: 33, elev: 980, pr: false, seed: 61,
    route: 'M10 46 C22 42 20 28 34 30 C42 31 40 20 46 24' },
];

function PrTag() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 19, padding: '0 7px',
      borderRadius: 5, background: 'rgba(255,107,26,0.14)', border: '1px solid rgba(255,107,26,0.4)' }}>
      <Glyph name="trophy" size={11} color={AX.orange} sw={2} />
      <span style={{ fontFamily: SAIRA, fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
        textTransform: 'uppercase', color: AX.orange }}>PR</span>
    </span>
  );
}

function RideRow({ ride, units, onOpen }) {
  const km = units === 'km';
  const dist = (km ? ride.dist * 1.60934 : ride.dist).toFixed(1);
  const top = Math.round(km ? ride.top * 1.60934 : ride.top);
  return (
    <button onClick={() => onOpen(ride)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px',
      background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18,
      cursor: 'pointer', textAlign: 'left',
    }}>
      <RouteThumb d={ride.route} size={54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: SAIRA, fontSize: 16, fontWeight: 600, color: AX.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ride.name}</span>
          {ride.pr && <PrTag />}
        </div>
        <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginBottom: 8 }}>{ride.date}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[[dist, km ? 'km' : 'mi'], [ride.dur, ''], [top, km ? 'km/h' : 'mph']].map((m, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 19, color: AX.text,
                fontVariantNumeric: 'tabular-nums' }}>{m[0]}</span>
              {m[1] && <span style={{ fontFamily: SAIRA, fontSize: 10.5, fontWeight: 600,
                color: AX.dim, textTransform: 'uppercase' }}>{m[1]}</span>}
            </span>
          ))}
        </div>
      </div>
      <Glyph name="chevron" size={18} color={AX.ghost} sw={2.2} />
    </button>
  );
}

export function ApexHistory({ t, onNavigate, onOpen }) {
  const km = t.units === 'km';
  const totalDist = RIDES.reduce((s, r) => s + r.dist, 0);
  const td = (km ? totalDist * 1.60934 : totalDist).toFixed(0);
  return (
    <Screen tab="history" onNavigate={onNavigate}>
      <ScreenHeader subtitle={`${RIDES.length} rides logged`} title="History"
        right={<HeaderIconBtn name="calendar" />} />

      <div style={{ display: 'flex', gap: 10, padding: '4px 0 18px' }}>
        {[['Distance', td, km ? 'km' : 'mi'], ['Time', '5.4', 'hrs'], ['Top', Math.round(km ? 84 * 1.60934 : 84), km ? 'km/h' : 'mph']].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '14px 16px', background: AX.surface,
            border: `1px solid ${AX.border2}`, borderRadius: 16 }}>
            <Stat label={s[0]} value={s[1]} unit={s[2]} size={28} />
          </div>
        ))}
      </div>

      <SectionLabel>This week</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RIDES.map((r) => <RideRow key={r.id} ride={r} units={t.units} onOpen={onOpen} />)}
      </div>
      <div style={{ height: 8 }} />
    </Screen>
  );
}

function RideMapPanel({ ride, accent }) {
  return (
    <div style={{ position: 'relative', height: 188, borderRadius: 20, overflow: 'hidden',
      background: AX.surface, border: `1px solid ${AX.border2}` }}>
      <svg viewBox="0 0 362 188" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={'h' + i} x1="0" y1={i * 24 + 6} x2="362" y2={i * 24 + 6}
            stroke="rgba(154,164,180,0.10)" strokeWidth="1.4" />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={'v' + i} x1={i * 24 + 6} y1="0" x2={i * 24 + 6} y2="188"
            stroke="rgba(154,164,180,0.10)" strokeWidth="1.4" />
        ))}
        <defs>
          <filter id="rideGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M28 150 C70 110 60 70 120 78 C168 84 150 30 214 44 C262 54 250 120 320 96"
          fill="none" stroke={accent} strokeOpacity="0.32" strokeWidth="11" strokeLinecap="round" filter="url(#rideGlow)" />
        <path d="M28 150 C70 110 60 70 120 78 C168 84 150 30 214 44 C262 54 250 120 320 96"
          fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="150" r="6" fill={AX.bg} stroke={accent} strokeWidth="3" />
        <circle cx="320" cy="96" r="6.5" fill={accent} />
        <circle cx="320" cy="96" r="2.6" fill={AX.bg} />
      </svg>
      <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 7 }}>
        {[['Start', '8:42'], ['End', '9:25']].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px',
            borderRadius: 13, background: 'rgba(12,13,16,0.72)', border: `1px solid ${AX.border}`,
            backdropFilter: 'blur(10px)' }}>
            <span style={{ fontFamily: SAIRA, fontSize: 10, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: AX.faint }}>{m[0]}</span>
            <span style={{ fontFamily: COND, fontSize: 14, fontWeight: 600, color: AX.text }}>{m[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chart({ icon, title, data, accent, unit, peakLabel, fill = false, height = 96 }) {
  const W = 330, H = height, pad = 4;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const stepX = (W - pad * 2) / (data.length - 1);
  const y = (v) => pad + (H - pad * 2) * (1 - (v - min) / span);
  const pts = data.map((v, i) => [pad + i * stepX, y(v)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`;
  const peakI = data.indexOf(max);
  const gid = 'cf-' + title.replace(/\s/g, '');
  return (
    <div style={{ padding: '15px 16px 12px', background: AX.surface, border: `1px solid ${AX.border2}`,
      borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Glyph name={icon} size={16} color={AX.dim} sw={1.9} />
          <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1.2,
            textTransform: 'uppercase', color: AX.dim }}>{title}</span>
        </div>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: SAIRA, fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
            textTransform: 'uppercase', color: AX.faint }}>{peakLabel}</span>
          <span style={{ fontFamily: COND, fontSize: 20, fontWeight: 600, color: AX.text,
            fontVariantNumeric: 'tabular-nums' }}>{Math.round(max)}</span>
          <span style={{ fontFamily: SAIRA, fontSize: 11, fontWeight: 600, color: AX.dim }}>{unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
        {fill && (
          <>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={accent} stopOpacity="0.22" />
                <stop offset="1" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
          </>
        )}
        <path d={line} fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" />
        <circle cx={pts[peakI][0]} cy={pts[peakI][1]} r="3.4" fill={accent} />
      </svg>
    </div>
  );
}

function LeanMaxPanel({ maxL, maxR, accent }) {
  const SPREAD = 1.5, cx = 165, cy = 150, R = 116;
  const pol = (deg, r) => { const rad = ((deg * SPREAD) - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
  const arc = (d0, d1, r) => { const [x0, y0] = pol(d0, r), [x1, y1] = pol(d1, r);
    const sweep = d1 > d0 ? 1 : 0;
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  const lEnd = pol(-maxL, R), rEnd = pol(maxR, R);
  return (
    <div style={{ padding: '16px 16px 18px', background: AX.surface, border: `1px solid ${AX.border2}`,
      borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Glyph name="lean" size={16} color={AX.dim} sw={1.9} />
        <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1.2,
          textTransform: 'uppercase', color: AX.dim, whiteSpace: 'nowrap' }}>Max lean</span>
      </div>
      <svg viewBox="0 0 330 162" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path d={arc(-52, 52, R)} fill="none" stroke="rgba(242,242,240,0.12)" strokeWidth="3" strokeLinecap="round" />
        <path d={arc(0, -maxL, R)} fill="none" stroke={accent} strokeOpacity="0.85" strokeWidth="6" strokeLinecap="round" />
        <path d={arc(0, maxR, R)} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
        {[-45, -30, -15, 0, 15, 30, 45].map((tk) => { const [x0, y0] = pol(tk, R - 2); const [x1, y1] = pol(tk, R - (tk === 0 ? 15 : 9));
          return <line key={tk} x1={x0} y1={y0} x2={x1} y2={y1} strokeLinecap="round"
            stroke={tk === 0 ? 'rgba(242,242,240,0.6)' : 'rgba(242,242,240,0.26)'} strokeWidth={tk === 0 ? 2.2 : 1.4} />; })}
        <line x1={cx} y1={cy} x2={lEnd[0]} y2={lEnd[1]} stroke={accent} strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={rEnd[0]} y2={rEnd[1]} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={accent} />
        <text x="44" y="150" textAnchor="middle" fontFamily="var(--apex-num,'Saira Condensed')" fontWeight="700"
          fontSize="40" fill={AX.text} style={{ fontVariantNumeric: 'tabular-nums' }}>{maxL}°</text>
        <text x="44" y="160" textAnchor="middle" fontFamily="'Saira'" fontWeight="700" fontSize="10"
          letterSpacing="2" fill={AX.faint}>LEFT</text>
        <text x="286" y="150" textAnchor="middle" fontFamily="var(--apex-num,'Saira Condensed')" fontWeight="700"
          fontSize="40" fill={AX.text} style={{ fontVariantNumeric: 'tabular-nums' }}>{maxR}°</text>
        <text x="286" y="160" textAnchor="middle" fontFamily="'Saira'" fontWeight="700" fontSize="10"
          letterSpacing="2" fill={AX.faint}>RIGHT</text>
      </svg>
    </div>
  );
}

export function ApexRideDetail({ ride, t, onBack }) {
  const km = t.units === 'km';
  const cv = (v) => Math.round(km ? v * 1.60934 : v);
  const speed = makeSeries(ride.seed, 40, 12, ride.top, 0.5);
  const elev = makeSeries(ride.seed + 100, 40, ride.elev * 0.2, ride.elev, 0.32);
  const su = km ? 'km/h' : 'mph';
  const eu = km ? 'm' : 'ft';
  const stats = [
    ['Distance', (km ? ride.dist * 1.60934 : ride.dist).toFixed(1), km ? 'km' : 'mi'],
    ['Moving', ride.dur, ''],
    ['Avg speed', cv(ride.avg), su],
    ['Top speed', cv(ride.top), su],
    ['Max lean', ride.lean + '°', ''],
    ['Elev gain', cv(ride.elev), eu],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: AX.bg }}>
      <div className="apex-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '54px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, color: AX.dim }}>
            <Glyph name="back" size={22} color={AX.dim} sw={2.2} />
            <span style={{ fontFamily: SAIRA, fontSize: 15, fontWeight: 500 }}>History</span>
          </button>
          <HeaderIconBtn name="share" />
        </div>
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: COND, fontWeight: 700, fontSize: 30, letterSpacing: -0.3,
              color: AX.text, whiteSpace: 'nowrap', flexShrink: 0 }}>{ride.name}</h1>
            {ride.pr && <span style={{ flexShrink: 0 }}><PrTag /></span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: SAIRA, fontSize: 13, color: AX.faint }}>
            <Glyph name="pin" size={14} color={AX.faint} sw={1.8} />{ride.where} · {ride.date}
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <RideMapPanel ride={ride} accent={t.accent} />
        </div>

        <div style={{ padding: '16px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1,
          background: AX.border2, border: `1px solid ${AX.border2}`, borderRadius: 18, margin: '16px 20px 0', overflow: 'hidden' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: AX.surface, padding: '14px 13px' }}>
              <Stat label={s[0]} value={s[1]} unit={s[2]} size={23} />
            </div>
          ))}
        </div>

        <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LeanMaxPanel maxL={Math.round(ride.lean * 0.9)} maxR={ride.lean} accent={t.accent} />
          <Chart icon="speed" title="Speed" data={speed} accent={t.accent} unit={su} peakLabel="Top" fill />
          <Chart icon="elevation" title="Elevation" data={elev} accent="#8C97A6" unit={eu} peakLabel="Peak" fill />
        </div>
        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
