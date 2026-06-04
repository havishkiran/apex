import { useState, useEffect, useRef } from 'react';
import { AX } from '../tokens';
import { Glyph } from './Glyph';
import { Bars, TabBar } from './shared';
import { ApexMap } from './ApexMap';
import { TurnBanner, buildNavMetrics } from './ApexNav';
import { VoiceCue } from './ApexSafety';

const C = AX;

function GpsChip({ source, level, battery, recording }) {
  const external = source === 'external';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, height: 34, padding: '0 13px',
      borderRadius: 17, background: 'rgba(12,13,16,0.62)',
      border: `1px solid ${C.border}`,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }}>
      <Glyph name={external ? 'devices' : 'satellite'} size={15} color={recording ? C.text : C.dim} sw={1.8} />
      <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 11.5, fontWeight: 600,
        letterSpacing: 0.7, textTransform: 'uppercase', color: C.dim }}>
        {external ? 'External' : 'Phone'}
      </span>
      <Bars level={level} color={level >= 3 ? C.text : C.dim} />
      {external && battery != null && (
        <>
          <span style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 12, fontWeight: 600,
            color: C.dim, fontVariantNumeric: 'tabular-nums' }}>{battery}%</span>
        </>
      )}
    </div>
  );
}

function IconBtn({ name, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 22, border: `1px solid ${C.border}`,
      background: 'rgba(12,13,16,0.62)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', padding: 0,
    }}>
      <Glyph name={name} size={20} color={C.dim} sw={1.9} />
    </button>
  );
}

function LockedPill() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7, height: 30, padding: '0 14px',
      borderRadius: 15, background: 'rgba(255,107,26,0.13)',
      border: '1px solid rgba(255,107,26,0.5)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }}>
      <Glyph name="lock" size={13} color={C.orange} sw={2.2} />
      <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 11.5, fontWeight: 700,
        letterSpacing: 1.4, textTransform: 'uppercase', color: C.orange }}>Riding</span>
    </div>
  );
}

function RecPill({ recording }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7, height: 30, padding: '0 13px',
      borderRadius: 15, background: 'rgba(12,13,16,0.62)',
      border: `1px solid ${recording ? 'rgba(255,107,26,0.5)' : C.border}`,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 4,
        background: recording ? C.orange : C.faint,
        boxShadow: recording ? `0 0 8px ${C.orange}` : 'none',
        animation: recording ? 'apexBlink 1.4s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 11.5, fontWeight: 700,
        letterSpacing: 1.2, textTransform: 'uppercase',
        color: recording ? C.text : C.dim }}>
        {recording ? 'Rec' : 'Ready'}
      </span>
    </div>
  );
}

function fmtTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

function buildMetrics(st, units) {
  const km = units === 'km';
  const sp = km ? st.speed * 1.60934 : st.speed;
  const ds = km ? st.dist * 1.60934 : st.dist;
  const av = km ? st.avg * 1.60934 : st.avg;
  return {
    speed: { label: 'Speed', value: String(Math.round(sp)), unit: km ? 'km/h' : 'mph' },
    distance: { label: 'Distance', value: ds.toFixed(1), unit: km ? 'km' : 'mi' },
    time: { label: 'Elapsed', value: fmtTime(st.elapsed), unit: '' },
    avg: { label: 'Avg', value: String(Math.round(av)), unit: km ? 'km/h' : 'mph' },
    lean: { label: 'Lean', value: Math.round(Math.abs(st.lean || 0)) + '°', unit: '' },
  };
}

