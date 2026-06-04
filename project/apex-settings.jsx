// apex-settings.jsx — grouped settings in the instrument theme. Orange marks
// "on/active" toggles and the active segment, consistent with the suite.
// Units row is wired to the live units tweak. About surfaces the Apex wordmark.

const { useState: useStateS } = React;

const SAIRA_S = "'Saira', system-ui, sans-serif";
const COND_S = "var(--apex-num, 'Saira Condensed'), sans-serif";

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{
      width: 48, height: 29, borderRadius: 15, border: 'none', cursor: 'pointer', padding: 2,
      background: on ? AX.orange : AX.border, transition: 'background .2s', flexShrink: 0,
      display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', alignItems: 'center',
    }}>
      <span style={{ width: 25, height: 25, borderRadius: 13, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 11, background: AX.bg,
      border: `1px solid ${AX.border2}` }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button key={o} onClick={() => onChange(o)} style={{
            minWidth: 42, height: 26, padding: '0 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: on ? AX.orange : 'transparent', color: on ? '#0E1014' : AX.dim,
            fontFamily: SAIRA_S, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            transition: 'background .15s',
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function Row({ icon, label, sub, right, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px',
      borderBottom: last ? 'none' : `1px solid ${AX.border2}` }}>
      {icon && (
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: AX.bg,
          border: `1px solid ${AX.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Glyph name={icon} size={17} color={AX.dim} sw={1.8} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SAIRA_S, fontSize: 15, fontWeight: 500, color: AX.text }}>{label}</div>
        {sub && <div style={{ fontFamily: SAIRA_S, fontSize: 12, color: AX.faint, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Group({ children }) {
  return (
    <div style={{ background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18,
      overflow: 'hidden' }}>{children}</div>
  );
}

function ValueChevron({ value }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {value && <span style={{ fontFamily: SAIRA_S, fontSize: 14, color: AX.dim }}>{value}</span>}
      <Glyph name="chevron" size={16} color={AX.ghost} sw={2.2} />
    </span>
  );
}

function ApexSettings({ t, onNavigate, onSetUnits, onSetTweak }) {
  const [autoStart, setAutoStart] = useStateS(true);
  const [autoPause, setAutoPause] = useStateS(true);
  const [keepAwake, setKeepAwake] = useStateS(true);
  const set = onSetTweak || (() => {});
  const crashOn = t.crashDetect !== false;
  const cuesOn = t.voiceCues !== false;
  const em = window.APEX_EMERGENCY || { name: 'Sam Rivera', phone: '' };

  return (
    <Screen tab="settings" onNavigate={onNavigate}>
      <ScreenHeader subtitle="Apex Pro" title="Settings" />

      {/* rider profile */}
      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 14,
        background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18, cursor: 'pointer',
        textAlign: 'left', marginBottom: 18 }}>
        <image-slot id="apex-rider-avatar" shape="circle" style={{ width: '56px', height: '56px', flexShrink: 0 }}
          placeholder="You"></image-slot>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: COND_S, fontWeight: 700, fontSize: 22, color: AX.text, lineHeight: 1.1 }}>Rider</div>
          <div style={{ fontFamily: SAIRA_S, fontSize: 13, color: AX.faint }}>Edit profile · Apex Pro member</div>
        </div>
        <Glyph name="chevron" size={18} color={AX.ghost} sw={2.2} />
      </button>

      <SectionLabel>Recording</SectionLabel>
      <Group>
        <Row icon="track" label="Auto-start detection" sub="Begin a ride when motion is sensed"
          right={<Switch on={autoStart} onClick={() => setAutoStart(!autoStart)} />} />
        <Row icon="gauge" label="Auto-pause" sub="Pause when stopped over 30s"
          right={<Switch on={autoPause} onClick={() => setAutoPause(!autoPause)} />} last />
      </Group>

      <SectionLabel style={{ padding: '20px 4px 10px' }}>Safety</SectionLabel>
      <Group>
        <Row icon="shield" label="Crash detection" sub="Auto-alert your contact after a fall"
          right={<Switch on={crashOn} onClick={() => set('crashDetect', !crashOn)} />} />
        <Row icon="heart" label="Emergency contact"
          right={<ValueChevron value={em.name} />} />
        <Row icon="lock" label="Auto-lock while riding" sub={`Above ${t.lockSpeed == null ? 35 : t.lockSpeed} mph`}
          right={<Switch on={t.safety !== false} onClick={() => set('safety', t.safety === false)} />} last />
      </Group>

      <SectionLabel style={{ padding: '20px 4px 10px' }}>Display & cues</SectionLabel>
      <Group>
        <Row icon="moon" label="Keep screen awake" sub="While recording a ride"
          right={<Switch on={keepAwake} onClick={() => setKeepAwake(!keepAwake)} />} />
        <Row icon="bell" label="Voice cues" sub="Spoken stat callouts, eyes on the road"
          right={<Switch on={cuesOn} onClick={() => set('voiceCues', !cuesOn)} />} />
        <Row icon="distance" label="Units"
          right={<Segmented value={t.units} options={['mi', 'km']} onChange={onSetUnits} />} last />
      </Group>

      <SectionLabel style={{ padding: '20px 4px 10px' }}>Account</SectionLabel>
      <Group>
        <Row icon="trophy" label="Apex Pro" right={<ValueChevron value="Active" />} />
        <Row icon="share" label="Export rides" sub="GPX · CSV" right={<ValueChevron />} />
        <Row icon="shield" label="Privacy" right={<ValueChevron />} last />
      </Group>

      {/* about / brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '34px 0 16px' }}>
        <ApexWordmark height={26} color={AX.text} accent={t.accent} />
        <span style={{ fontFamily: SAIRA_S, fontSize: 12, color: AX.faint, letterSpacing: 0.4 }}>
          Version 1.0 · Ride logged, lean noted.</span>
      </div>
    </Screen>
  );
}

Object.assign(window, { ApexSettings });
