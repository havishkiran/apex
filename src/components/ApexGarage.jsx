import { useState, useEffect } from 'react';
import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';
import { SectionLabel, ScreenHeader, HeaderIconBtn, Screen } from './shared';
import { storage, compressImage } from '../native/storage';

function fmtMi(mi, km) {
  const v = km ? mi * 1.60934 : mi;
  return Math.round(v).toLocaleString();
}

function ImageSlot({ src, onSave, radius = 12, width = '100%', height = '186px', placeholder = '' }) {
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
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) { const b64 = await compressImage(file); onSave(b64); }
  };
  return (
    <div onClick={handleClick} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
      style={{ width, height, borderRadius: radius, overflow: 'hidden', position: 'relative',
        background: 'rgba(242,242,240,0.06)', cursor: 'pointer', flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="rgba(242,242,240,0.28)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            {placeholder && <span style={{ fontFamily: SAIRA, fontSize: 11,
              color: 'rgba(242,242,240,0.28)', textAlign: 'center', padding: '0 12px' }}>{placeholder}</span>}
          </div>}
    </div>
  );
}

function ActiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px',
      borderRadius: 12, background: 'rgba(255,107,26,0.14)', border: '1px solid rgba(255,107,26,0.45)' }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: AX.orange, boxShadow: `0 0 7px ${AX.orange}` }} />
      <span style={{ fontFamily: SAIRA, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: AX.orange }}>Active</span>
    </span>
  );
}

function EditableOdo({ value, units, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const km = units === 'km';
  if (editing) {
    return (
      <input autoFocus type="number" value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft);
          if (!isNaN(n)) onChange(km ? n / 1.60934 : n);
          setEditing(false);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
        style={{ width: 90, fontFamily: COND, fontWeight: 700, fontSize: 26, color: AX.orange,
          background: 'transparent', border: 'none', borderBottom: `1px solid ${AX.orange}`,
          outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }} />
    );
  }
  return (
    <span onClick={() => { setDraft(String(Math.round(km ? value * 1.60934 : value))); setEditing(true); }}
      title="Tap to edit" style={{ cursor: 'pointer', borderBottom: `1px dashed ${AX.border}` }}>
      {fmtMi(value, km)}
    </span>
  );
}

