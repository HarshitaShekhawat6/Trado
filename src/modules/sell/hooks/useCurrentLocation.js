// modules/sell/hooks/useCurrentLocation.js

import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

const GOOGLE_API_KEY = ''; // apni key daalo

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ResellApp/1.0' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    return {
      address1: [a.house_number, a.road].filter(Boolean).join(', ') || '',
      address2: a.neighbourhood || a.suburb || a.county || '',
      city:     a.city || a.town || a.village || a.district || '',
      state:    a.state || '',
      address:  data.display_name || '',
    };
  } catch {
    return { address1: '', address2: '', city: '', state: '', address: '' };
  }
}

export const useCurrentLocation = () => {
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      // ── Android permission ──
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const granted =
          result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!granted) {
          Toast.show({
            type: "error", text1: "Permission Denied",
            text2: "Enable location in Settings.",
            position: "top", visibilityTime: 3000, topOffset: 60,
          });
          return null;
        }
      } else {
        const status = await Geolocation.requestAuthorization('whenInUse');
        if (status !== 'granted') {
          Toast.show({
            type: "error", text1: "Permission Denied",
            text2: "Enable location in Settings.",
            position: "top", visibilityTime: 3000, topOffset: 60,
          });
          return null;
        }
      }

      // ── GPS ──
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout:            10000,
            maximumAge:         60000,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const geo = await reverseGeocode(latitude, longitude);

      return {
        lat:      latitude,
        lng:      longitude,
        address1: geo.address1,
        address2: geo.address2,
        city:     geo.city,
        state:    geo.state,
        address:  geo.address,
      };

    } catch (err) {
      console.warn('[useCurrentLocation error]', err);
      Toast.show({
        type: "error", text1: "GPS Not Available",
        text2: "Could not detect location automatically.\n\nPlease fill in the address fields manually.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrentLocation, loading };
};
