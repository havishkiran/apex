// apex-nav.jsx — "Follow route" mode. NOT a maps app: a glanceable turn-cue
// banner layered on the instrument theme, fed by the same orange route line and
// the voice-cue system. Full free-form navigation deep-links out to Apple/Google
// Maps; here we own the *ride*, showing the next maneuver in Apex's own language.

const SAIRA_NV = "'Saira', system-ui, sans-serif";
const COND_NV = "var(--apex-num, 'Saira Condensed'), sans-serif";

// curated demo routes. `in` = miles from the previous maneuver to this one.
const ROUTES = {
  'Stunt Rd Loop': { dest: 'Piuma Overlook', remaining: 14.2, etaMin: 38, steps: [
    { dir: 'right', street: 'Stunt Rd', in: 0.2 },
    { dir: 'slight-left', street: 'Schueren Rd', in: 2.1 },
    { dir: 'left', street: 'Mulholland Hwy', in: 3.4 },
    { dir: 'right', street: 'Piuma Rd', in: 5.0 },
    { dir: 'arrive', street: 'Piuma Overlook', in: 3.5 },
  ] },
  'Coast → Topanga': { dest: 'Topanga Lookout', remaining: 21.6, etaMin: 49, steps: [
    { dir: 'right', street: 'Pacific Coast Hwy', in: 0.3 },
    { dir: 'slight-right', street: 'Topanga Cyn Blvd', in: 6.4 },
    { dir: 'left', street: 'Old Topanga Cyn', in: 4.8 },
    { dir: 'right', street: 'Mulholland Dr', in: 6.1 },
    { dir: 'arrive', street: 'Topanga Lookout', in: 4.0 },
  ] },
  'Angeles Crest': { dest: 'Newcomb\u2019s Ranch', remaining: 32.0, etaMin: 64, steps: [
    { dir: 'left', street: 'Angeles Crest Hwy', in: 0.4 },
    { dir: 'straight', street: 'CA-2 E', in: 11.2 },
    { dir: 'slight-right', street: 'Upper Big Tujunga', in: 8.9 },
    { dir: 'arrive', street: 'Newcomb\u2019s Ranch', in: 11.5 },
  ] },
};

// distance formatting in nav idiom: feet/meters when close, else mi/km
function fmtNavDist(mi, units) {
  const km = units === 'km';
  if (km) {
    const m = mi * 1609.34;
    if (m < 950) return { value: String(Math.max(0, Math.round(m / 10) * 10)), unit: 'm' };
    return { value: (m / 1000).toFixed(1), unit: 'km' };
  }
  const ft = mi * 5280;
  if (ft < 1000) return { value: String(Math.max(0, Math.round(ft / 50) * 50)), unit: 'ft' };
  return { value: mi.toFixed(1), unit: 'mi' };
}

function maneuverVerb(dir) {
  return {
    right: 'Turn right onto', left: 'Turn left onto',
    'slight-right': 'Bear right onto', 'slight-left': 'Bear left onto',
    straight: 'Continue on', uturn: 'Make a U-turn onto', arrive: 'Arrive at',
  }[dir] || 'Continue on';
}

// derived nav readouts for the console secondary row
function buildNavMetrics(nav, units) {
  const km = units === 'km';
  const rem = km ? nav.remaining * 1.60934 : nav.remaining;
  const mins = Math.max(1, Math.round(nav.remaining / 28 * 60)); // ~28 mph canyon avg
  return {
    remaining: { label: 'Remaining', value: rem.toFixed(1), unit: km ? 'km' : 'mi' },
    arrive: { label: 'Arrive in', value: String(mins), unit: 'min' },
    eta: { label: 'ETA', value: nav.eta || '—', unit: '' },
  };
}

// ── the turn-cue banner (top of Track while following) ───────────
function TurnBanner({ nav, units, accent, onExit }) {
  const step = nav.step;
  const next = nav.next;
  const arrive = step.dir === 'arrive';
  const d = fmtNavDist(nav.distToTurn, units);
  const imminent = !arrive && nav.distToTurn * 5280 < 600; // < ~600 ft => act now

  return (
    <div style={{ borderRadius: 22, overflow: 'hidden',
      background: 'rgba(15,16,20,0.86)', border: `1px solid ${imminent ? 'rgba(255,107,26,0.5)' : AX.border}`,
      backdropFilter: 'blur(22px) saturate(140%)', WebkitBackdropFilter: 'blur(22px) saturate(140%)',
      boxShadow: '0 14px 38px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '14px 12px 14px 14px' }}>
        {/* maneuver tile — fills orange when it's time to act */}
        <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: imminent ? accent : 'rgba(255,107,26,0.12)',
          border: `1px solid ${imminent ? accent : 'rgba(255,107,26,0.4)'}`,
          animation: imminent ? 'apexManeuver 1.1s ease-in-out infinite' : 'none' }}>
          <Glyph name={arrive ? 'arrive' : 'm-' + step.dir} size={34}
            color={imminent ? '#0C0D10' : accent} sw={2.4} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {arrive ? (
            <div style={{ fontFamily: COND_NV, fontWeight: 700, fontSize: 30, lineHeight: 1, color: AX.text }}>
              Arriving</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontFamily: COND_NV, fontWeight: 700, fontSize: 44, lineHeight: 0.9, color: AX.text,
                fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
              <span style={{ fontFamily: SAIRA_NV, fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
                textTransform: 'uppercase', color: AX.dim }}>{d.unit}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
            <span style={{ fontFamily: SAIRA_NV, fontSize: 14, fontWeight: 500, color: AX.dim,
              whiteSpace: 'nowrap' }}>{maneuverVerb(step.dir)}</span>
            <span style={{ fontFamily: SAIRA_NV, fontSize: 14.5, fontWeight: 700, color: AX.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.street}</span>
          </div>
        </div>

        <button onClick={onExit} aria-label="Exit route" style={{ width: 34, height: 34, borderRadius: 17,
          flexShrink: 0, border: `1px solid ${AX.border}`, background: 'rgba(12,13,16,0.5)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke={AX.dim}
            strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* "then" preview */}
      {next && !arrive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px',
          borderTop: `1px solid ${AX.border2}`, background: 'rgba(10,11,14,0.4)' }}>
          <span style={{ fontFamily: SAIRA_NV, fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: AX.faint }}>Then</span>
          <Glyph name={next.dir === 'arrive' ? 'arrive' : 'm-' + next.dir} size={16} color={AX.dim} sw={2.2} />
          <span style={{ fontFamily: SAIRA_NV, fontSize: 13, fontWeight: 600, color: AX.dim,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{next.street}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TurnBanner, APEX_ROUTES: ROUTES, buildNavMetrics, fmtNavDist, maneuverVerb });
