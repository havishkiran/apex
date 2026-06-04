import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apex.ridetracker',
  appName: 'Apex',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    Geolocation: {
      // Request always-on location for background ride tracking
    },
  },
};

export default config;
