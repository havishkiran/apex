import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Platform, Animated,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, UserLocationAnnotation } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { AX, FONTS } from '../tokens';
import { saveRide } from '../native/storage';

const HAPTIC = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

function haptic(type = 'impactMedium') {
  ReactNativeHapticFeedback.trigger(type, HAPTIC);
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

function Metric({ label, value, unit, large }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={[styles.metricValue, large && styles.metricLarge]}>{value}</Text>
        {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function RecordButton({ recording, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recording) { pulse.setValue(0); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [recording]);

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
          {recording
            ? <View style={styles.stopIcon} />
            : <View style={styles.playIcon} />}
        </View>
      </Animated.View>
    </Pressable>
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
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const km = units === 'km';

  // Request location permission and get initial position
  useEffect(() => {
    Geolocation.requestAuthorization();
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const startRecording = () => {
    haptic('impactMedium');
    startTimeRef.current = Date.now();
    setSt({ speed: 0, dist: 0, elapsed: 0, avg: 0, maxSpeed: 0, maxLean: 0 });

    // elapsed timer
    timerRef.current = setInterval(() => {
      setSt((s) => ({ ...s, elapsed: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
    }, 1000);

    // GPS watch
    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        const speed = Math.max(0, pos.coords.speed || 0) * 3.6; // m/s → km/h
        setSt((s) => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const distKm = s.dist + (speed / 3600);
          const avg = elapsed > 0 ? distKm / (elapsed / 3600) : 0;
          const maxSpeed = Math.max(s.maxSpeed, speed);
          return { speed, dist: distKm, elapsed, avg, maxSpeed, maxLean: s.maxLean };
        });
        // re-center map
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 500);
        }
      },
      () => {},
      { enableHighAccuracy: true, distanceFilter: 5, interval: 1000, fastestInterval: 500 }
    );
    setRecording(true);
  };

  const stopRecording = async () => {
    haptic('notificationSuccess');
    clearInterval(timerRef.current);
    Geolocation.clearWatch(watchIdRef.current);
    setRecording(false);
    const s = stRef.current;
    if (s.elapsed > 10) {
      await saveRide({
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        distKm: s.dist,
        elapsed: s.elapsed,
        avgKmh: s.avg,
        maxSpeedKmh: s.maxSpeed,
        maxLean: s.maxLean,
      });
    }
    setSt({ speed: 0, dist: 0, elapsed: 0, avg: 0, maxSpeed: 0, maxLean: 0 });
  };

  const toggle = () => recording ? stopRecording() : startRecording();

  const disp = (kmhVal) => km ? Math.round(kmhVal) : Math.round(kmhVal / 1.60934);
  const distDisp = (kmVal) => km ? kmVal.toFixed(2) : (kmVal / 1.60934).toFixed(2);
  const speedUnit = km ? 'km/h' : 'mph';
  const distUnit = km ? 'km' : 'mi';

  return (
    <View style={styles.container}>
      {/* Full-screen native Apple Map */}
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
        />
      )}

      {/* Dark gradient overlay at bottom */}
      <View style={styles.mapOverlay} pointerEvents="none" />

      {/* Top HUD */}
      <View style={[styles.topHud, { top: insets.top + 12 }]}>
        <View style={styles.gpsPill}>
          <View style={[styles.gpsDoc, { backgroundColor: recording ? '#34C759' : AX.faint }]} />
          <Text style={styles.gpsText}>GPS</Text>
        </View>
        <RecPill recording={recording} />
      </View>

      {/* Console panel */}
      <View style={[styles.console, { paddingBottom: insets.bottom + 16 }]}>
        {/* Hero speed */}
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

        {/* Secondary metrics */}
        <View style={styles.metricsRow}>
          <Metric label="Distance" value={distDisp(st.dist)} unit={distUnit} />
          <Metric label="Elapsed" value={fmtTime(st.elapsed)} />
          <Metric label="Avg" value={disp(st.avg)} unit={speedUnit} />
        </View>

        <Text style={[styles.startHint, { opacity: recording ? 0 : 0.5 }]}>
          Tap to start recording
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  mapOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 300,
    backgroundColor: 'transparent',
    // gradient-like shadow handled by console background
  },

  // Top HUD
  topHud: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, paddingHorizontal: 13,
    borderRadius: 17, backgroundColor: 'rgba(12,13,16,0.72)', borderWidth: 1, borderColor: AX.border,
  },
  gpsDoc: { width: 7, height: 7, borderRadius: 4 },
  gpsText: { fontFamily: FONTS.sairaBold, fontSize: 11.5, letterSpacing: 0.7, color: AX.dim, textTransform: 'uppercase' },

  // Rec pill
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, height: 30, paddingHorizontal: 13,
    borderRadius: 15, backgroundColor: 'rgba(12,13,16,0.72)', borderWidth: 1, borderColor: AX.border,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontFamily: FONTS.sairaBold, fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase' },

  // Console
  console: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,16,20,0.92)',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    borderTopWidth: 1, borderColor: AX.border,
    paddingTop: 24, paddingHorizontal: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  heroMetric: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  heroValue: {
    fontFamily: FONTS.cond, fontSize: 104, lineHeight: 88,
    color: AX.text, letterSpacing: -1,
  },
  heroMeta: { flexDirection: 'column', gap: 2, marginBottom: 10 },
  heroUnit: { fontFamily: FONTS.sairaBold, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase', color: AX.dim },
  heroLabel: { fontFamily: FONTS.sairaBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: AX.faint },

  divider: { height: 1, backgroundColor: AX.border, marginVertical: 18 },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1, gap: 5 },
  metricLabel: { fontFamily: FONTS.sairaBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: AX.faint },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  metricValue: { fontFamily: FONTS.cond, fontSize: 30, lineHeight: 30, color: AX.text },
  metricLarge: { fontSize: 42, lineHeight: 42 },
  metricUnit: { fontFamily: FONTS.sairaBold, fontSize: 12, color: AX.dim, textTransform: 'uppercase', marginBottom: 2 },

  // Record button
  recBtn: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: AX.orange,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: AX.orange, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42, shadowRadius: 16,
  },
  recBtnActive: {
    backgroundColor: 'rgba(12,13,16,0.5)',
    borderWidth: 4, borderColor: AX.orange,
    shadowOpacity: 0,
  },
  playIcon: {
    width: 0, height: 0, marginLeft: 4,
    borderTopWidth: 13, borderBottomWidth: 13, borderLeftWidth: 22,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#0C0D10',
  },
  stopIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: AX.orange },

  startHint: { fontFamily: FONTS.saira, fontSize: 13, color: AX.dim, textAlign: 'center', marginTop: 12 },
});
