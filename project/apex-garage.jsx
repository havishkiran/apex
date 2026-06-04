// apex-garage.jsx — the rider's bikes. The ACTIVE bike (the one rides log to)
// is the single orange-marked item — orange = current/now, consistent with the suite.
// Bike photos are user-fillable <image-slot>s.

const { useState: useStateG } = React;

const SAIRA_G = "'Saira', system-ui, sans-serif";
const COND_G = "var(--apex-num, 'Saira Condensed'), sans-serif";

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
      <span style={{ fontFamily: SAIRA_G, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2,
        textTransform: 'uppercase', color: AX.orange }}>Active</span>
    </span>
  );
}

function HeroBike({ bike, units, accent }) {
  const km = units === 'km';
  // service interval visual (grayscale, no orange — it's not "live")
  const sincePct = 0.74;
  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', background: AX.surface,
      border: `1px solid ${AX.border}` }}>
      <div style={{ position: 'relative' }}>
        <image-slot id={'apex-bike-' + bike.id} shape="rect"
          style={{ display: 'block', width: '100%', height: '186px' }}
          placeholder={`Drop a photo of your ${bike.make}`}></image-slot>
        <div style={{ position: 'absolute', top: 12, right: 12 }}><ActiveBadge /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84,
          background: 'linear-gradient(to top, rgba(14,16,20,0.92), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
          <div style={{ fontFamily: SAIRA_G, fontSize: 12, fontWeight: 600, letterSpacing: 1.4,
            textTransform: 'uppercase', color: AX.dim, marginBottom: 1 }}>{bike.make} · {bike.year}</div>
          <div style={{ fontFamily: COND_G, fontWeight: 700, fontSize: 30, lineHeight: 1, color: AX.text,
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

      {/* service interval */}
      <div style={{ padding: '14px 16px 16px', borderTop: `1px solid ${AX.border2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Glyph name="gauge" size={15} color={AX.dim} sw={1.9} />
            <span style={{ fontFamily: SAIRA_G, fontSize: 12, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: AX.dim, whiteSpace: 'nowrap' }}>Next service</span>
          </div>
          <span style={{ fontFamily: SAIRA_G, fontSize: 12.5, fontWeight: 600, color: AX.text, whiteSpace: 'nowrap' }}>
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
      <image-slot id={'apex-bike-' + bike.id} shape="rounded" radius="12"
        style={{ width: '60px', height: '60px', flexShrink: 0 }}
        placeholder={bike.make}></image-slot>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SAIRA_G, fontSize: 15.5, fontWeight: 600, color: AX.text, whiteSpace: 'nowrap' }}>{bike.name}</div>
        <div style={{ fontFamily: SAIRA_G, fontSize: 12, color: AX.faint, marginBottom: 6 }}>{bike.make} · {bike.cc}</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[[fmtMi(bike.odo, km), km ? 'km' : 'mi'], [bike.rides, 'rides']].map((m, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: COND_G, fontWeight: 600, fontSize: 17, color: AX.text,
                fontVariantNumeric: 'tabular-nums' }}>{m[0]}</span>
              <span style={{ fontFamily: SAIRA_G, fontSize: 10.5, fontWeight: 600, color: AX.dim,
                textTransform: 'uppercase' }}>{m[1]}</span>
            </span>
          ))}
        </div>
      </div>
      <span style={{ fontFamily: SAIRA_G, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8,
        textTransform: 'uppercase', color: AX.faint }}>Set active</span>
    </button>
  );
}

function ApexGarage({ t, onNavigate }) {
  const [activeId, setActiveId] = useStateG('b1');
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

Object.assign(window, { ApexGarage });
