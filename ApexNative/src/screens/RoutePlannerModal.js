import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  Alert, Linking, Platform,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, Polyline, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { Glyph } from '../components/Glyph';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalDistKm(waypoints) {
  let d = 0;
  for (let i = 1; i < waypoints.length; i++) {
    d += haversineKm(
      waypoints[i - 1].latitude, waypoints[i - 1].longitude,
      waypoints[i].latitude, waypoints[i].longitude
    );
  }
  return d;
}

function fmtDist(km, units) {
  if (units === 'km') return `${km.toFixed(1)} km`;
  return `${(km / 1.60934).toFixed(1)} mi`;
}

function fmtEta(km) {
  const avgKmh = 60;
  const hrs = km / avgKmh;
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  if (h === 0) return `~${m}m`;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export default function RoutePlannerModal({ visible, units, onClose, onStartWithRoute }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [waypoints, setWaypoints] = useState([]);
  const [region, setRegion] = useState({
    latitude: 12.9716, longitude: 77.5946,
    latitudeDelta: 0.1, longitudeDelta: 0.1,
  });
  const [locating, setLocating] = useState(false);

  const goToMyLocation = () => {
    setLocating(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const r = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(r);
        mapRef.current?.animateToRegion(r, 600);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPress = (e) => {
    if (waypoints.length >= 10) {
      Alert.alert('Max waypoints', 'You can add up to 10 waypoints per route.');
      return;
    }
    setWaypoints(prev => [...prev, e.nativeEvent.coordinate]);
  };

  const removeWaypoint = (idx) => {
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    Alert.alert('Clear Route', 'Remove all waypoints?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setWaypoints([]) },
    ]);
  };

  const navigateInMaps = () => {
    if (waypoints.length < 2) return;
    const dest = waypoints[waypoints.length - 1];
    const stops = waypoints.slice(1, -1);
    if (Platform.OS === 'ios') {
      const daddr = `${dest.latitude},${dest.longitude}`;
      const url = `maps://?daddr=${daddr}&dirflg=d`;
      Linking.openURL(url);
    }
  };

  const dist = totalDistKm(waypoints);

  const handleStartRide = () => {
    onStartWithRoute(waypoints.length >= 2 ? { waypoints, distKm: dist } : null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Glyph name="back" size={20} color={AX.text} sw={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Plan Route</Text>
            <Text style={styles.subtitle}>Tap map to add waypoints</Text>
          </View>
          {waypoints.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            userInterfaceStyle="dark"
            mapType="standard"
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            onPress={handleMapPress}
          >
            {waypoints.length > 1 && (
              <Polyline
                coordinates={waypoints}
                strokeColor={AX.orange}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {waypoints.map((wp, i) => (
              <Marker key={i} coordinate={wp} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={[
                  styles.pin,
                  i === 0 && styles.pinStart,
                  i === waypoints.length - 1 && i > 0 && styles.pinEnd,
                ]}>
                  <Text style={styles.pinLabel}>
                    {i === 0 ? 'S' : i === waypoints.length - 1 ? 'E' : String(i)}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Locate me button */}
          <TouchableOpacity onPress={goToMyLocation} style={styles.locateBtn}>
            <Text style={styles.locateIcon}>{locating ? '…' : '◎'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Stats row */}
          {waypoints.length >= 2 ? (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{fmtDist(dist, units)}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{fmtEta(dist)}</Text>
                <Text style={styles.statLabel}>Est. time @ 60km/h</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{waypoints.length}</Text>
                <Text style={styles.statLabel}>Waypoints</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>
              {waypoints.length === 0
                ? 'Tap anywhere on the map to drop your first waypoint'
                : 'Add one more waypoint to calculate distance'}
            </Text>
          )}

          {/* Waypoint list */}
          {waypoints.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wpList}>
              {waypoints.map((wp, i) => (
                <TouchableOpacity key={i} onPress={() => removeWaypoint(i)} style={styles.wpChip}>
                  <Text style={styles.wpChipLabel}>
                    {i === 0 ? 'Start' : i === waypoints.length - 1 ? 'End' : `WP${i}`}
                  </Text>
                  <Text style={styles.wpChipRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {waypoints.length >= 2 && (
              <TouchableOpacity onPress={navigateInMaps} style={styles.mapsBtn}>
                <Text style={styles.mapsBtnText}>Open in Maps</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleStartRide}
              style={[styles.startBtn, waypoints.length < 2 && styles.startBtnSecondary]}
            >
              <Text style={[styles.startBtnText, waypoints.length < 2 && styles.startBtnTextSecondary]}>
                {waypoints.length >= 2 ? 'Start Ride on This Route' : 'Start Ride Without Route'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: AX.surface,
    borderWidth: 1, borderColor: AX.border2, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FONTS.cond, fontSize: 24, color: AX.text, letterSpacing: -0.3 },
  subtitle: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginTop: 1 },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    borderWidth: 1, borderColor: AX.border,
  },
  clearBtnText: { fontFamily: FONTS.sairaBold, fontSize: 12, color: AX.dim },

  mapWrap: { flex: 1, backgroundColor: AX.surface },

  locateBtn: {
    position: 'absolute', right: 16, bottom: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(14,16,20,0.85)', borderWidth: 1, borderColor: AX.border,
    alignItems: 'center', justifyContent: 'center',
  },
  locateIcon: { fontSize: 20, color: AX.orange },

  pin: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: AX.dim, borderWidth: 2, borderColor: AX.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  pinStart: { backgroundColor: '#34C759' },
  pinEnd: { backgroundColor: '#FF3B30' },
  pinLabel: { fontFamily: FONTS.sairaBold, fontSize: 11, color: '#fff' },

  sheet: {
    backgroundColor: 'rgba(15,16,20,0.97)',
    borderTopWidth: 1, borderTopColor: AX.border,
    paddingTop: 18, paddingHorizontal: 16, gap: 14,
  },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FONTS.cond, fontSize: 22, color: AX.text },
  statLabel: { fontFamily: FONTS.saira, fontSize: 11, color: AX.faint, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: AX.border },

  hint: {
    fontFamily: FONTS.saira, fontSize: 13, color: AX.faint,
    textAlign: 'center', lineHeight: 20, paddingVertical: 4,
  },

  wpList: { maxHeight: 48 },
  wpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 34, paddingHorizontal: 12, borderRadius: 17, marginRight: 8,
    backgroundColor: AX.surface, borderWidth: 1, borderColor: AX.border2,
  },
  wpChipLabel: { fontFamily: FONTS.sairaBold, fontSize: 12, color: AX.dim },
  wpChipRemove: { fontSize: 10, color: AX.ghost },

  actions: { gap: 10 },
  mapsBtn: {
    height: 44, borderRadius: 14, borderWidth: 1, borderColor: AX.border,
    alignItems: 'center', justifyContent: 'center',
  },
  mapsBtnText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: AX.dim },
  startBtn: {
    height: 52, borderRadius: 16, backgroundColor: AX.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  startBtnSecondary: { backgroundColor: AX.surface, borderWidth: 1, borderColor: AX.border },
  startBtnText: { fontFamily: FONTS.sairaBold, fontSize: 15, color: '#0E1014' },
  startBtnTextSecondary: { color: AX.dim },
});
