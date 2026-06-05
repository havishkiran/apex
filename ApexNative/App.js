import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AX, FONTS } from './src/tokens';
import { storage } from './src/native/storage';
import TrackScreen from './src/screens/TrackScreen';
import GarageScreen from './src/screens/GarageScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Track:    focused ? '◉' : '○',
    Garage:   focused ? '⬛' : '▪',
    History:  focused ? '▣' : '▢',
    Settings: focused ? '⚙' : '⚙',
  };

  // Use SVG-style text icons
  const labels = { Track: '⏺', Garage: '🏍', History: '📋', Settings: '⚙️' };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.iconText, { opacity: focused ? 1 : 0.45 }]}>
        {labels[name] || name[0]}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
});

export default function App() {
  const [units, setUnits] = useState('km');
  const [tweaks, setTweaks] = useState({
    crashDetect: true, voiceCues: true, safety: true, lockSpeed: 35,
    autoStart: true, autoPause: true,
  });

  useEffect(() => {
    storage.getSettings().then((s) => {
      if (s?.units) setUnits(s.units);
      if (s?.tweaks) setTweaks((t) => ({ ...t, ...s.tweaks }));
    });
  }, []);

  const handleSetUnits = (v) => {
    setUnits(v);
    storage.getSettings().then((s) => storage.saveSettings({ ...s, units: v }));
  };

  const handleSetTweak = (key, value) => {
    setTweaks((t) => {
      const next = { ...t, [key]: value };
      storage.getSettings().then((s) => storage.saveSettings({ ...s, tweaks: next }));
      return next;
    });
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'rgba(15,16,20,0.95)',
              borderTopColor: AX.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 64,
              paddingTop: 8,
            },
            tabBarActiveTintColor: AX.orange,
            tabBarInactiveTintColor: AX.faint,
            tabBarLabelStyle: {
              fontFamily: FONTS.sairaBold,
              fontSize: 10.5,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginTop: 2,
            },
          }}
        >
          <Tab.Screen name="Track"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="Track" focused={focused} /> }}>
            {() => <TrackScreen units={units} tweaks={tweaks} />}
          </Tab.Screen>

          <Tab.Screen name="Garage"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="Garage" focused={focused} /> }}>
            {() => <GarageScreen units={units} />}
          </Tab.Screen>

          <Tab.Screen name="History"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="History" focused={focused} /> }}>
            {() => <HistoryScreen units={units} />}
          </Tab.Screen>

          <Tab.Screen name="Settings"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} /> }}>
            {() => <SettingsScreen units={units} onSetUnits={handleSetUnits}
              tweaks={tweaks} onSetTweak={handleSetTweak} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
