import { useState, useEffect } from 'react';
import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';
import { SectionLabel, ScreenHeader, Screen } from './shared';
import { ApexWordmark } from './ApexLogo';
import { storage, compressImage } from '../native/storage';

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
            fontFamily: SAIRA, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
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
        <div style={{ fontFamily: SAIRA, fontSize: 15, fontWeight: 500, color: AX.text }}>{label}</div>
        {sub && <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginTop: 1 }}>{sub}</div>}
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

function InlineEdit({ value, placeholder, onSave, inputStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (editing) {
    return (
      <input autoFocus value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft.trim()); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
        style={{ fontFamily: SAIRA, fontSize: 15, color: AX.text, background: 'transparent',
          border: 'none', borderBottom: `1px solid ${AX.orange}`, outline: 'none',
          minWidth: 80, ...inputStyle }} />
    );
  }
  return (
    <span onClick={() => { setDraft(value || ''); setEditing(true); }}
      style={{ fontFamily: SAIRA, fontSize: 15, color: value ? AX.text : AX.faint,
        cursor: 'text', borderBottom: `1px dashed ${AX.border}`, ...inputStyle }}>
      {value || placeholder}
    </span>
  );
}

function AvatarSlot({ src, onSave }) {
  const handleClick = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const b64 = await compressImage(file);
      onSave(b64);
    };
    input.click();
  };
  return (
    <div onClick={handleClick} style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
      background: AX.bg, border: `1px solid ${AX.border}`, cursor: 'pointer', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Glyph name="helmet" size={24} color={AX.ghost} sw={1.6} />}
    </div>
  );
}

function exportCSV() {
  try {
    const rides = JSON.parse(localStorage.getItem('apex_rides') || '[]');
    if (rides.length === 0) { alert('No rides to export yet.'); return; }
    const header = 'Date,Bike,Distance (mi),Duration (s),Avg Speed (mph),Top Speed (mph),Max Lean (deg)';
    const rows = rides.map(r => [
      r.date || '', r.bike || '',
      (r.dist || 0).toFixed(2), r.elapsed || 0,
      Math.round(r.avg || 0), Math.round(r.maxSpeed || 0), Math.round(r.maxLean || 0),
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'apex-rides.csv'; a.click();
  } catch (e) { console.error(e); }
}

export function ApexSettings({ t, onNavigate, onSetUnits, onSetTweak }) {
  const [profile, setProfile] = useState({ name: '', avatar: null });
  const [emergency, setEmergency] = useState({ name: '', phone: '' });
  const [autoStart, setAutoStart] = useState(true);
  const [autoPause, setAutoPause] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);
  const set = onSetTweak || (() => {});
  const crashOn = t.crashDetect !== false;
  const cuesOn = t.voiceCues !== false;

  useEffect(() => {
    setProfile(storage.getProfile());
    setEmergency(storage.getEmergency());
  }, []);

  const saveProfile = (updates) => {
    const p = { ...profile, ...updates };
    setProfile(p); storage.saveProfile(p);
  };

  const saveEmergency = (updates) => {
    const e = { ...emergency, ...updates };
    setEmergency(e); storage.saveEmergency(e);
  };

  return (
    <Screen tab="settings" onNavigate={onNavigate}>
      <ScreenHeader subtitle="Your profile" title="Settings" />

      {/* Profile */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 14,
        background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18, marginBottom: 18 }}>
        <AvatarSlot src={profile.avatar} onSave={(avatar) => saveProfile({ avatar })} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineEdit value={profile.name} placeholder="Your name"
            onSave={(name) => saveProfile({ name })}
            inputStyle={{ fontSize: 20, fontFamily: COND, fontWeight: 700 }} />
          <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginTop: 4 }}>
            Tap name or photo to edit
          </div>
        </div>
      </div>

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
          right={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <InlineEdit value={emergency.name} placeholder="Contact name"
                onSave={(name) => saveEmergency({ name })} />
              <InlineEdit value={emergency.phone} placeholder="Phone number"
                onSave={(phone) => saveEmergency({ phone })}
                inputStyle={{ fontSize: 12, color: AX.dim }} />
            </div>
          } />
        <Row icon="lock" label="Auto-lock while riding"
          sub={`Above ${t.lockSpeed == null ? 35 : t.lockSpeed} mph`}
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

      <SectionLabel style={{ padding: '20px 4px 10px' }}>Data</SectionLabel>
      <Group>
        <Row icon="share" label="Export rides" sub="Downloads ride history as CSV"
          right={
            <button onClick={exportCSV} style={{ height: 30, padding: '0 14px', borderRadius: 15,
              border: `1px solid ${AX.border}`, background: 'transparent', cursor: 'pointer',
              fontFamily: SAIRA, fontSize: 12.5, fontWeight: 600, color: AX.text }}>
              Export
            </button>
          } />
        <Row icon="shield" label="Privacy" sub="All data stored on-device only"
          right={<span style={{ fontFamily: SAIRA, fontSize: 13, color: AX.dim }}>On-device</span>} last />
      </Group>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '34px 0 16px' }}>
        <ApexWordmark height={26} color={AX.text} accent={t.accent} />
        <span style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, letterSpacing: 0.4 }}>
          Version 1.0 · Ride logged, lean noted.
        </span>
      </div>
    </Screen>
  );
}
