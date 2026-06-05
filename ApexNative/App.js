import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { AX, FONTS } from './src/tokens';
import { storage } from './src/native/storage';
import { Glyph } from './src/components/Glyph';
import TrackScreen from './src/screens/TrackScreen';
import GarageScreen from './src/screens/GarageScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Track:    'track',
  Garage:   'garage',
  History:  'history',
  Settings: 'settings',
};

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
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <Glyph
                name={TAB_ICONS[route.name]}
                size={22}
                color={color}
                sw={focused ? 2.2 : 1.8}
              />
            ),
            tabBarStyle: {
              backgroundColor: 'rgba(15,16,20,0.96)',
              borderTopColor: AX.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 64,
              paddingTop: 10,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            },
            tabBarActiveTintColor: AX.orange,
            tabBarInactiveTintColor: AX.ghost,
            tabBarLabelStyle: {
              fontFamily: FONTS.sairaBold,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginTop: 3,
            },
          })}
        >
          <Tab.Screen name="Track">
            {() => <TrackScreen units={units} tweaks={tweaks} />}
          </Tab.Screen>

          <Tab.Screen name="Garage">
            {() => <GarageScreen units={units} />}
          </Tab.Screen>

          <Tab.Screen name="History">
            {() => <HistoryScreen units={units} />}
          </Tab.Screen>

          <Tab.Screen name="Settings">
            {() => <SettingsScreen units={units} onSetUnits={handleSetUnits}
              tweaks={tweaks} onSetTweak={handleSetTweak} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
