import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, Animated,
} from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import MapView, { PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { AX, FONTS } from '../tokens';
import { saveRide, storage } from '../native/storage';
import { liveTracking } from '../native/liveTracking';

const HAPTIC = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };
function haptic(type = 'impactMedium') {
  ReactNativeHapticFeedback.trigger(type, HAPTIC);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

function RecPill({ recording }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!recording) { pulse.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [recording]);

  return (
    <View style={styles.pill}>
      <Animated.View style={[styles.pillDot, { opacity: pulse,
        backgroundColor: recording ? AX.orange : AX.faint }]} />
      <Text style={[styles.pillText, { color: recording ? AX.text : AX.dim }]}>
        {recording ? 'REC' : 'READY'}
      </Text>
    </View>
  );
}

function Metric({ label, value, unit }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function RecordButton({ recording, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.recBtn, recording && styles.recBtnActive]}>
          {recording ? <View style={styles.stopIcon} /> : <View style={styles.playIcon} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CrashModal({ visible, emergency, onDismiss }) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!visible) { setCountdown(30); return; }
    setCountdown(30);
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.crashOverlay}>
        <View style={styles.crashCard}>
          <View style={styles.crashIconRow}>
            <View style={styles.crashDot} />
            <Text style={styles.crashLabel}>CRASH DETECTED</Text>
          </View>
          <Text style={styles.crashCountdown}>{countdown}</Text>
          <Text style={styles.crashSub}>
            {countdown > 0
              ? `Alerting emergency contact in ${countdown}s`
              : emergency?.name ? `Notifying ${emergency.name}…` : 'Alerting emergency contact…'}
          </Text>
          <TouchableOpacity onPress={onDismiss}
            style={[styles.crashBtn, countdown === 0 && styles.crashBtnDim]}>
            <Text style={styles.crashBtnText}>
              {countdown > 0 ? "I'M OK — CANCEL" : 'DISMISS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function TrackScreen({ units = 'km' }) {
  const insets = useSafeAreaInsets();
  const [recording, setRecording] = useState(false);
  const [st, setSt] = useState({ speed: 0, dist: 0, elapsed: 0, avg: 0, maxSpeed: 0, maxLean: 0 });
  const stRef = useRef(st);
  stRef.current = st;

  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [coords, setCoords] = useState([]);
  const coordsRef = useRef([]);
  const lastPosRef = useRef(null);

  const [leanAngle, setLeanAngle] = useState(0);
  const leanRef = useRef(0);
  const accelSubRef = useRef(null);
  const [crashVisible, setCrashVisible] = useState(false);
  const crashCooldownRef = useRef(false);
  const [emergency, setEmergency] = useState(null);

  const speedSmoothRef = useRef(0);
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const km = units === 'km';

  useEffect(() => {
    Geolocation.requestAuthorization('always');
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    storage.getEmergency().then(setEmergency);
  }, []);

  const startAccelerometer = () => {
    try {
      setUpdateIntervalForType(SensorTypes.accelerometer, 100);
      accelSubRef.current = accelerometer.subscribe(({ x, y, z }) => {
        // Lean angle: phone tilt from vertical (x-axis roll)
        const raw = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
        leanRef.current = leanRef.current * 0.75 + raw * 0.25;
        const abs = Math.abs(Math.round(leanRef.current));
        setLeanAngle(abs);
        setSt(s => ({ ...s, maxLean: Math.max(s.maxLean, abs) }));

        // Crash detection: sudden high G-force spike (> 5g)
        const gTotal = Math.sqrt(x * x + y * y + z * z) / 9.81;
        if (gTotal > 5 && !crashCooldownRef.current) {
          crashCooldownRef.current = true;
          haptic('notificationWarning');
          setCrashVisible(true);
        }
      });
    } catch {}
  };

  const stopAccelerometer = () => {
    accelSubRef.current?.unsubscribe();
    accelSubRef.current = null;
  };

  const startRecording = () => {
    haptic('impactMedium');
    startTimeRef.current = Date.now();
    coordsRef.current = [];
    lastPosRef.current = null;
    speedSmoothRef.current = 0;
    setCoords([]);
    crashCooldownRef.current = false;
    setSt({ speed: 0, dist: 0, elapsed: 0, avg: 0, maxSpeed: 0, maxLean: 0 });
    KeepAwake.activate();
    liveTracking.start('Ride', km, startTimeRef.current);

    timerRef.current = setInterval(() => {
      setSt((s) => ({ ...s, elapsed: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
    }, 1000);

    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();

        let segmentKm = 0;
        let speedKmh = speedSmoothRef.current;

        if (lastPosRef.current) {
          const d = haversineKm(
            lastPosRef.current.latitude, lastPosRef.current.longitude,
            latitude, longitude
          );
          const timeDeltaMs = now - lastPosRef.current.time;
          const timeDeltaHrs = timeDeltaMs / 3600000;

          // Require ≥1s between fixes, movement < 300m, GPS accuracy < 30m
          if (timeDeltaMs >= 1000 && d < 0.3 && (accuracy == null || accuracy < 30)) {
            segmentKm = d;
            const rawSpeed = timeDeltaHrs > 0 ? d / timeDeltaHrs : 0;
            const capped = Math.min(rawSpeed, 220); // motorcycle hard cap
            // EMA smoothing: decays naturally to 0 when stationary
            speedSmoothRef.current = speedSmoothRef.current * 0.5 + capped * 0.5;
            speedKmh = speedSmoothRef.current;
          }
        }
        lastPosRef.current = { latitude, longitude, time: now };

        coordsRef.current = [...coordsRef.current, { latitude, longitude }];
        setCoords([...coordsRef.current]);

        setSt((s) => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const distKm = s.dist + segmentKm;
          const avg = elapsed > 10 ? distKm / (elapsed / 3600) : 0;
          const maxSpeed = Math.max(s.maxSpeed, speedKmh);
          liveTracking.update(speedKmh, distKm, maxSpeed);
          return { ...s, speed: speedKmh, dist: distKm, elapsed, avg, maxSpeed };
        });

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500
          );
        }
      },
      () => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 2000,
        fastestInterval: 1000,
        pausesLocationUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      }
    );

    startAccelerometer();
    setRecording(true);
  };

  const stopRecording = async () => {
    haptic('notificationSuccess');
    clearInterval(timerRef.current);
    Geolocation.clearWatch(watchIdRef.current);
    stopAccelerometer();
    KeepAwake.deactivate();
    setRecording(false);
    const s = stRef.current;
    liveTracking.end(s.speed, s.dist, s.maxSpeed);
    if (s.elapsed > 10) {
      await saveRide({
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        distKm: s.dist,
        elapsed: s.elapsed,
        avgKmh: s.avg,
        maxSpeedKmh: s.maxSpeed,
        maxLean: s.maxLean,
        coords: coordsRef.current,
      });
      // Sync odometer to active bike
      const bikes = await storage.getBikes();
      const activeIdx = bikes.findIndex(b => b.active);
      if (activeIdx >= 0) {
        const updated = [...bikes];
        updated[activeIdx] = {
          ...updated[activeIdx],
          odo: ((parseFloat(updated[activeIdx].odo) || 0) + s.dist).toFixed(1),
        };
        await storage.saveBikes(updated);
      }
    }
    setSt({ speed: 0, dist: 0, elapsed: 0, avg: 0, maxSpeed: 0, maxLean: 0 });
    setLeanAngle(0);
  };

  const toggle = () => recording ? stopRecording() : startRecording();

  const disp = (kmhVal) => km ? Math.round(kmhVal) : Math.round(kmhVal / 1.60934);
  const distDisp = (kmVal) => km ? kmVal.toFixed(2) : (kmVal / 1.60934).toFixed(2);
  const speedUnit = km ? 'km/h' : 'mph';
  const distUnit = km ? 'km' : 'mi';

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          followsUserLocation={recording}
          mapType="standard"
          userInterfaceStyle="dark"
          showsCompass={false}
          showsScale={false}
          showsTraffic={false}
        >
          {coords.length > 1 && (
            <Polyline coordinates={coords} strokeColor={AX.orange}
              strokeWidth={3} lineCap="round" lineJoin="round" />
          )}
        </MapView>
      )}

      <View style={styles.mapOverlay} pointerEvents="none" />

      <View style={[styles.topHud, { top: insets.top + 12 }]}>
        <View style={styles.gpsPill}>
          <View style={[styles.gpsDot, { backgroundColor: recording ? '#34C759' : AX.faint }]} />
          <Text style={styles.gpsText}>GPS</Text>
        </View>
        <RecPill recording={recording} />
      </View>

      <View style={[styles.console, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroValue}>{disp(st.speed)}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroUnit}>{speedUnit}</Text>
              <Text style={styles.heroLabel}>Speed</Text>
            </View>
          </View>
          <RecordButton recording={recording} onPress={toggle} />
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsRow}>
          <Metric label="Distance" value={distDisp(st.dist)} unit={distUnit} />
          <Metric label="Elapsed" value={fmtTime(st.elapsed)} />
          {recording
            ? <Metric label="Lean" value={`${leanAngle}°`} />
            : <Metric label="Avg" value={disp(st.avg)} unit={speedUnit} />
          }
        </View>

        <Text style={[styles.startHint, { opacity: recording ? 0 : 0.5 }]}>
          Tap to start recording
        </Text>
      </View>

      <CrashModal
        visible={crashVisible}
        emergency={emergency}
        onDismiss={() => { setCrashVisible(false); crashCooldownRef.current = false; }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  mapOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },

  topHud: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, paddingHorizontal: 13,
    borderRadius: 17, backgroundColor: 'rgba(12,13,16,0.72)', borderWidth: 1, borderColor: AX.border,
  },
  gpsDot: { width: 7, height: 7, borderRadius: 4 },
  gpsText: { fontFamily: FONTS.sairaBold, fontSize: 11.5, letterSpacing: 0.7, color: AX.dim, textTransform: 'uppercase' },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, height: 30, paddingHorizontal: 13,
    borderRadius: 15, backgroundColor: 'rgba(12,13,16,0.72)', borderWidth: 1, borderColor: AX.border,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontFamily: FONTS.sairaBold, fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase' },

  console: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,16,20,0.92)',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    borderTopWidth: 1, borderColor: AX.border,
    paddingTop: 24, paddingHorizontal: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMetric: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  heroValue: { fontFamily: FONTS.cond, fontSize: 104, lineHeight: 106, color: AX.text, letterSpacing: -1 },
  heroMeta: { flexDirection: 'column', gap: 2, marginBottom: 10 },
  heroUnit: { fontFamily: FONTS.sairaBold, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase', color: AX.dim },
  heroLabel: { fontFamily: FONTS.sairaBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: AX.faint },

  divider: { height: 1, backgroundColor: AX.border, marginVertical: 18 },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1, gap: 5 },
  metricLabel: { fontFamily: FONTS.sairaBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: AX.faint },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  metricValue: { fontFamily: FONTS.cond, fontSize: 30, lineHeight: 34, color: AX.text },
  metricUnit: { fontFamily: FONTS.sairaBold, fontSize: 12, color: AX.dim, textTransform: 'uppercase', marginBottom: 2 },

  recBtn: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: AX.orange,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: AX.orange, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42, shadowRadius: 16,
  },
  recBtnActive: {
    backgroundColor: 'rgba(12,13,16,0.5)',
    borderWidth: 4, borderColor: AX.orange, shadowOpacity: 0,
  },
  playIcon: {
    width: 0, height: 0, marginLeft: 4,
    borderTopWidth: 13, borderBottomWidth: 13, borderLeftWidth: 22,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#0C0D10',
  },
  stopIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: AX.orange },

  startHint: { fontFamily: FONTS.saira, fontSize: 13, color: AX.dim, textAlign: 'center', marginTop: 12 },

  // Crash modal
  crashOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  crashCard: {
    width: '100%', backgroundColor: AX.surface, borderRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,60,50,0.4)',
    padding: 28, alignItems: 'center', gap: 10,
  },
  crashIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  crashDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,60,50,0.9)' },
  crashLabel: { fontFamily: FONTS.sairaBold, fontSize: 13, color: 'rgba(255,80,60,0.9)', letterSpacing: 2 },
  crashCountdown: { fontFamily: FONTS.cond, fontSize: 88, lineHeight: 92, color: AX.text, letterSpacing: -1 },
  crashSub: { fontFamily: FONTS.saira, fontSize: 14, color: AX.dim, textAlign: 'center', lineHeight: 20 },
  crashBtn: {
    marginTop: 8, width: '100%', height: 52, borderRadius: 26,
    backgroundColor: AX.orange, alignItems: 'center', justifyContent: 'center',
  },
  crashBtnDim: { backgroundColor: AX.border },
  crashBtnText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: '#0C0D10', letterSpacing: 1 },
});
