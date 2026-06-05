#!/bin/bash
# Run after: npx cap add ios / npx cap add android
# Adds Bluetooth + Location permissions to native projects

IOS_PLIST="ios/App/App/Info.plist"
ANDROID_MANIFEST="android/app/src/main/AndroidManifest.xml"

# --- iOS ---
if [ -f "$IOS_PLIST" ]; then
  echo "Patching iOS Info.plist..."

  # Add Bluetooth permissions if not already present
  if ! grep -q "NSBluetoothAlwaysUsageDescription" "$IOS_PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSBluetoothAlwaysUsageDescription string 'Apex uses Bluetooth to connect to OBD-II adapters, helmet intercoms, and sensors.'" "$IOS_PLIST"
    /usr/libexec/PlistBuddy -c "Add :NSBluetoothPeripheralUsageDescription string 'Apex uses Bluetooth to connect to OBD-II adapters, helmet intercoms, and sensors.'" "$IOS_PLIST"
  fi

  # Add Location permissions for GPS (if not present)
  if ! grep -q "NSLocationAlwaysAndWhenInUseUsageDescription" "$IOS_PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSLocationAlwaysAndWhenInUseUsageDescription string 'Apex needs location access to track your ride route and speed.'" "$IOS_PLIST"
    /usr/libexec/PlistBuddy -c "Add :NSLocationWhenInUseUsageDescription string 'Apex needs location access to track your ride route and speed.'" "$IOS_PLIST"
    /usr/libexec/PlistBuddy -c "Add :NSMotionUsageDescription string 'Apex uses motion data to detect lean angle and crash events.'" "$IOS_PLIST"
  fi

  echo "iOS permissions patched."
fi

# --- Android ---
if [ -f "$ANDROID_MANIFEST" ]; then
  echo "Patching Android AndroidManifest.xml..."

  PERMS='    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />\n    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />\n    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />\n    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.BODY_SENSORS" />'

  if ! grep -q "BLUETOOTH_SCAN" "$ANDROID_MANIFEST"; then
    sed -i "s|<manifest|<manifest|" "$ANDROID_MANIFEST"
    sed -i "s|<uses-permission android:name=\"android.permission.INTERNET\"|${PERMS}\n    <uses-permission android:name=\"android.permission.INTERNET\"|" "$ANDROID_MANIFEST"
  fi

  echo "Android permissions patched."
fi

echo "Done. Run 'npx cap sync' to apply."
