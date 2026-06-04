// apex-safety.jsx — crash-detection emergency flow + audio/haptic ride cues.
// Crash alert is the one place the orange "live/alert" semantic earns its
// loudest use: a full-screen takeover that auto-alerts your emergency contact
// unless you cancel. Voice/haptic cues are spoken stat callouts so a rider
// never looks down — the toast is the *visual proxy* for what's spoken aloud.

const { useState: useStateSf, useEffect: useEffectSf, useRef: useRefSf } = React;

const SAIRA_SF = "'Saira', system-ui, sans-serif";
const COND_SF = "var(--apex-num, 'Saira Condensed'), sans-serif";

const EMERGENCY = { name: 'Sam Rivera', rel: 'Emergency contact', phone: '+1 (415) 555‑0142' };

// ── Crash alert ──────────────────────────────────────────────────
// phases: 'counting' (ring drains, cancellable) → 'alerting' → 'sent'
function CrashAlert({ onDismiss }) {
  const TOTAL = 15;
  const [phase, setPhase] = useStateSf('counting');
  const [left, setLeft] = useStateSf(TOTAL);
  const t0 = useRefSf(performance.now());
  const raf = useRefSf(0);
  const phaseRef = useRefSf('counting');
  phaseRef.current = phase;

  useEffectSf(() => {
    const tick = () => {
      if (phaseRef.current !== 'counting') return;
      const elapsed = (performance.now() - t0.current) / 1000;
      const rem = Math.max(0, TOTAL - elapsed);
      setLeft(rem);
      if (rem <= 0) { setPhase('alerting'); setTimeout(() => setPhase('sent'), 2600); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    // belt-and-suspenders timer in case rAF is throttled
    const guard = setTimeout(() => {
      if (phaseRef.current === 'counting') { setPhase('alerting'); setTimeout(() => setPhase('sent'), 2600); }
    }, TOTAL * 1000 + 200);
    return () => { cancelAnimationFrame(raf.current); clearTimeout(guard); };
  }, []);

  const p = left / TOTAL;
  const R = 132, CIRC = 2 * Math.PI * R;
  const counting = phase === 'counting';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at 50% 38%, rgba(46,16,4,0.96), rgba(10,7,6,0.98))',
      animation: 'apexCrashIn .3s ease' }}>
      {/* pulsing alert field */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 38%, rgba(255,107,26,0.18), transparent 60%)',
        animation: counting ? 'apexAlertPulse 1.1s ease-in-out infinite' : 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 30px', position: 'relative', zIndex: 2 }}>

        {counting && (
          <>
            <div style={{ fontFamily: SAIRA_SF, fontSize: 13, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: AX.orange, marginBottom: 18 }}>Crash detected</div>

            <div style={{ position: 'relative', width: 296, height: 296, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
              <svg width="296" height="296" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="148" cy="148" r={R} fill="none" stroke="rgba(255,107,26,0.16)" strokeWidth="8" />
                <circle cx="148" cy="148" r={R} fill="none" stroke={AX.orange} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - p)} />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontFamily: COND_SF, fontWeight: 700, fontSize: 124, lineHeight: 0.85,
                  color: AX.text, fontVariantNumeric: 'tabular-nums' }}>{Math.ceil(left)}</span>
                <span style={{ fontFamily: SAIRA_SF, fontSize: 13, fontWeight: 600, letterSpacing: 2,
                  textTransform: 'uppercase', color: AX.dim, marginTop: 2 }}>Seconds</span>
              </div>
            </div>

            <p style={{ fontFamily: SAIRA_SF, fontSize: 16, lineHeight: 1.5, color: AX.dim, textAlign: 'center',
              margin: '0 0 4px', maxWidth: 300 }}>
              Alerting <span style={{ color: AX.text, fontWeight: 600 }}>{EMERGENCY.name}</span> with your live
              location unless you respond.</p>
          </>
        )}

        {phase === 'alerting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <span className="apex-radiate" style={{ width: 96, height: 96, borderRadius: 48,
              border: `2px solid ${AX.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Glyph name="shield" size={42} color={AX.orange} sw={1.8} />
            </span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: COND_SF, fontWeight: 700, fontSize: 34, color: AX.text }}>Sending alert…</div>
              <div style={{ fontFamily: SAIRA_SF, fontSize: 15, color: AX.dim, marginTop: 4 }}>
                Notifying {EMERGENCY.name} · sharing location</div>
            </div>
          </div>
        )}

        {phase === 'sent' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <span style={{ width: 96, height: 96, borderRadius: 48, background: 'rgba(255,107,26,0.14)',
              border: `2px solid ${AX.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Glyph name="check" size={46} color={AX.orange} sw={2.4} />
            </span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: COND_SF, fontWeight: 700, fontSize: 34, color: AX.text }}>Help is on the way</div>
              <div style={{ fontFamily: SAIRA_SF, fontSize: 15, color: AX.dim, marginTop: 4, lineHeight: 1.5 }}>
                {EMERGENCY.name} was sent your location near<br />Mulholland Hwy &amp; Stunt Rd.</div>
            </div>
          </div>
        )}
      </div>

      {/* location chip (during count) */}
      {counting && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px',
            borderRadius: 17, background: 'rgba(12,13,16,0.55)', border: `1px solid ${AX.border}` }}>
            <Glyph name="pin" size={14} color={AX.dim} sw={1.8} />
            <span style={{ fontFamily: SAIRA_SF, fontSize: 12.5, fontWeight: 500, color: AX.dim }}>
              Mulholland Hwy &amp; Stunt Rd</span>
          </div>
        </div>
      )}

      {/* actions */}
      <div style={{ flexShrink: 0, padding: '0 24px 40px', position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', gap: 12 }}>
        {counting ? (
          <>
            <button onClick={onDismiss} style={{ height: 64, borderRadius: 18, border: 'none', cursor: 'pointer',
              background: AX.orange, color: '#0C0D10', fontFamily: SAIRA_SF, fontSize: 19, fontWeight: 700,
              letterSpacing: 0.5, boxShadow: '0 10px 30px rgba(255,107,26,0.4)' }}>I'm OK — Cancel</button>
            <button onClick={() => {}} style={{ height: 54, borderRadius: 18, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${AX.border}`, color: AX.text,
              fontFamily: SAIRA_SF, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 9 }}>
              <Glyph name="shield" size={18} color={AX.text} sw={1.9} />Call 911 now</button>
          </>
        ) : (
          <>
            {phase === 'sent' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, borderRadius: 18,
                background: AX.surface, border: `1px solid ${AX.border2}`, marginBottom: 2 }}>
                <div style={{ width: 46, height: 46, borderRadius: 23, background: AX.bg,
                  border: `1px solid ${AX.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: COND_SF, fontSize: 20, fontWeight: 700, color: AX.dim }}>SR</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SAIRA_SF, fontSize: 15.5, fontWeight: 600, color: AX.text }}>{EMERGENCY.name}</div>
                  <div style={{ fontFamily: SAIRA_SF, fontSize: 12.5, color: AX.faint }}>Notified · {EMERGENCY.phone}</div>
                </div>
                <Glyph name="check" size={20} color={AX.orange} sw={2.4} />
              </div>
            )}
            <button onClick={onDismiss} style={{ height: 60, borderRadius: 18, border: `1px solid ${AX.border}`,
              cursor: 'pointer', background: phase === 'sent' ? AX.orange : 'transparent',
              color: phase === 'sent' ? '#0C0D10' : AX.text, fontFamily: SAIRA_SF, fontSize: 17, fontWeight: 700 }}>
              {phase === 'sent' ? 'Done' : 'Cancel alert'}</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes apexCrashIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes apexAlertPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .apex-radiate { animation: apexRadiate 1.4s ease-out infinite; }
        @keyframes apexRadiate {
          0% { box-shadow: 0 0 0 0 rgba(255,107,26,0.5); }
          70% { box-shadow: 0 0 0 26px rgba(255,107,26,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,26,0); }
        }
      `}</style>
    </div>
  );
}

// ── Voice / haptic cue toast ─────────────────────────────────────
// Spoken stat callouts (every few mins, or on milestones). The chip is the
// visual proxy of what's read aloud; the waveform marks it as audio, not UI.
function VoiceCue({ text, accent }) {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 44, padding: '0 16px 0 12px',
      borderRadius: 22, background: 'rgba(12,13,16,0.78)', border: `1px solid ${AX.border}`,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      animation: 'apexCueIn .35s cubic-bezier(.2,.7,.3,1)', pointerEvents: 'none' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 18 }}>
        {[0.4, 0.85, 0.55, 1, 0.6].map((h, i) => (
          <span key={i} className="apex-wave" style={{ width: 2.5, height: `${h * 18}px`, borderRadius: 2,
            background: accent, animationDelay: `${i * 0.12}s` }} />
        ))}
      </span>
      <span style={{ fontFamily: SAIRA_SF, fontSize: 13.5, fontWeight: 600, letterSpacing: 0.2, color: AX.text,
        whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

Object.assign(window, { CrashAlert, VoiceCue, APEX_EMERGENCY: EMERGENCY });
