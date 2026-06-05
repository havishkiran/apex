import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { storage } from '../native/storage';

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default' }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={AX.faint} keyboardType={keyboardType}
        style={styles.fieldInput}
      />
    </View>
  );
}

function AddBikeModal({ visible, units, onSave, onClose }) {
  const km = units === 'km';
  const [form, setForm] = useState({
    make: '', model: '', year: String(new Date().getFullYear()),
    cc: '', odo: '', serviceInterval: '5000',
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
    setForm({ make: '', model: '', year: String(new Date().getFullYear()), cc: '', odo: '', serviceInterval: '5000' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bike</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Text style={{ color: AX.dim, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Field label="Make" value={form.make} onChange={upd('make')} placeholder="Ducati, Honda, Yamaha…" />
            <Field label="Model" value={form.model} onChange={upd('model')} placeholder="Monster 937, CB350…" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Year" value={form.year} onChange={upd('year')} placeholder="2024" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Engine" value={form.cc} onChange={upd('cc')} placeholder="350cc" />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label={`Odometer (${km ? 'km' : 'mi'})`} value={form.odo}
                  onChange={upd('odo')} placeholder="0" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={`Service every (${km ? 'km' : 'mi'})`} value={form.serviceInterval}
                  onChange={upd('serviceInterval')} placeholder="5000" keyboardType="number-pad" />
              </View>
            </View>
            <TouchableOpacity onPress={handleSave} disabled={!valid}
              style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}>
              <Text style={[styles.saveBtnText, !valid && { color: AX.dim }]}>Save Bike</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function BikeCard({ bike, active, units, onActivate, onDelete }) {
  const km = units === 'km';
  const odoDisp = Math.round(km ? bike.odo * 1.60934 : bike.odo).toLocaleString();
  const unit = km ? 'km' : 'mi';
  const svcInterval = km ? (bike.serviceInterval || 5000) * 1.60934 : (bike.serviceInterval || 5000);
  const svcPct = Math.min(1, (bike.odo || 0) / (bike.serviceInterval || 5000));
  const svcPctDisp = Math.round(svcPct * 100);

  return (
    <TouchableOpacity onPress={onActivate} activeOpacity={0.8}
      style={[styles.bikeCard, active && styles.bikeCardActive]}>
      <View style={styles.bikeHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.bikeNameRow}>
            <Text style={styles.bikeName}>{bike.year} {bike.make} {bike.model}</Text>
            {active && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          {bike.cc ? <Text style={styles.bikeSub}>{bike.cc}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => {
          Alert.alert('Remove Bike', `Remove ${bike.make} ${bike.model}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: onDelete },
          ]);
        }} style={styles.deleteBtn}>
          <Text style={{ color: AX.faint, fontSize: 16 }}>🗑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bikeStats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{odoDisp}</Text>
          <Text style={styles.statLabel}>{unit}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{svcPctDisp}%</Text>
          <Text style={styles.statLabel}>service due</Text>
        </View>
      </View>

      <View style={styles.svcBar}>
        <View style={[styles.svcBarFill, { width: `${svcPctDisp}%`,
          backgroundColor: svcPct > 0.85 ? '#FF4444' : svcPct > 0.6 ? AX.orange : '#34C759' }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function GarageScreen({ units = 'km' }) {
  const insets = useSafeAreaInsets();
  const [bikes, setBikes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    storage.getBikes().then((saved) => {
      setBikes(saved);
      const active = saved.find(b => b.active) || saved[0];
      if (active) setActiveId(active.id);
    });
  }, []);

  const persist = useCallback((list, aid) => {
    const withActive = list.map(b => ({ ...b, active: b.id === aid }));
    setBikes(withActive);
    storage.saveBikes(withActive);
  }, []);

  const handleAdd = (bike) => {
    const updated = [...bikes, bike];
    const aid = bikes.length === 0 ? bike.id : activeId;
    if (bikes.length === 0) setActiveId(bike.id);
    persist(updated, aid);
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    const updated = bikes.filter(b => b.id !== id);
    const aid = id === activeId ? (updated[0]?.id ?? null) : activeId;
    setActiveId(aid);
    persist(updated, aid);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Your bikes</Text>
          <Text style={styles.headerTitle}>Garage</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {bikes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏍</Text>
            <Text style={styles.emptyTitle}>No bikes yet</Text>
            <Text style={styles.emptySub}>Tap + Add to add your first bike</Text>
          </View>
        ) : (
          <>
            <SectionLabel>My Bikes</SectionLabel>
            {bikes.map(b => (
              <BikeCard key={b.id} bike={b} active={b.id === activeId} units={units}
                onActivate={() => { setActiveId(b.id); persist(bikes, b.id); }}
                onDelete={() => handleDelete(b.id)} />
            ))}
          </>
        )}
      </ScrollView>

      <AddBikeModal visible={showAdd} units={units} onSave={handleAdd} onClose={() => setShowAdd(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
  },
  headerSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginBottom: 2 },
  headerTitle: { fontFamily: FONTS.cond, fontSize: 32, color: AX.text, letterSpacing: -0.5 },
  addBtn: {
    height: 36, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: AX.orange, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontFamily: FONTS.sairaBold, fontSize: 14, color: '#0E1014' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  sectionLabel: {
    fontFamily: FONTS.sairaBold, fontSize: 11.5, color: AX.faint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4, marginTop: 8,
  },

  // Bike card
  bikeCard: {
    backgroundColor: AX.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: AX.border2,
  },
  bikeCardActive: { borderColor: 'rgba(255,107,26,0.5)' },
  bikeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  bikeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bikeName: { fontFamily: FONTS.sairaBold, fontSize: 16, color: AX.text },
  bikeSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginTop: 2 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 9,
    borderRadius: 11, backgroundColor: 'rgba(255,107,26,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.45)',
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AX.orange },
  activeBadgeText: { fontFamily: FONTS.sairaBold, fontSize: 10, color: AX.orange,
    letterSpacing: 1, textTransform: 'uppercase' },
  deleteBtn: { padding: 4 },
  bikeStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FONTS.cond, fontSize: 28, color: AX.text },
  statLabel: { fontFamily: FONTS.saira, fontSize: 11, color: AX.faint, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: AX.border },
  svcBar: { height: 4, backgroundColor: AX.border, borderRadius: 2, overflow: 'hidden' },
  svcBarFill: { height: '100%', borderRadius: 2 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: FONTS.sairaBold, fontSize: 18, color: AX.dim },
  emptySub: { fontFamily: FONTS.saira, fontSize: 14, color: AX.faint },

  // Modal
  modalBackdrop: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: AX.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44,
    borderTopWidth: 1, borderColor: AX.border, gap: 14,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: AX.border, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: FONTS.cond, fontWeight: '700', fontSize: 24, color: AX.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: AX.bg, alignItems: 'center', justifyContent: 'center' },
  row2: { flexDirection: 'row', gap: 12 },

  // Field
  fieldWrap: { gap: 6 },
  fieldLabel: { fontFamily: FONTS.sairaBold, fontSize: 11.5, letterSpacing: 1, textTransform: 'uppercase', color: AX.faint },
  fieldInput: {
    backgroundColor: AX.bg, borderWidth: 1, borderColor: AX.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.saira,
    fontSize: 15, color: AX.text,
  },
  saveBtn: {
    height: 52, borderRadius: 16, backgroundColor: AX.orange,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: AX.border },
  saveBtnText: { fontFamily: FONTS.sairaBold, fontSize: 15, color: '#0E1014' },
});
