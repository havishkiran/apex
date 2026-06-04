import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { IOSDevice } from './components/IOSDevice';
import {
  TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect, TweakToggle,
  TweakSlider, TweakColor, TweakButton,
} from './components/TweaksPanel';
import { ApexTrack } from './components/ApexTrack';
import { CrashAlert } from './components/ApexSafety';
import { ApexHistory, ApexRideDetail } from './components/ApexHistory';
import { ApexGarage } from './components/ApexGarage';
import { ApexDevices } from './components/ApexDevices';
import { ApexSettings } from './components/ApexSettings';
import { APEX_ROUTES, fmtNavDist, maneuverVerb } from './components/ApexNav';
import { requestLocationPermission, startLocationWatch, stopLocationWatch } from './native/location';
import { startMotionWatch, stopMotionWatch } from './native/motion';
import { haptic } from './native/haptics';

const isNative = Capacitor.isNativePlatform();

const FONT_MAP = {
  'Saira Condensed': "'Saira Condensed'",
  'Oswald': "'Oswald'",
  'Barlow Condensed': "'Barlow Condensed'",
};

const TWEAK_DEFAULTS = {
  mode: 'idle',
  hero: 'speed',
  units: 'km',
  gps: 'phone',
  accent: '#FF6B1A',
  display: 'Saira Condensed',
  safety: true,
  lockSpeed: 35,
  voiceCues: true,
  crashDetect: true,
  follow: false,
  route: 'Stunt Rd Loop',
};

const SEED = { speed: 67, dist: 24.6, elapsed: 2538, avg: 31, lean: 0 };
const ZERO = { speed: 0, dist: 0, elapsed: 0, avg: 0, lean: 0 };

