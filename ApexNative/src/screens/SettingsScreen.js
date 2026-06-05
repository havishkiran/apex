import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AX, FONTS } from '../tokens';
import { storage } from '../native/storage';

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Row({ label, sub, right, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Group({ children }) {
  return <View style={styles.group}>{children}</View>;
}

function EditableField({ value, placeholder, onSave, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (editing) {
    return (
      <TextInput
        autoFocus value={draft} placeholder={placeholder}
        placeholderTextColor={AX.faint}
        onChangeText={setDraft}
        onBlur={() => { onSave(draft.trim()); setEditing(false); }}
        onSubmitEditing={() => { onSave(draft.trim()); setEditing(false); }}
        style={[styles.editInput, style]}
      />
    );
  }
  return (
    <TouchableOpacity onPress={() => { setDraft(value || ''); setEditing(true); }}>
      <Text style={[styles.editValue, !value && { color: AX.faint }, style]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => (
        <TouchableOpacity key={o} onPress={() => onChange(o)}
          style={[styles.segBtn, value === o && styles.segBtnActive]}>
          <Text style={[styles.segBtnText, value === o && styles.segBtnTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen({ units, onSetUnits, tweaks, onSetTweak }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState({ name: '', avatar: null });
  const [emergency, setEmergency] = useState({ name: '', phone: '' });

  useEffect(() => {
    storage.getProfile().then(setProfile);
    storage.getEmergency().then(setEmergency);
  }, []);

  const saveProfile = (updates) => {
    const p = { ...profile, ...updates };
    setProfile(p); storage.saveProfile(p);
  };

  const saveEmergency = (updates) => {
    const e = { ...emergency, ...updates };
    setEmergency(e); storage.saveEmergency(e);
  };

  const crashOn = tweaks?.crashDetect !== false;
  const cuesOn = tweaks?.voiceCues !== false;
  const safetyOn = tweaks?.safety !== false;
  const set = onSetTweak || (() => {});

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Your profile</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 28 }}>🏍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <EditableField value={profile.name} placeholder="Your name"
              onSave={(name) => saveProfile({ name })} style={{ fontSize: 20 }} />
            <Text style={styles.profileHint}>Tap name to edit</Text>
          </View>
        </View>

        <SectionLabel>Recording</SectionLabel>
        <Group>
          <Row label="Auto-start detection" sub="Begin a ride when motion is sensed"
            right={<Switch value={tweaks?.autoStart !== false} onValueChange={(v) => set('autoStart', v)}
              trackColor={{ false: AX.border, true: AX.orange }} />} />
          <Row label="Auto-pause" sub="Pause when stopped over 30s" last
            right={<Switch value={tweaks?.autoPause !== false} onValueChange={(v) => set('autoPause', v)}
              trackColor={{ false: AX.border, true: AX.orange }} />} />
        </Group>

        <SectionLabel>Safety</SectionLabel>
        <Group>
          <Row label="Crash detection" sub="Auto-alert your contact after a fall"
            right={<Switch value={crashOn} onValueChange={(v) => set('crashDetect', v)}
              trackColor={{ false: AX.border, true: AX.orange }} />} />
          <Row label="Emergency contact"
            right={
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <EditableField value={emergency.name} placeholder="Contact name"
                  onSave={(name) => saveEmergency({ name })} />
                <EditableField value={emergency.phone} placeholder="Phone number"
                  onSave={(phone) => saveEmergency({ phone })} style={{ fontSize: 12, color: AX.dim }} />
              </View>
            } />
          <Row label="Auto-lock while riding" sub={`Above ${tweaks?.lockSpeed ?? 35} km/h`} last
            right={<Switch value={safetyOn} onValueChange={(v) => set('safety', v)}
              trackColor={{ false: AX.border, true: AX.orange }} />} />
        </Group>

        <SectionLabel>Display & Cues</SectionLabel>
        <Group>
          <Row label="Voice cues" sub="Spoken stat callouts"
            right={<Switch value={cuesOn} onValueChange={(v) => set('voiceCues', v)}
              trackColor={{ false: AX.border, true: AX.orange }} />} />
          <Row label="Units" last
            right={<Segmented value={units} options={['km', 'mi']} onChange={onSetUnits} />} />
        </Group>

        <SectionLabel>Data</SectionLabel>
        <Group>
          <Row label="Privacy" sub="All data stored on-device only" last
            right={<Text style={styles.badge}>On-device</Text>} />
        </Group>

        <Text style={styles.version}>Apex · Version 1.0{'\n'}Ride logged, lean noted.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AX.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  headerSub: { fontFamily: FONTS.saira, fontSize: 13, color: AX.faint, marginBottom: 2 },
  headerTitle: { fontFamily: FONTS.cond, fontSize: 32, color: AX.text, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 48, gap: 8 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: AX.surface, borderRadius: 18, borderWidth: 1, borderColor: AX.border2,
    marginBottom: 8,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: AX.bg,
    borderWidth: 1, borderColor: AX.border, alignItems: 'center', justifyContent: 'center',
  },
  profileHint: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginTop: 4 },

  sectionLabel: {
    fontFamily: FONTS.sairaBold, fontSize: 11.5, color: AX.faint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 12, marginBottom: 6,
  },
  group: { backgroundColor: AX.surface, borderRadius: 18, borderWidth: 1, borderColor: AX.border2, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: AX.border2 },
  rowLabel: { fontFamily: FONTS.sairaMed, fontSize: 15, color: AX.text },
  rowSub: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, marginTop: 1 },

  editInput: { fontFamily: FONTS.saira, fontSize: 15, color: AX.text, borderBottomWidth: 1, borderBottomColor: AX.orange, minWidth: 80 },
  editValue: { fontFamily: FONTS.saira, fontSize: 15, color: AX.text, borderBottomWidth: 1, borderBottomColor: AX.border },

  segmented: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: 11, backgroundColor: AX.bg, borderWidth: 1, borderColor: AX.border2 },
  segBtn: { minWidth: 42, height: 26, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segBtnActive: { backgroundColor: AX.orange },
  segBtnText: { fontFamily: FONTS.sairaBold, fontSize: 12.5, color: AX.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
  segBtnTextActive: { color: '#0E1014' },

  badge: { fontFamily: FONTS.saira, fontSize: 13, color: AX.dim },
  version: { fontFamily: FONTS.saira, fontSize: 12, color: AX.faint, textAlign: 'center', marginTop: 24, lineHeight: 20 },
});