function RecordButton({ recording, onToggle }) {
  return (
    <button onClick={onToggle} aria-label={recording ? 'Stop ride' : 'Start ride'} style={{
      width: 78, height: 78, borderRadius: 39, padding: 0, cursor: 'pointer',
      position: 'relative', flexShrink: 0,
      border: recording ? `4px solid ${C.orange}` : 'none',
      background: recording ? 'rgba(12,13,16,0.5)' : C.orange,
      boxShadow: recording
        ? `0 0 0 0 rgba(255,107,26,0.5)`
        : `0 8px 26px rgba(255,107,26,0.42), inset 0 1px 0 rgba(255,255,255,0.25)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: recording ? 'apexPulse 2s ease-out infinite' : 'none',
      transition: 'background .2s, border-color .2s',
    }}>
      {recording
        ? <span style={{ width: 26, height: 26, borderRadius: 7, background: C.orange }} />
        : <svg width="30" height="30" viewBox="0 0 30 30"><path d="M11 7.5 L23 15 L11 22.5 Z" fill="#0C0D10" /></svg>}
    </button>
  );
}

function LeanGauge({ angle = 0, accent, scale = 1 }) {
  const VMAX = 50, SPREAD = 1.5, cx = 140, cy = 134, R = 104;
  const a = Math.max(-VMAX, Math.min(VMAX, angle));
  const pol = (deg, r) => { const rad = ((deg * SPREAD) - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
  const arc = (d0, d1, r) => { const [x0, y0] = pol(d0, r), [x1, y1] = pol(d1, r);
    const large = Math.abs((d1 - d0) * SPREAD) > 180 ? 1 : 0; const sweep = d1 > d0 ? 1 : 0;
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  const ticks = [-45, -30, -15, 0, 15, 30, 45];
  const side = a > 1.5 ? 'Lean R' : a < -1.5 ? 'Lean L' : 'Upright';
  const [nx, ny] = pol(a, R);
  return (
    <svg viewBox="0 0 280 176" style={{ width: 252 * scale, maxWidth: '78%', height: 'auto', display: 'block' }}>
      <path d={arc(-VMAX, VMAX, R)} fill="none" stroke="rgba(242,242,240,0.16)" strokeWidth="3" strokeLinecap="round" />
      <path d={arc(0, a, R)} fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
      {ticks.map((tk) => { const [x0, y0] = pol(tk, R - 2); const [x1, y1] = pol(tk, R - (tk === 0 ? 17 : 10));
        return <line key={tk} x1={x0} y1={y0} x2={x1} y2={y1} strokeLinecap="round"
          stroke={tk === 0 ? 'rgba(242,242,240,0.75)' : 'rgba(242,242,240,0.3)'} strokeWidth={tk === 0 ? 2.6 : 1.6} />; })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6.5" fill={accent} />
      <circle cx={nx} cy={ny} r="6" fill={accent} /><circle cx={nx} cy={ny} r="2.6" fill="#0E1014" />
      <text x={cx} y={cy + 30} textAnchor="middle" fontFamily="var(--apex-num,'Saira Condensed')"
        fontWeight="700" fontSize="34" fill="#F2F2F0" style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(Math.abs(a))}°</text>
      <text x={cx} y={cy + 44} textAnchor="middle" fontFamily="'Saira',sans-serif" fontWeight="600"
        fontSize="10.5" letterSpacing="2.4" fill="rgba(242,242,240,0.5)">{side.toUpperCase()}</text>
    </svg>
  );
}

function HoldToUnlock({ onUnlock, accent }) {
  const [p, setP] = useState(0);
  const raf = useRef(0), to = useRef(0), t0 = useRef(0), done = useRef(false);
  const HOLD = 850;
  const finish = () => { if (!done.current) { done.current = true; onUnlock(); } setP(0); };
  const begin = (e) => {
    e.preventDefault(); done.current = false; t0.current = performance.now();
    to.current = setTimeout(finish, HOLD);
    const tick = () => { const pr = Math.min(1, (performance.now() - t0.current) / HOLD); setP(pr);
      if (pr < 1) raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
  };
  const end = () => { cancelAnimationFrame(raf.current); clearTimeout(to.current); if (!done.current) setP(0); };
  const RR = 15, CIRC = 2 * Math.PI * RR;
  return (
    <button onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      style={{ display: 'flex', alignItems: 'center', gap: 12, height: 58, padding: '0 24px 0 12px',
        borderRadius: 29, border: `1px solid ${C.border}`, background: 'rgba(12,13,16,0.72)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', cursor: 'pointer',
        touchAction: 'none', pointerEvents: 'auto' }}>
      <span style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="20" cy="20" r={RR} fill="none" stroke="rgba(242,242,240,0.18)" strokeWidth="3" />
          <circle cx="20" cy="20" r={RR} fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - p)} />
        </svg>
        <Glyph name="lock" size={18} color={C.text} sw={2} />
      </span>
      <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.dim }}>Hold to unlock</span>
    </button>
  );
}

function LockedView({ st, t, accent, onUnlock, cue }) {
  const m = buildMetrics(st, t.units);
  const speed = m.speed;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 116, flexShrink: 0, position: 'relative' }}>
        {cue && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex',
          justifyContent: 'center' }}><VoiceCue text={cue} accent={accent} /></div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 4 }}>
        <LeanGauge angle={st.lean} accent={accent} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
          <span style={{ fontFamily: "var(--apex-num, 'Saira Condensed'), sans-serif", fontWeight: 700,
            fontSize: 132, lineHeight: 0.8, letterSpacing: -3, color: C.text,
            fontVariantNumeric: 'tabular-nums', textShadow: '0 6px 40px rgba(0,0,0,0.6)' }}>{speed.value}</span>
          <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 19, fontWeight: 600,
            letterSpacing: 1, textTransform: 'uppercase', color: C.dim, marginBottom: 14 }}>{speed.unit}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '0 28px 40px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', gap: 44 }}>
          {['distance', 'time'].map((k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: 1.6, textTransform: 'uppercase', color: C.faint }}>{m[k].label}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: "var(--apex-num, 'Saira Condensed'), sans-serif", fontWeight: 600,
                  fontSize: 40, lineHeight: 1, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{m[k].value}</span>
                {m[k].unit && <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 14, fontWeight: 600,
                  color: C.dim, textTransform: 'uppercase' }}>{m[k].unit}</span>}
              </span>
            </div>
          ))}
        </div>
        <HoldToUnlock onUnlock={onUnlock} accent={accent} />
      </div>
    </div>
  );
}

function Console({ st, t, recording, onToggle, nav }) {
  const m = buildMetrics(st, t.units);
  const order = ['speed', 'distance', 'time', 'avg'];
  const hero = m[t.hero] || m.speed;
  const secondary = nav
    ? (() => { const nm = buildNavMetrics(nav, t.units); return [nm.remaining, nm.arrive, nm.eta]; })()
    : order.filter((k) => k !== t.hero).map((k) => m[k]);
  const idleDim = recording ? 1 : 0.4;

  return (
    <div style={{
      borderTopLeftRadius: 30, borderTopRightRadius: 30,
      borderTop: `1px solid ${C.border}`,
      background: 'rgba(15,16,20,0.78)',
      backdropFilter: 'blur(22px) saturate(140%)', WebkitBackdropFilter: 'blur(22px) saturate(140%)',
      padding: '22px 24px 18px', position: 'relative',
      boxShadow: '0 -18px 40px rgba(0,0,0,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, opacity: idleDim, transition: 'opacity .25s' }}>
          <span style={{
            fontFamily: "var(--apex-num, 'Saira Condensed'), sans-serif", fontWeight: 700,
            fontSize: t.hero === 'time' ? 78 : 104, lineHeight: 0.82,
            letterSpacing: -1, color: C.text, fontVariantNumeric: 'tabular-nums',
          }}>{hero.value}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
            {hero.unit && <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 17, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase', color: C.dim }}>{hero.unit}</span>}
            <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: 1.6, textTransform: 'uppercase', color: C.faint }}>{hero.label}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <RecordButton recording={recording} onToggle={onToggle} />
          <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
            color: recording ? C.dim : C.orange }}>{recording ? 'Stop' : 'Start'}</span>
        </div>
      </div>

      <div style={{ height: 1, background: C.border, margin: '18px 0 14px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', opacity: nav ? 1 : idleDim, transition: 'opacity .25s' }}>
        {secondary.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 11, fontWeight: 600,
              letterSpacing: 1.4, textTransform: 'uppercase', color: C.faint }}>{s.label}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontFamily: "var(--apex-num, 'Saira Condensed'), sans-serif", fontWeight: 600, fontSize: 30,
                lineHeight: 1, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              {s.unit && <span style={{ fontFamily: "'Saira', sans-serif", fontSize: 12, fontWeight: 600,
                color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApexTrack({ st, t, recording, onToggle, onNavigate, cue, nav, onExitRoute }) {
  const [manualUnlock, setManualUnlock] = useState(false);
  const lockSpeed = t.lockSpeed == null ? 35 : t.lockSpeed;
  const safetyOn = t.safety !== false;
  const lockedRef = useRef(false);
  let shouldLock = false;
  if (safetyOn && recording) {
    if (st.speed >= lockSpeed) shouldLock = true;
    else if (st.speed < lockSpeed - 7) shouldLock = false;
    else shouldLock = lockedRef.current;
  }
  lockedRef.current = shouldLock;
  const locked = shouldLock && !manualUnlock;
  useEffect(() => { if (!shouldLock) setManualUnlock(false); }, [shouldLock]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <ApexMap recording={recording} accent={t.accent}
        following={!!nav && !locked} turnDir={nav ? nav.step.dir : 'right'} />

      {locked && <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 46%, rgba(10,11,14,0.62), rgba(10,11,14,0.86))' }} />}

      {nav && !locked ? (
        <div style={{ position: 'absolute', top: 56, left: 14, right: 14, zIndex: 6 }}>
          <TurnBanner nav={nav} units={t.units} accent={t.accent} onExit={onExitRoute} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <GpsChip source={t.gps} level={t.gps === 'external' ? 4 : 3} battery={84} recording={recording} />
            <IconBtn name="recenter" />
          </div>
        </div>
      ) : (
        <div style={{
          position: 'absolute', top: 64, left: 16, right: 16, zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <GpsChip source={t.gps} level={t.gps === 'external' ? 4 : 3}
            battery={84} recording={recording} />
          <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            {locked ? <LockedPill /> : <RecPill recording={recording} />}
          </div>
          {!locked && <IconBtn name="recenter" />}
        </div>
      )}

      {locked ? (
        <LockedView st={st} t={t} accent={t.accent} onUnlock={() => setManualUnlock(true)} cue={cue} />
      ) : (
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 3 }}>
          {cue && recording && <div style={{ position: 'absolute', left: 0, right: 0, top: -56, display: 'flex',
            justifyContent: 'center', zIndex: 5 }}><VoiceCue text={cue} accent={t.accent} /></div>}
          <Console st={st} t={t} recording={recording} onToggle={onToggle} nav={nav} />
          <TabBar active="track" onNavigate={onNavigate} />
        </div>
      )}

      <style>{`
        @keyframes apexManeuver { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,26,0.5); } 60% { box-shadow: 0 0 0 12px rgba(255,107,26,0); } }
        @keyframes apexPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,107,26,0.45); }
          70%  { box-shadow: 0 0 0 16px rgba(255,107,26,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,26,0); }
        }
      `}</style>
    </div>
  );
}
