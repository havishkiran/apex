import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert,
  TextInput, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
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

function boundsFromRides(ridesData) {
  const all = ridesData.flatMap(r => r.coords || []);
  return boundsFromCoords(all);
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

function MetricGraph({ values, label, gradId, color = AX.orange, width = 340, height = 80 }) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = { x: 4, y: 6 };
  const w = width - pad.x * 2;
  const h = height - pad.y * 2;

  const pts = values.map((v, i) => ({
    x: pad.x + (i / (values.length - 1)) * w,
    y: pad.y + (1 - (v - min) / range) * h,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(pad.y + h).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.y + h).toFixed(1)} Z`;

  return (
    <View style={{ marginTop: 4, marginBottom: 8 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Svg width={width} height={height} style={{ alignSelf: 'center' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={fillD} fill={`url(#${gradId})`} />
        <Path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// ─── Ride components ──────────────────────────────────────────────────────────

function RideRow({ ride, units, onPress, onDelete }) {
  const km = units === 'km';
  const dist = km ? ride.distKm?.toFixed(1) : (ride.distKm / 1.60934)?.toFixed(1);
  const safeTop = Math.min(ride.maxSpeedKmh || 0, 300);
  const top = km ? Math.round(safeTop) : Math.round(safeTop / 1.60934);
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

function RideDetail({ ride, units, onClose, onRename }) {
  const insets = useSafeAreaInsets();
  const [renaming, setRenaming] = useState(false);
  const [nameText, setNameText] = useState('');
  const km = units === 'km';
  const region = boundsFromCoords(ride.coords);
  const dist = km ? ride.distKm?.toFixed(2) : (ride.distKm / 1.60934)?.toFixed(2);
  const safeTop = Math.min(ride.maxSpeedKmh || 0, 300);
  const top = km ? Math.round(safeTop) : Math.round(safeTop / 1.60934);
  const avg = km ? Math.round(ride.avgKmh) : Math.round(ride.avgKmh / 1.60934);
  const su = km ? 'km/h' : 'mph';
  const du = km ? 'km' : 'mi';

  const hasAlt = ride.maxAltM != null && ride.minAltM != null;
  const fmtAlt = (m) => km ? `${Math.round(m)}m` : `${Math.round(m * 3.28084)}ft`;
  const altGain = hasAlt ? Math.max(0, ride.maxAltM - ride.minAltM) : null;

  const altValues = (ride.coords || []).map(c => c.altitude).filter(a => a != null);
  const leanValues = (ride.coords || []).map(c => c.lean).filter(l => l != null && l > 0);

  const openRename = () => { setNameText(ride.route || ''); setRenaming(true); };
  const saveRename = () => {
    const name = nameText.trim();
    if (name) onRename(name);
    setRenaming(false);
  };

  const shotRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const shareRide = async () => {
    try {
      setSharing(true);
      // Let the off-screen card render before capturing
      await new Promise(r => setTimeout(r, 60));
      const uri = await shotRef.current.capture();
      await Share.share({
        url: uri,
        message: `${ride.route || 'My ride'} — ${dist} ${du} · ${fmtDur(ride.elapsed)} · top ${top} ${su}. Tracked with Apex 🏍`,
      });
    } catch (e) {
      Alert.alert('Share failed', 'Could not create the ride card. Try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
      {/* Off-screen shareable card */}
      <ViewShot ref={shotRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shareCardWrap}>
        <View style={styles.shareCard}>
          <View style={styles.shareCardHeader}>
            <Text style={styles.shareCardBrand}>APEX</Text>
            {ride.weather && (
              <Text style={styles.shareCardWeather}>{ride.weather.icon} {ride.weather.tempC}°</Text>
            )}
          </View>
          <Text style={styles.shareCardTitle}>{ride.route || 'Untitled Ride'}</Text>
          <Text style={styles.shareCardDate}>{ride.date}</Text>
          <View style={styles.shareCardStatsRow}>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardValue}>{dist}</Text>
              <Text style={styles.shareCardLabel}>{du}</Text>
            </View>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardValue}>{fmtDur(ride.elapsed)}</Text>
              <Text style={styles.shareCardLabel}>time</Text>
            </View>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardValue}>{top}</Text>
              <Text style={styles.shareCardLabel}>{su}</Text>
            </View>
          </View>
          {ride.maxLean > 0 && (
            <Text style={styles.shareCardLean}>Max lean {Math.round(ride.maxLean)}°</Text>
          )}
        </View>
      </ViewShot>
      <Modal visible={renaming} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView style={styles.renameOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Ride</Text>
            <TextInput value={nameText} onChangeText={setNameText}
              placeholder="Ride name…" placeholderTextColor={AX.faint}
              style={styles.renameInput} autoFocus returnKeyType="done" onSubmitEditing={saveRename} />
            <View style={styles.renameActions}>
              <TouchableOpacity onPress={() => setRenaming(false)} style={styles.renameCancelBtn}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveRename} style={styles.renameSaveBtn}>
                <Text style={styles.renameSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Glyph name="back" size={20} color={AX.text} sw={2} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={openRename} activeOpacity={0.7}>
          <Text style={styles.detailTitle}>{ride.route || 'Untitled Ride'}</Text>
          <Text style={styles.detailDate}>{ride.date} · tap to rename</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareRide} disabled={sharing} style={[styles.backBtn, sharing && { opacity: 0.4 }]}>
          <Glyph name="share" size={18} color={AX.text} sw={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailMap}>
        {region ? (
          <MapView style={StyleSheet.absoluteFill} provider={PROVIDER_DEFAULT}
            initialRegion={region} userInterfaceStyle="dark" mapType="standard"
            showsUserLocation={false} scrollEnabled={false} zoomEnabled={false}
            rotateEnabled={false} showsCompass={false}>
            {ride.coords?.length > 1 && (
              <Polyline coordinates={ride.coords} strokeColor={AX.orange}
                strokeWidth={4} lineCap="round" lineJoin="round" />
            )}
            {ride.hazards?.map((h, i) => (
              <Marker key={i} coordinate={h} anchor={{ x: 0.5, y: 0.5 }}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noMap]}>
            <Glyph name="satellite" size={32} color={AX.ghost} sw={1.5} />
            <Text style={styles.noMapText}>No route data</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.detailStats, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.detailStatsRow}>
          <StatCard label="Distance" value={dist} unit={du} />
          <StatCard label="Duration" value={fmtDur(ride.elapsed)} />
        </View>
        <View style={styles.detailStatsRow}>
          <StatCard label="Top Speed" value={top} unit={su} />
          <StatCard label="Avg Speed" value={avg} unit={su} />
        </View>
        {ride.weather && (
          <View style={styles.weatherBar}>
            <Text style={styles.weatherBarIcon}>{ride.weather.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherBarTemp}>
                {km ? `${ride.weather.tempC}°C` : `${Math.round(ride.weather.tempC * 9 / 5 + 32)}°F`}
                {'  ·  '}{ride.weather.label}
              </Text>
              <Text style={styles.weatherBarWind}>Wind {ride.weather.windKmh} km/h at start</Text>
            </View>
          </View>
        )}
        {(ride.maxLean > 0 || (ride.hazards?.length > 0)) && (
          <View style={styles.detailStatsRow}>
            {ride.maxLean > 0 && <StatCard label="Max Lean" value={`${Math.round(ride.maxLean)}°`} />}
            {ride.hazards?.length > 0 && <StatCard label="Hazards" value={String(ride.hazards.length)} unit="pins" />}
          </View>
        )}
        {hasAlt && (
          <View style={styles.detailStatsRow}>
            <StatCard label="Max Altitude" value={fmtAlt(ride.maxAltM)} />
            <StatCard label="Min Altitude" value={fmtAlt(ride.minAltM)} />
            <StatCard label="Elevation" value={fmtAlt(altGain)} unit="gain" />
          </View>
        )}
        {altValues.length >= 2 && (
          <MetricGraph values={altValues} label="Elevation Profile" gradId="altGrad" width={340} height={80} />
        )}
        {leanValues.length >= 2 && (
          <MetricGraph values={leanValues} label="Lean Angle" gradId="leanGrad" color="#4A9EFF" width={340} height={80} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Group components ─────────────────────────────────────────────────────────

function GroupRow({ group, rides, units, onPress, onDelete }) {
  const km = units === 'km';
  const groupRides = rides.filter(r => group.rideIds.includes(r.id));
  const totalKm = groupRides.reduce((s, r) => s + (r.distKm || 0), 0);
  const totalSec = groupRides.reduce((s, r) => s + (r.elapsed || 0), 0);
  const dist = km ? totalKm.toFixed(1) : (totalKm / 1.60934).toFixed(1);
  const du = km ? 'km' : 'mi';

  const handleLongPress = () => {
    Alert.alert('Delete Trip', 'Remove this trip group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={handleLongPress}
      activeOpacity={0.75} style={styles.rideRow}>
      <View style={[styles.rideThumb, { backgroundColor: 'rgba(255,107,26,0.1)' }]}>
        <Glyph name="history" size={22} color={AX.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rideName}>{group.name}</Text>
        <Text style={styles.rideDate}>{groupRides.length} ride{groupRides.length !== 1 ? 's' : ''}</Text>
        <View style={styles.rideStats}>
          <Text style={styles.rideStat}>{dist} <Text style={styles.rideStatUnit}>{du}</Text></Text>
          <Text style={styles.rideStat}>{fmtDur(totalSec)}</Text>
        </View>
      </View>
      <Glyph name="chevron" size={16} color={AX.ghost} sw={2} />
    </TouchableOpacity>
  );
}

function CreateGroupModal({ visible, rides, units, onSave, onClose }) {
  const km = units === 'km';
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) { setName(''); setSelected(new Set()); }
  }, [visible]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || selected.size === 0) return;
    onSave({ id: Date.now(), name: trimmed, rideIds: [...selected] });
  };

  const du = km ? 'km' : 'mi';

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Glyph name="back" size={20} color={AX.text} sw={2} />
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { flex: 1 }]}>New Trip</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim() || selected.size === 0}
              style={[styles.renameSaveBtn, { paddingHorizontal: 20, height: 38,
                opacity: (!name.trim() || selected.size === 0) ? 0.4 : 1 }]}>
              <Text style={styles.renameSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="Trip name (e.g. Goa Road Trip)…"
              placeholderTextColor={AX.faint}
              style={styles.renameInput}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, { paddingHorizontal: 16, marginBottom: 8 }]}>
            Select rides — {selected.size} chosen
          </Text>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
            {rides.map(r => {
              const on = selected.has(r.id);
              const dist = km ? r.distKm?.toFixed(1) : (r.distKm / 1.60934)?.toFixed(1);
              return (
                <TouchableOpacity key={r.id} onPress={() => toggle(r.id)}
                  activeOpacity={0.75} style={[styles.checkRow, on && styles.checkRowOn]}>
                  <View style={[styles.checkCircle, on && styles.checkCircleOn]}>
                    {on && <View style={styles.checkDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkName}>{r.route || 'Untitled Ride'}</Text>
                    <Text style={styles.checkMeta}>{r.date} · {dist} {du} · {fmtDur(r.elapsed)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {rides.length === 0 && (
              <Text style={[styles.noMapText, { textAlign: 'center', marginTop: 40 }]}>
                No rides to add yet
              </Text>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function GroupDetail({ group, rides, units, onClose, onRename, onDelete }) {
  const insets = useSafeAreaInsets();
  const [renaming, setRenaming] = useState(false);
  const [nameText, setNameText] = useState('');
  const km = units === 'km';

  const groupRides = rides.filter(r => group.rideIds.includes(r.id));
  const region = boundsFromRides(groupRides);
  const totalKm = groupRides.reduce((s, r) => s + (r.distKm || 0), 0);
  const totalSec = groupRides.reduce((s, r) => s + (r.elapsed || 0), 0);
  const topKmh = groupRides.reduce((m, r) => Math.max(m, Math.min(r.maxSpeedKmh || 0, 300)), 0);
  const dist = km ? totalKm.toFixed(2) : (totalKm / 1.60934).toFixed(2);
  const top = km ? Math.round(topKmh) : Math.round(topKmh / 1.60934);
  const su = km ? 'km/h' : 'mph';
  const du = km ? 'km' : 'mi';

  const openRename = () => { setNameText(group.name); setRenaming(true); };
  const saveRename = () => {
    const n = nameText.trim();
    if (n) onRename(n);
    setRenaming(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete Trip', `Remove "${group.name}"? Rides are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
      <Modal visible={renaming} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView style={styles.renameOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Trip</Text>
            <TextInput value={nameText} onChangeText={setNameText}
              placeholder="Trip name…" placeholderTextColor={AX.faint}
              style={styles.renameInput} autoFocus returnKeyType="done" onSubmitEditing={saveRename} />
            <View style={styles.renameActions}>
              <TouchableOpacity onPress={() => setRenaming(false)} style={styles.renameCancelBtn}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveRename} style={styles.renameSaveBtn}>
                <Text style={styles.renameSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Glyph name="back" size={20} color={AX.text} sw={2} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={openRename} activeOpacity={0.7}>
          <Text style={styles.detailTitle}>{group.name}</Text>
          <Text style={styles.detailDate}>{groupRides.length} rides · tap to rename</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Merged map — all routes overlaid */}
      <View style={styles.detailMap}>
        {region ? (
          <MapView style={StyleSheet.absoluteFill} provider={PROVIDER_DEFAULT}
            initialRegion={region} userInterfaceStyle="dark" mapType="standard"
            showsUserLocation={false} scrollEnabled={false} zoomEnabled={false}
            rotateEnabled={false} showsCompass={false}>
            {groupRides.map(r => r.coords?.length > 1 && (
              <Polyline key={r.id} coordinates={r.coords} strokeColor={AX.orange}
                strokeWidth={3} lineCap="round" lineJoin="round" />
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noMap]}>
            <Glyph name="satellite" size={32} color={AX.ghost} sw={1.5} />
            <Text style={styles.noMapText}>No route data</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.detailStats, { paddingBottom: insets.bottom + 24 }]}>
        {/* Combined stats */}
        <View style={styles.detailStatsRow}>
          <StatCard label="Total Distance" value={dist} unit={du} />
          <StatCard label="Total Time" value={fmtDur(totalSec)} />
        </View>
        <View style={styles.detailStatsRow}>
          <StatCard label="Top Speed" value={top} unit={su} />
          <StatCard label="Rides" value={String(groupRides.length)} />
        </View>

        {/* Ride list within group */}
        <Text style={[styles.sectionLabel, { marginTop: 16, marginBottom: 8 }]}>Rides in this trip</Text>
        {groupRides.map(r => {
          const km2 = units === 'km';
          const d = km2 ? r.distKm?.toFixed(1) : (r.distKm / 1.60934)?.toFixed(1);
          const du2 = km2 ? 'km' : 'mi';
          return (
            <View key={r.id} style={[styles.rideRow, { marginBottom: 8 }]}>
              <View style={styles.rideThumb}>
                <Glyph name="track" size={20} color={AX.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rideName}>{r.route || 'Untitled Ride'}</Text>
                <Text style={styles.rideDate}>{r.date}</Text>
                <View style={styles.rideStats}>
                  <Text style={styles.rideStat}>{d} <Text style={styles.rideStatUnit}>{du2}</Text></Text>
                  <Text style={styles.rideStat}>{fmtDur(r.elapsed)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen({ units = 'km' }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('rides');
  const [rides, setRides] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const km = units === 'km';

  useEffect(() => {
    storage.getRides().then(setRides);
    storage.getGroups().then(setGroups);
  }, []);

  // Rides CRUD
  const deleteRide = async (id) => {
    const updated = rides.filter(r => r.id !== id);
    setRides(updated);
    await storage.saveRides(updated);
  };

  const renameRide = async (id, name) => {
    const updated = rides.map(r => r.id === id ? { ...r, route: name } : r);
    setRides(updated);
    setSelectedRide(prev => prev ? { ...prev, route: name } : prev);
    await storage.saveRides(updated);
  };

  // Groups CRUD
  const createGroup = async (group) => {
    const updated = [group, ...groups];
    setGroups(updated);
    setCreatingGroup(false);
    await storage.saveGroups(updated);
  };

  const renameGroup = async (id, name) => {
    const updated = groups.map(g => g.id === id ? { ...g, name } : g);
    setGroups(updated);
    setSelectedGroup(prev => prev ? { ...prev, name } : prev);
    await storage.saveGroups(updated);
  };

  const deleteGroup = async (id) => {
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    setSelectedGroup(null);
    await storage.saveGroups(updated);
  };

  // Summary stats (all rides)
  const totalDistKm = rides.reduce((s, r) => s + (r.distKm || 0), 0);
  const totalSec = rides.reduce((s, r) => s + (r.elapsed || 0), 0);
  const topSpeedKmh = rides.reduce((m, r) => Math.max(m, Math.min(r.maxSpeedKmh || 0, 300)), 0);
  const distDisp = km ? totalDistKm.toFixed(0) : (totalDistKm / 1.60934).toFixed(0);
  const distUnit = km ? 'km' : 'mi';
  const topDisp = km ? Math.round(topSpeedKmh) : Math.round(topSpeedKmh / 1.60934);
  const topUnit = km ? 'km/h' : 'mph';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>{rides.length} ride{rides.length !== 1 ? 's' : ''} logged</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>History</Text>
          {tab === 'groups' && (
            <TouchableOpacity onPress={() => setCreatingGroup(true)} style={styles.newGroupBtn}>
              <Text style={styles.newGroupText}>+ New Trip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setTab('rides')}
            style={[styles.tabBtn, tab === 'rides' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === 'rides' && styles.tabTextActive]}>Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('groups')}
            style={[styles.tabBtn, tab === 'groups' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>Trips</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tab === 'rides' ? (
          <>
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
          </>
        ) : (
          <>
            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Glyph name="history" size={48} color={AX.ghost} sw={1.4} />
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptySub}>Group rides into a named trip — great for multi-day journeys</Text>
                <TouchableOpacity onPress={() => setCreatingGroup(true)} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Create First Trip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Your trips</Text>
                {groups.map(g => (
                  <GroupRow key={g.id} group={g} rides={rides} units={units}
                    onPress={() => setSelectedGroup(g)}
                    onDelete={() => deleteGroup(g.id)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Ride detail */}
      <Modal visible={!!selectedRide} animationType="slide" statusBarTranslucent>
        {selectedRide && (
          <RideDetail ride={selectedRide} units={units}
            onClose={() => setSelectedRide(null)}
            onRename={(name) => renameRide(selectedRide.id, name)} />
        )}
      </Modal>

      {/* Group detail */}
      <Modal visible={!!selectedGroup} animationType="slide" statusBarTranslucent>
        {selectedGroup && (
          <GroupDetail group={selectedGroup} rides={rides} units={units}
            onClose={() => setSelectedGroup(null)}
            onRename={(name) => renameGroup(selectedGroup.id, name)}
            onDelete={() => deleteGroup(selectedGroup.id)} />
        )}
      </Modal>

      {/* Create group */}
      <CreateGroupModal
        visible={creatingGroup}
        rides={rides}
        units={units}
        onSave={createGroup}
        onClose={() => setCreatingGroup(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { fontFamily: FONTS.cond, fontSize: 32, color: AX.text, letterSpacing: -0.5 },
  newGroupBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: AX.orange,
  },
  newGroupText: { fontFamily: FONTS.sairaBold, fontSize: 13, color: '#0C0D10' },

  tabRow: {
    flexDirection: 'row', backgroundColor: AX.surface,
    borderRadius: 14, padding: 3, borderWidth: 1, borderColor: AX.border2,
    alignSelf: 'flex-start',
  },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 11 },
  tabBtnActive: { backgroundColor: AX.orange },
  tabText: { fontFamily: FONTS.sairaBold, fontSize: 13, color: AX.dim },
  tabTextActive: { color: '#0C0D10' },

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
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: FONTS.sairaBold, fontSize: 18, color: AX.dim },
  emptySub: { fontFamily: FONTS.saira, fontSize: 14, color: AX.faint, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24, backgroundColor: AX.orange,
  },
  emptyBtnText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: '#0C0D10' },

  // Checklist (create group)
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: AX.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: AX.border2, marginBottom: 10,
  },
  checkRowOn: { borderColor: AX.orange },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: AX.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleOn: { borderColor: AX.orange, backgroundColor: AX.orange },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0C0D10' },
  checkName: { fontFamily: FONTS.sairaBold, fontSize: 15, color: AX.text, marginBottom: 3 },
  checkMeta: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint },

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
  renameOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  renameCard: {
    width: '100%', backgroundColor: AX.surface, borderRadius: 20,
    padding: 24, gap: 16, borderWidth: 1, borderColor: AX.border2,
  },
  renameTitle: { fontFamily: FONTS.cond, fontSize: 22, color: AX.text },
  renameInput: {
    backgroundColor: AX.bg, borderWidth: 1, borderColor: AX.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: FONTS.saira, fontSize: 16, color: AX.text,
  },
  renameActions: { flexDirection: 'row', gap: 10 },
  renameCancelBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: AX.bg,
    borderWidth: 1, borderColor: AX.border, alignItems: 'center', justifyContent: 'center',
  },
  renameCancelText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: AX.dim },
  renameSaveBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: AX.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  renameSaveText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: '#0C0D10' },
  detailMap: { height: 320, backgroundColor: AX.surface },
  noMap: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  noMapText: { fontFamily: FONTS.saira, fontSize: 13, color: AX.ghost },
  detailStats: { padding: 16, gap: 10 },
  detailStatsRow: { flexDirection: 'row', gap: 10 },

  weatherBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: AX.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: AX.border2,
  },
  weatherBarIcon: { fontSize: 30 },
  weatherBarTemp: { fontFamily: FONTS.sairaBold, fontSize: 15, color: AX.text },
  weatherBarWind: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginTop: 2 },

  // Off-screen share card — positioned far off-screen so it renders but isn't seen
  shareCardWrap: { position: 'absolute', left: -9999, top: 0 },
  shareCard: {
    width: 380, backgroundColor: '#0E1014', padding: 28,
    borderWidth: 1, borderColor: AX.border,
  },
  shareCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareCardBrand: {
    fontFamily: FONTS.cond, fontSize: 26, color: AX.orange, letterSpacing: 2,
  },
  shareCardWeather: { fontFamily: FONTS.sairaBold, fontSize: 16, color: AX.text },
  shareCardTitle: { fontFamily: FONTS.cond, fontSize: 34, color: AX.text, marginTop: 18, letterSpacing: -0.5 },
  shareCardDate: { fontFamily: FONTS.saira, fontSize: 14, color: AX.faint, marginTop: 2 },
  shareCardStatsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 24,
    borderTopWidth: 1, borderTopColor: AX.border, paddingTop: 20,
  },
  shareCardStat: { alignItems: 'flex-start' },
  shareCardValue: { fontFamily: FONTS.cond, fontSize: 40, color: AX.text, letterSpacing: -1 },
  shareCardLabel: {
    fontFamily: FONTS.sairaBold, fontSize: 11, color: AX.faint,
    letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 2,
  },
  shareCardLean: { fontFamily: FONTS.sairaBold, fontSize: 14, color: AX.orange, marginTop: 18 },
});