function HeroBike({ bike, units, onUpdateBike }) {
  const km = units === 'km';
  const interval = bike.serviceInterval || 5000;
  const serviceLeft = interval - ((bike.odo || 0) % interval);
  const sincePct = 1 - serviceLeft / interval;
  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', background: AX.surface, border: `1px solid ${AX.border}` }}>
      <div style={{ position: 'relative' }}>
        <ImageSlot src={bike.image} height="186px"
          placeholder={`Tap to add a photo of your ${bike.make}`}
          onSave={(img) => onUpdateBike({ ...bike, image: img })} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}><ActiveBadge /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84,
          background: 'linear-gradient(to top, rgba(14,16,20,0.92), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
          <div style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1.4,
            textTransform: 'uppercase', color: AX.dim, marginBottom: 1 }}>{bike.make} · {bike.year}</div>
          <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 30, lineHeight: 1, color: AX.text }}>{bike.model}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: AX.border2 }}>
        {[
          ['Odometer', <EditableOdo value={bike.odo || 0} units={units}
            onChange={(v) => onUpdateBike({ ...bike, odo: v })} />, km ? 'km' : 'mi'],
          ['Rides', bike.rides || 0, ''],
          ['Engine', bike.cc || '—', ''],
        ].map((s, i) => (
          <div key={i} style={{ background: AX.surface, padding: '14px' }}>
            <div style={{ fontFamily: SAIRA, fontSize: 11, fontWeight: 600, letterSpacing: 1.3,
              textTransform: 'uppercase', color: AX.faint, marginBottom: 6 }}>{s[0]}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 26, color: AX.text,
                fontVariantNumeric: 'tabular-nums' }}>{s[1]}</span>
              {s[2] && <span style={{ fontFamily: SAIRA, fontSize: 11, fontWeight: 600,
                color: AX.dim, textTransform: 'uppercase' }}>{s[2]}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px 16px', borderTop: `1px solid ${AX.border2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph name="gauge" size={15} color={AX.dim} sw={1.9} />
            <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: AX.dim }}>Next service</span>
          </div>
          <span style={{ fontFamily: SAIRA, fontSize: 12.5, fontWeight: 600, color: AX.text }}>
            in {fmtMi(serviceLeft, km)} {km ? 'km' : 'mi'}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: AX.border2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(sincePct * 100, 100)}%`, height: '100%', borderRadius: 3,
            background: sincePct > 0.85 ? AX.orange : AX.dim, transition: 'width .3s' }} />
        </div>
      </div>
    </div>
  );
}

function GarageRow({ bike, units, onActivate, onDelete }) {
  const km = units === 'km';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18 }}>
      <div onClick={() => onActivate(bike.id)} style={{ flex: 1, display: 'flex', alignItems: 'center',
        gap: 14, cursor: 'pointer' }}>
        <ImageSlot src={bike.image} radius={12} width="60px" height="60px"
          placeholder={bike.make} onSave={() => {}} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SAIRA, fontSize: 15.5, fontWeight: 600, color: AX.text }}>{bike.model}</div>
          <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginBottom: 6 }}>{bike.make} · {bike.year}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[[fmtMi(bike.odo || 0, km), km ? 'km' : 'mi'], [bike.rides || 0, 'rides']].map((m, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 17, color: AX.text,
                  fontVariantNumeric: 'tabular-nums' }}>{m[0]}</span>
                <span style={{ fontFamily: SAIRA, fontSize: 10.5, fontWeight: 600, color: AX.dim,
                  textTransform: 'uppercase' }}>{m[1]}</span>
              </span>
            ))}
          </div>
        </div>
        <span style={{ fontFamily: SAIRA, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase', color: AX.faint, flexShrink: 0 }}>Set active</span>
      </div>
      <button onClick={() => onDelete(bike.id)} style={{ width: 34, height: 34, borderRadius: 17,
        border: 'none', background: 'rgba(255,60,40,0.12)', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,70,50,0.8)"
          strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', unit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: SAIRA, fontSize: 11.5, fontWeight: 600, letterSpacing: 1,
        textTransform: 'uppercase', color: AX.faint }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', background: AX.bg,
        border: `1px solid ${AX.border}`, borderRadius: 12 }}>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, fontFamily: SAIRA, fontSize: 15, color: AX.text,
            background: 'transparent', border: 'none', outline: 'none', padding: '12px 14px' }} />
        {unit && <span style={{ fontFamily: SAIRA, fontSize: 13, color: AX.dim, paddingRight: 14 }}>{unit}</span>}
      </div>
    </div>
  );
}

function AddBikeModal({ units, onSave, onClose }) {
  const km = units === 'km';
  const [form, setForm] = useState({
    make: '', model: '', year: String(new Date().getFullYear()), cc: '', odo: '', serviceInterval: '5000',
  });
  const upd = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.make.trim() && form.model.trim();

  const handleSave = () => {
    if (!valid) return;
    const odoVal = parseFloat(form.odo || '0');
    onSave({
      id: Date.now(),
      make: form.make.trim(), model: form.model.trim(),
      year: form.year, cc: form.cc.trim(),
      odo: km ? odoVal / 1.60934 : odoVal,
      serviceInterval: parseFloat(form.serviceInterval || '5000'),
      rides: 0, image: null,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: AX.surface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '20px 20px 44px',
        border: `1px solid ${AX.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 24, color: AX.text }}>Add Bike</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: 'none',
            background: AX.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AX.dim}
              strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <Field label="Make" value={form.make} onChange={upd('make')} placeholder="Ducati, Honda, Yamaha…" />
        <Field label="Model" value={form.model} onChange={upd('model')} placeholder="Monster 937, CB350…" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Year" value={form.year} onChange={upd('year')} type="number" placeholder="2024" />
          <Field label="Engine" value={form.cc} onChange={upd('cc')} placeholder="350cc" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label={`Odometer (${km ? 'km' : 'mi'})`} value={form.odo} onChange={upd('odo')}
            type="number" placeholder="0" />
          <Field label={`Service every (${km ? 'km' : 'mi'})`} value={form.serviceInterval}
            onChange={upd('serviceInterval')} type="number" placeholder="5000" />
        </div>
        <button onClick={handleSave} disabled={!valid} style={{
          width: '100%', height: 52, borderRadius: 16, border: 'none',
          background: valid ? AX.orange : AX.border, color: valid ? '#0E1014' : AX.dim,
          fontFamily: SAIRA, fontSize: 15, fontWeight: 700, cursor: valid ? 'pointer' : 'default',
          marginTop: 4,
        }}>Save Bike</button>
      </div>
    </div>
  );
}

