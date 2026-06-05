import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert,
} from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { Glyph } from '../components/Glyph';
import { storage } from '../native/storage';

function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

function boundsFromCoords(coords) {
  if (!coords || coords.length === 0) return null;
  const lats = coords.map(c => c.latitude);
  const lngs = coords.map(c => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 0.003;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad * 2, 0.008),
    longitudeDelta: Math.max(maxLng - minLng + pad * 2, 0.008),
  };
}

function StatCard({ label, value, unit }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text style={styles.statCardValue}>{value}</Text>
      {unit ? <Text style={styles.statCardUnit}>{unit}</Text> : null}
    </View>
  );
}

function RideRow({ ride, units, onPress, onDelete }) {
  const km = units === 'km';
  const dist = km ? ride.distKm?.toFixed(1) : (ride.distKm / 1.60934)?.toFixed(1);
  const top = km ? Math.round(ride.maxSpeedKmh) : Math.round(ride.maxSpeedKmh / 1.60934);
  const su = km ? 'km/h' : 'mph';
  const du = km ? 'km' : 'mi';

  const handleLongPress = () => {
    Alert.alert('Delete Ride', 'Remove this ride from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={handleLongPress}
      activeOpacity={0.75} style={styles.rideRow}>
      <View style={styles.rideThumb}>
        <Glyph name="track" size={22} color={AX.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rideName}>{ride.route || 'Untitled Ride'}</Text>
        <Text style={styles.rideDate}>{ride.date}</Text>
        <View style={styles.rideStats}>
          <Text style={styles.rideStat}>{dist} <Text style={styles.rideStatUnit}>{du}</Text></Text>
          <Text style={styles.rideStat}>{fmtDur(ride.elapsed)}</Text>
          <Text style={styles.rideStat}>{top} <Text style={styles.rideStatUnit}>{su}</Text></Text>
        </View>
      </View>
      <Glyph name="chevron" size={16} color={AX.ghost} sw={2} />
    </TouchableOpacity>
  );
}

function RideDetail({ ride, units, onClose }) {
  const insets = useSafeAreaInsets();
  const km = units === 'km';
  const region = boundsFromCoords(ride.coords);
  const dist = km ? ride.distKm?.toFixed(2) : (ride.distKm / 1.60934)?.toFixed(2);
  const top = km ? Math.round(ride.maxSpeedKmh) : Math.round(ride.maxSpeedKmh / 1.60934);
  const avg = km ? Math.round(ride.avgKmh) : Math.round(ride.avgKmh / 1.60934);
  const su = km ? 'km/h' : 'mph';
  const du = km ? 'km' : 'mi';

  return (
    <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Glyph name="back" size={20} color={AX.text} sw={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailTitle}>{ride.route || 'Untitled Ride'}</Text>
          <Text style={styles.detailDate}>{ride.date}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.detailMap}>
        {region ? (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            userInterfaceStyle="dark"
            mapType="standard"
            showsUserLocation={false}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            showsCompass={false}
          >
            {ride.coords?.length > 1 && (
              <Polyline coordinates={ride.coords} strokeColor={AX.orange}
                strokeWidth={4} lineCap="round" lineJoin="round" />
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noMap]}>
            <Glyph name="satellite" size={32} color={AX.ghost} sw={1.5} />
            <Text style={styles.noMapText}>No route data</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <ScrollView contentContainerStyle={[styles.detailStats, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.detailStatsGrid}>
          <StatCard label="Distance" value={dist} unit={du} />
          <StatCard label="Duration" value={fmtDur(ride.elapsed)} />
          <StatCard label="Top Speed" value={top} unit={su} />
          <StatCard label="Avg Speed" value={avg} unit={su} />
          {ride.maxLean > 0 && (
            <StatCard label="Max Lean" value={`${Math.round(ride.maxLean)}°`} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function HistoryScreen({ units = 'km' }) {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const km = units === 'km';

  useEffect(() => {
    storage.getRides().then(setRides);
  }, []);

  const deleteRide = async (id) => {
    const updated = rides.filter(r => r.id !== id);
    setRides(updated);
    await storage.saveRides(updated);
  };

  const totalDistKm = rides.reduce((s, r) => s + (r.distKm || 0), 0);
  const totalSec = rides.reduce((s, r) => s + (r.elapsed || 0), 0);
  const topSpeedKmh = rides.reduce((m, r) => Math.max(m, r.maxSpeedKmh || 0), 0);

  const distDisp = km ? totalDistKm.toFixed(0) : (totalDistKm / 1.60934).toFixed(0);
  const distUnit = km ? 'km' : 'mi';
  const topDisp = km ? Math.round(topSpeedKmh) : Math.round(topSpeedKmh / 1.60934);
  const topUnit = km ? 'km/h' : 'mph';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>{rides.length} ride{rides.length !== 1 ? 's' : ''} logged</Text>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <StatCard label="Distance" value={distDisp} unit={distUnit} />
          <StatCard label="Time" value={(totalSec / 3600).toFixed(1)} unit="hrs" />
          <StatCard label="Top" value={topDisp} unit={topUnit} />
        </View>

        {rides.length === 0 ? (
          <View style={styles.empty}>
            <Glyph name="history" size={48} color={AX.ghost} sw={1.4} />
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySub}>Hit Start on the Track tab to record your first ride</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Recent rides</Text>
            {rides.map((r) => (
              <RideRow key={r.id} ride={r} units={units}
                onPress={() => setSelectedRide(r)}
                onDelete={() => deleteRide(r.id)} />
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedRide} animationType="slide" statusBarTranslucent>
        {selectedRide && (
          <RideDetail ride={selectedRide} units={units} onClose={() => setSelectedRide(null)} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  headerSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginBottom: 2 },
  headerTitle: { fontFamily: FONTS.cond, fontSize: 32, color: AX.text, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: AX.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: AX.border2, alignItems: 'flex-start',
  },
  statCardLabel: { fontFamily: FONTS.saira, fontSize: 11, color: AX.faint, marginBottom: 4 },
  statCardValue: { fontFamily: FONTS.cond, fontSize: 26, color: AX.text },
  statCardUnit: { fontFamily: FONTS.saira, fontSize: 11, color: AX.dim },
  sectionLabel: {
    fontFamily: FONTS.sairaBold, fontSize: 11.5, color: AX.faint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12, marginTop: 4,
  },
  rideRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: AX.surface,
    borderRadius: 18, padding: 14, borderWidth: 1, borderColor: AX.border2, marginBottom: 10,
  },
  rideThumb: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: AX.bg,
    borderWidth: 1, borderColor: AX.border2, alignItems: 'center', justifyContent: 'center',
  },
  rideName: { fontFamily: FONTS.sairaBold, fontSize: 16, color: AX.text, marginBottom: 3 },
  rideDate: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginBottom: 8 },
  rideStats: { flexDirection: 'row', gap: 16 },
  rideStat: { fontFamily: FONTS.cond, fontSize: 19, color: AX.text },
  rideStatUnit: { fontFamily: FONTS.saira, fontSize: 10.5, color: AX.dim },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontFamily: FONTS.sairaBold, fontSize: 18, color: AX.dim },
  emptySub: { fontFamily: FONTS.saira, fontSize: 14, color: AX.faint, textAlign: 'center', lineHeight: 22 },

  // Detail screen
  detailContainer: { flex: 1, backgroundColor: AX.bg },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: AX.surface,
    borderWidth: 1, borderColor: AX.border2, alignItems: 'center', justifyContent: 'center',
  },
  detailTitle: { fontFamily: FONTS.cond, fontSize: 24, color: AX.text, letterSpacing: -0.3 },
  detailDate: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginTop: 1 },
  detailMap: { height: 320, backgroundColor: AX.surface },
  noMap: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  noMapText: { fontFamily: FONTS.saira, fontSize: 13, color: AX.ghost },
  detailStats: { padding: 16 },
  detailStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
