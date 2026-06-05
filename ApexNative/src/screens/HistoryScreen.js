import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { storage } from '../native/storage';

function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
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

function RideRow({ ride, units }) {
  const km = units === 'km';
  const dist = km ? ride.distKm?.toFixed(1) : (ride.distKm / 1.60934)?.toFixed(1);
  const top = km ? Math.round(ride.maxSpeedKmh) : Math.round(ride.maxSpeedKmh / 1.60934);
  const su = km ? 'km/h' : 'mph';
  const du = km ? 'km' : 'mi';

  return (
    <View style={styles.rideRow}>
      <View style={styles.rideThumb}>
        <Text style={{ fontSize: 22 }}>🏍</Text>
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
    </View>
  );
}

export default function HistoryScreen({ units = 'km' }) {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState([]);
  const km = units === 'km';

  useEffect(() => {
    storage.getRides().then(setRides);
  }, []);

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
        {/* Summary stats */}
        <View style={styles.statsRow}>
          <StatCard label="Distance" value={distDisp} unit={distUnit} />
          <StatCard label="Time" value={(totalSec / 3600).toFixed(1)} unit="hrs" />
          <StatCard label="Top" value={topDisp} unit={topUnit} />
        </View>

        {rides.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛣️</Text>
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySub}>Hit Start on the Track tab to record your first ride</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Recent rides</Text>
            {rides.map((r) => <RideRow key={r.id} ride={r} units={units} />)}
          </>
        )}
      </ScrollView>
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
    flexDirection: 'row', gap: 14, backgroundColor: AX.surface,
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
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: FONTS.sairaBold, fontSize: 18, color: AX.dim },
  emptySub: { fontFamily: FONTS.saira, fontSize: 14, color: AX.faint, textAlign: 'center', lineHeight: 22 },
});