export function ApexGarage({ t, onNavigate }) {
  const [bikes, setBikes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const saved = storage.getBikes();
    setBikes(saved);
    const active = saved.find(b => b.active) || saved[0];
    if (active) setActiveId(active.id);
  }, []);

  const persist = (list, aid) => {
    const withActive = list.map(b => ({ ...b, active: b.id === aid }));
    setBikes(withActive);
    storage.saveBikes(withActive);
  };

  const handleAdd = (bike) => {
    const updated = [...bikes, bike];
    const aid = bikes.length === 0 ? bike.id : activeId;
    if (bikes.length === 0) setActiveId(bike.id);
    persist(updated, aid);
    setShowAdd(false);
  };

  const handleActivate = (id) => { setActiveId(id); persist(bikes, id); };

  const handleDelete = (id) => {
    const updated = bikes.filter(b => b.id !== id);
    const aid = id === activeId ? (updated[0]?.id ?? null) : activeId;
    setActiveId(aid);
    persist(updated, aid);
  };

  const handleUpdateBike = (updated) => persist(bikes.map(b => b.id === updated.id ? updated : b), activeId);

  const active = bikes.find(b => b.id === activeId);
  const others = bikes.filter(b => b.id !== activeId);

  return (
    <Screen tab="garage" onNavigate={onNavigate}>
      <ScreenHeader subtitle={`${bikes.length} bike${bikes.length !== 1 ? 's' : ''}`} title="Garage"
        right={<HeaderIconBtn name="plus" accent onClick={() => setShowAdd(true)} />} />

      {bikes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 24px', gap: 14 }}>
          <Glyph name="gauge" size={40} color={AX.ghost} sw={1.4} />
          <span style={{ fontFamily: SAIRA, fontSize: 16, fontWeight: 600, color: AX.dim }}>No bikes yet</span>
          <span style={{ fontFamily: SAIRA, fontSize: 13, color: AX.faint, textAlign: 'center',
            lineHeight: 1.6, maxWidth: 260 }}>
            Add your bike to track odometer, service intervals, and link your rides to it.
          </span>
          <button onClick={() => setShowAdd(true)} style={{ height: 46, padding: '0 28px',
            borderRadius: 23, border: 'none', background: AX.orange, color: '#0E1014',
            fontFamily: SAIRA, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Add my bike
          </button>
        </div>
      ) : (
        <>
          {active && <HeroBike bike={active} units={t.units} onUpdateBike={handleUpdateBike} />}
          {others.length > 0 && (
            <>
              <SectionLabel style={{ padding: '22px 4px 10px' }}>Other bikes</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {others.map(b => <GarageRow key={b.id} bike={b} units={t.units}
                  onActivate={handleActivate} onDelete={handleDelete} />)}
              </div>
            </>
          )}
          <div style={{ height: 8 }} />
        </>
      )}

      {showAdd && <AddBikeModal units={t.units} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
    </Screen>
  );
}
