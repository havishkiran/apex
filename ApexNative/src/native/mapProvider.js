import { Platform } from 'react-native';
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

// iOS  → Apple Maps (native, no API key needed). Dark via userInterfaceStyle.
// Android → Google Maps (needs a Google Maps API key). Dark via customMapStyle.
export const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

// Google Maps (Android) doesn't honour userInterfaceStyle="dark", so we feed it
// an explicit dark JSON style. On iOS this stays empty and Apple Maps handles dark.
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0e1014' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1014' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a93a3' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2d34' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9aa4b4' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#b0b8c4' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2228' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2a2d34' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#596270' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#262a31' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#33373f' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2228' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0c0f' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a3f4a' }] },
];

// Spread these onto every <MapView> so dark mode works on both platforms.
export const MAP_DARK_PROPS = Platform.OS === 'android'
  ? { customMapStyle: DARK_STYLE }
  : { userInterfaceStyle: 'dark' };
