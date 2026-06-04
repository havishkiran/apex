import { useState } from 'react';
import { AX, SAIRA, COND } from '../tokens';
import { Glyph } from './Glyph';
import { Stat, SectionLabel, ScreenHeader, HeaderIconBtn, Screen } from './shared';

const BIKES = [
  { id: 'b1', name: 'Monster 937', make: 'Ducati', cc: '937cc', odo: 14208, rides: 84, year: '2023', last: 'Today' },
  { id: 'b2', name: 'Street Triple RS', make: 'Triumph', cc: '765cc', odo: 9640, rides: 51, year: '2022', last: '3 days ago' },
  { id: 'b3', name: 'XSR900', make: 'Yamaha', cc: '890cc', odo: 3120, rides: 22, year: '2024', last: '2 weeks ago' },
];

function fmtMi(mi, km) { const v = km ? mi * 1.60934 : mi; return Math.round(v).toLocaleString(); }

function ActiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px',
      borderRadius: 12, background: 'rgba(255,107,26,0.14)', border: '1px solid rgba(255,107,26,0.45)' }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: AX.orange,
        boxShadow: `0 0 7px ${AX.orange}` }} />
      <span style={{ fontFamily: SAIRA, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: AX.orange }}>Active</span>
    </span>
  );
}

// Simple image placeholder slot (without persisted state)
function ImageSlot({ id, shape = 'rounded', radius = 12, width, height, placeholder }) {
  const [src, setSrc] = useState(null);
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setSrc(ev.target.result);
      reader.readAsDataURL(file);
    }
  };
  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setSrc(ev.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  const br = shape === 'circle' ? '50%' : shape === 'pill' ? '9999px' : radius + 'px';
  return (
    <div
      style={{ width, height, borderRadius: br, overflow: 'hidden', position: 'relative',
        background: 'rgba(242,242,240,0.06)', cursor: 'pointer', flexShrink: 0 }}
      onClick={handleClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(242,242,240,0.3)" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
            {placeholder && <span style={{ fontFamily: SAIRA, fontSize: 10, color: 'rgba(242,242,240,0.3)', textAlign: 'center' }}>{placeholder}</span>}
          </div>}
    </div>
  );
}

function HeroBike({ bike, units }) {
  const km = units === 'km';
  const sincePct = 0.74;
  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', background: AX.surface, border: `1px solid ${AX.border}` }}>
      <div style={{ position: 'relative' }}>
        <ImageSlot id={'apex-bike-' + bike.id} shape="rect" width="100%" height="186px"
          placeholder={`Drop a photo of your ${bike.make}`} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}><ActiveBadge /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84,
          background: 'linear-gradient(to top, rgba(14,16,20,0.92), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
          <div style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1.4,
            textTransform: 'uppercase', color: AX.dim, marginBottom: 1 }}>{bike.make} · {bike.year}</div>
          <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 30, lineHeight: 1, color: AX.text,
            whiteSpace: 'nowrap' }}>{bike.name}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: AX.border2 }}>
        {[['Odometer', fmtMi(bike.odo, km), km ? 'km' : 'mi'], ['Rides', bike.rides, ''],
          ['Last ride', bike.last, '']].map((s, i) => (
          <div key={i} style={{ background: AX.surface, padding: '14px 14px' }}>
            <Stat label={s[0]} value={s[1]} unit={s[2]} size={i === 2 ? 18 : 26} />
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px 16px', borderTop: `1px solid ${AX.border2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph name="gauge" size={15} color={AX.dim} sw={1.9} />
            <span style={{ fontFamily: SAIRA, fontSize: 12, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: AX.dim, whiteSpace: 'nowrap' }}>Next service</span>
          </div>
          <span style={{ fontFamily: SAIRA, fontSize: 12.5, fontWeight: 600, color: AX.text, whiteSpace: 'nowrap' }}>
            in {fmtMi(740, km)} {km ? 'km' : 'mi'}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: AX.border2, overflow: 'hidden' }}>
          <div style={{ width: `${sincePct * 100}%`, height: '100%', borderRadius: 3, background: AX.dim }} />
        </div>
      </div>
    </div>
  );
}

function GarageRow({ bike, units, onActivate }) {
  const km = units === 'km';
  return (
    <button onClick={() => onActivate(bike.id)} style={{ width: '100%', display: 'flex', alignItems: 'center',
      gap: 14, padding: 12, background: AX.surface, border: `1px solid ${AX.border2}`, borderRadius: 18,
      cursor: 'pointer', textAlign: 'left' }}>
      <ImageSlot id={'apex-bike-' + bike.id} shape="rounded" radius={12}
        width="60px" height="60px" placeholder={bike.make} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SAIRA, fontSize: 15.5, fontWeight: 600, color: AX.text, whiteSpace: 'nowrap' }}>{bike.name}</div>
        <div style={{ fontFamily: SAIRA, fontSize: 12, color: AX.faint, marginBottom: 6 }}>{bike.make} · {bike.cc}</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[[fmtMi(bike.odo, km), km ? 'km' : 'mi'], [bike.rides, 'rides']].map((m, i) => (
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
        textTransform: 'uppercase', color: AX.faint }}>Set active</span>
    </button>
  );
}

export function ApexGarage({ t, onNavigate }) {
  const [activeId, setActiveId] = useState('b1');
  const active = BIKES.find((b) => b.id === activeId);
  const others = BIKES.filter((b) => b.id !== activeId);
  return (
    <Screen tab="garage" onNavigate={onNavigate}>
      <ScreenHeader subtitle={`${BIKES.length} bikes`} title="Garage"
        right={<HeaderIconBtn name="plus" accent />} />
      <HeroBike bike={active} units={t.units} accent={t.accent} />
      <SectionLabel style={{ padding: '22px 4px 10px' }}>Other bikes</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {others.map((b) => <GarageRow key={b.id} bike={b} units={t.units} onActivate={setActiveId} />)}
      </div>
      <div style={{ height: 8 }} />
    </Screen>
  );
}