function fmtCueTime(s) {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`;
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const recording = t.mode === 'recording';
  const [st, setSt] = useState(ZERO);
  const stRef = useRef(st);
  stRef.current = st;

  const [screen, setScreen] = useState('track');
  const [detail, setDetail] = useState(null);
  const navigate = (id) => { setDetail(null); setScreen(id); };

  const [crash, setCrash] = useState(false);
  const [crashKey, setCrashKey] = useState(0);
  const triggerCrash = () => { haptic.error(); setCrashKey((k) => k + 1); setCrash(true); };

  const [cue, setCue] = useState('');
  const cueOn = t.voiceCues !== false;

  const following = t.follow === true;
  const routeName = APEX_ROUTES[t.route] ? t.route : 'Stunt Rd Loop';
  const [nav, setNav] = useState(null);
  const navRef = useRef(nav); navRef.current = nav;
  const exitRoute = () => setTweak('follow', false);

  // native GPS ride tracking
  useEffect(() => {
    if (!isNative || !recording) return;

    requestLocationPermission().then((status) => {
      if (status !== 'granted') return;
      setSt(ZERO);
      const startTime = Date.now();

      startLocationWatch((loc) => {
        setSt((s) => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const dist = s.dist + loc.distDelta;
          const avg = elapsed > 0 ? dist / (elapsed / 3600) : 0;
          // lean derived from heading change (crude proxy; real lean needs IMU)
          const lean = s.lean * 0.8;
          return { speed: loc.speed, dist, elapsed, avg, lean };
        });
      });
    });

    return () => stopLocationWatch();
  }, [recording]);

  // native crash detection via accelerometer
  useEffect(() => {
    if (!isNative || !recording || t.crashDetect === false) return;
    startMotionWatch(triggerCrash);
    return () => stopMotionWatch();
  }, [recording, t.crashDetect]);

  // browser simulation (non-native only)
  useEffect(() => {
    if (isNative || !recording) { if (!isNative) setSt(recording ? SEED : ZERO); return; }
    setSt((s) => (s.elapsed === 0 ? SEED : s));
    const id = setInterval(() => {
      const s = stRef.current;
      let sp = s.speed + (Math.random() - 0.5) * 9;
      sp = Math.max(16, Math.min(82, sp));
      const elapsed = s.elapsed + 1;
      const dist = s.dist + sp / 3600;
      const avg = dist / (elapsed / 3600);
      const target = (Math.random() - 0.5) * 2 * Math.min(52, 14 + sp * 0.5);
      const lean = (s.lean || 0) + (target - (s.lean || 0)) * 0.45;
      setSt({ speed: sp, dist, elapsed, avg, lean });
    }, 1000);
    return () => clearInterval(id);
  }, [recording]);

  // init nav route
  useEffect(() => {
    if (!following) { setNav(null); return; }
    const r = APEX_ROUTES[routeName];
    const base = 9 * 60 + 41 + r.etaMin;
    const eta = `${Math.floor(base / 60) % 24}:${String(base % 60).padStart(2, '0')}`;
    setNav({ stepIndex: 0, distToTurn: r.steps[0].in, remaining: r.remaining, eta,
      step: r.steps[0], next: r.steps[1] || null, dest: r.dest });
  }, [following, routeName]);

  // advance nav
  useEffect(() => {
    if (!following || !recording) return;
    const r = APEX_ROUTES[routeName];
    const id = setInterval(() => {
      const n = navRef.current; if (!n) return;
      const s = stRef.current;
      const dPerSec = Math.max(s.speed, 6) / 3600;
      let distToTurn = n.distToTurn - dPerSec;
      const remaining = Math.max(0, n.remaining - dPerSec);
      let stepIndex = n.stepIndex;
      if (distToTurn <= 0) {
        if (stepIndex < r.steps.length - 1) { stepIndex += 1; distToTurn = r.steps[stepIndex].in; haptic.light(); }
        else { distToTurn = 0; }
      }
      setNav({ ...n, stepIndex, distToTurn, remaining,
        step: r.steps[stepIndex], next: r.steps[stepIndex + 1] || null });
    }, 1000);
    return () => clearInterval(id);
  }, [following, recording, routeName]);

  // voice cues
  useEffect(() => {
    if (!recording || !cueOn || crash) { setCue(''); return; }
    const km = t.units === 'km';
    const speak = () => {
      const s = stRef.current;
      const n = navRef.current;
      if (following && n) {
        if (n.step.dir === 'arrive') { setCue(`Arriving at ${n.dest}`); }
        else {
          const d = fmtNavDist(n.distToTurn, t.units);
          setCue(`In ${d.value} ${d.unit}, ${maneuverVerb(n.step.dir).toLowerCase()} ${n.step.street}`);
        }
        setTimeout(() => setCue(''), 3600);
        return;
      }
      const d = (km ? s.dist * 1.60934 : s.dist).toFixed(1);
      const a = Math.round(km ? s.avg * 1.60934 : s.avg);
      const u = km ? 'km' : 'mi';
      const msgs = [
        `${d} ${u} · avg ${a} ${km ? 'km/h' : 'mph'}`,
        `${fmtCueTime(s.elapsed)} elapsed`,
        `Lean ${Math.round(Math.abs(s.lean || 0))}° — nice line`,
        `Halfway point · ${d} ${u} in`,
      ];
      setCue(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setCue(''), 3600);
    };
    const first = setTimeout(speak, 2500);
    const id = setInterval(speak, 9000);
    return () => { clearTimeout(first); clearInterval(id); setCue(''); };
  }, [recording, cueOn, crash, t.units, following]);

  const toggle = () => {
    haptic.medium();
    setTweak('mode', recording ? 'idle' : 'recording');
  };

  // on native: fill the full screen; on web: scale device frame to fit viewport
  const stageRef = useRef(null);
  useEffect(() => {
    if (isNative) return;
    const fit = () => {
      const el = stageRef.current; if (!el) return;
      const s = Math.min(window.innerWidth / 402, window.innerHeight / 874, 1);
      el.style.transform = `scale(${s})`;
    };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const numFont = FONT_MAP[t.display] || FONT_MAP['Saira Condensed'];

  let view;
  if (detail) {
    view = <div key="detail" style={{ position: 'absolute', inset: 0 }}>
      <ApexRideDetail ride={detail} t={t} onBack={() => setDetail(null)} />
    </div>;
  } else if (screen === 'track') {
    view = <ApexTrack key="track" st={st} t={t} recording={recording} onToggle={toggle}
      onNavigate={navigate} cue={cue} nav={nav} onExitRoute={exitRoute} />;
  } else {
    const inner = screen === 'history'
        ? <ApexHistory t={t} onNavigate={navigate} onOpen={(r) => setDetail(r)} />
      : screen === 'garage'
        ? <ApexGarage t={t} onNavigate={navigate} />
      : screen === 'devices'
        ? <ApexDevices t={t} onNavigate={navigate} gpsSource={t.gps} onSetSource={(v) => setTweak('gps', v)} />
        : <ApexSettings t={t} onNavigate={navigate} onSetUnits={(v) => setTweak('units', v)} onSetTweak={setTweak} />;
    view = <div key={screen} style={{ position: 'absolute', inset: 0 }}>{inner}</div>;
  }

  // on native: render full-screen without the iOS device frame (it IS the device)
  if (isNative) {
    return (
      <div style={{ ['--apex-num']: numFont, position: 'fixed', inset: 0, background: '#0E1014',
        fontFamily: "'Saira', system-ui, sans-serif" }}>
        {view}
        {crash && <CrashAlert key={crashKey} onDismiss={() => setCrash(false)} />}
      </div>
    );
  }

  return (
    <div style={{ ['--apex-num']: numFont }}>
      <div id="stage" ref={stageRef}>
        <IOSDevice dark>
          {view}
          {crash && <CrashAlert key={crashKey} onDismiss={() => setCrash(false)} />}
        </IOSDevice>
      </div>

      <TweaksPanel>
        <TweakSection label="Ride state" />
        <TweakRadio label="Mode" value={t.mode} options={['recording', 'idle']}
          onChange={(v) => setTweak('mode', v)} />
        <TweakRadio label="GPS source" value={t.gps} options={['phone', 'external']}
          onChange={(v) => setTweak('gps', v)} />

        <TweakSection label="Instrument cluster" />
        <TweakSelect label="Hero metric" value={t.hero}
          options={['speed', 'distance', 'time', 'avg', 'lean']}
          onChange={(v) => setTweak('hero', v)} />
        <TweakRadio label="Units" value={t.units} options={['mi', 'km']}
          onChange={(v) => setTweak('units', v)} />
        <TweakSelect label="Readout font" value={t.display}
          options={['Saira Condensed', 'Oswald', 'Barlow Condensed']}
          onChange={(v) => setTweak('display', v)} />

        <TweakSection label="Safety" />
        <TweakToggle label="Auto-lock while riding" value={t.safety !== false}
          onChange={(v) => setTweak('safety', v)} />
        <TweakSlider label="Lock above" value={t.lockSpeed == null ? 35 : t.lockSpeed}
          min={10} max={70} step={5} unit=" mph"
          onChange={(v) => setTweak('lockSpeed', v)} />
        <TweakToggle label="Crash detection" value={t.crashDetect !== false}
          onChange={(v) => setTweak('crashDetect', v)} />
        <TweakToggle label="Voice cues" value={t.voiceCues !== false}
          onChange={(v) => setTweak('voiceCues', v)} />
        <TweakButton label="Simulate crash detection" onClick={triggerCrash} />

        <TweakSection label="Navigation" />
        <TweakToggle label="Follow route" value={t.follow === true}
          onChange={(v) => setTweak('follow', v)} />
        <TweakSelect label="Route" value={t.route || 'Stunt Rd Loop'}
          options={['Stunt Rd Loop', 'Coast → Topanga', 'Angeles Crest']}
          onChange={(v) => setTweak('route', v)} />

        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={['#FF6B1A', '#FF8A00', '#FF4D2E', '#FF5C00']}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}
