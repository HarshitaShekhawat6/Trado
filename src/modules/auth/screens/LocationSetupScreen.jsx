// src/modules/auth/screens/LocationSetupScreen.jsx
// ─── NEW FILE ─────────────────────────────────────────────────────────────────
// Flow:
//   1. Screen opens → request location permission (OS dialog auto-shows)
//   2. Permission granted → get GPS → show map centered on user with radius circle
//   3. Slider to change radius (1–100 km, default 20)
//   4. "Done" → save lat/lng/radius to AuthContext → navigate to Main
//   5. Permission denied → alert → retry button
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Slider from "@react-native-community/slider";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../../navigation/AuthContext";
import { updateProfileService } from "../../profile/services/profileService";

// ─── Permission helper ────────────────────────────────────────────────────────
const requestPermission = async () => {
  if (Platform.OS === "android") {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]  === PermissionsAndroid.RESULTS.GRANTED ||
      result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  // iOS
  const status = await Geolocation.requestAuthorization("whenInUse");
  return status === "granted";
};

// ─── Get GPS ──────────────────────────────────────────────────────────────────
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });

// ─── km → degrees (approximate for circle radius) ────────────────────────────
const kmToDelta = (km) => km / 111;

// ─── Component ────────────────────────────────────────────────────────────────
const LocationSetupScreen = ({ navigation }) => {
  const { updateUser, user } = useAuth();
  const mapRef = useRef(null);

  const [status,    setStatus]    = useState("loading"); // loading | granted | denied
  const [coords,    setCoords]    = useState(null);      // { latitude, longitude }
  const [radius,    setRadius]    = useState(20);        // km
  const [saving,    setSaving]    = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Fade in animation ──────────────────────────────────────────────────────
  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ── Request permission + fetch location ────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    setStatus("loading");
    try {
      const granted = await requestPermission();
      if (!granted) {
        setStatus("denied");
        return;
      }
      const position = await getCurrentPosition();
      setCoords({ latitude: position.latitude, longitude: position.longitude });
      setStatus("granted");
      fadeIn();

      // Animate map to user location
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude:      position.latitude,
          longitude:     position.longitude,
          latitudeDelta:  kmToDelta(radius) * 2.5,
          longitudeDelta: kmToDelta(radius) * 2.5,
        }, 800);
      }, 300);
    } catch (err) {
      setStatus("denied");
    }
  }, [fadeIn, radius]);

  // ── Auto-fetch on mount ────────────────────────────────────────────────────
  useEffect(() => { fetchLocation(); }, []);

  // ── Animate map when radius changes ───────────────────────────────────────
  useEffect(() => {
    if (!coords) return;
    mapRef.current?.animateToRegion({
      latitude:       coords.latitude,
      longitude:      coords.longitude,
      latitudeDelta:  kmToDelta(radius) * 2.5,
      longitudeDelta: kmToDelta(radius) * 2.5,
    }, 400);
  }, [radius, coords]);

  // ── Save location to profile DB + context, then go Home ──────────────────
  const handleDone = async () => {
    setSaving(true);
    try {
      if (coords) {
        // Save lat/lng silently to DB
        await updateProfileService(
          {
            latitude:  String(coords.latitude),
            longitude: String(coords.longitude),
          },
          null // no image
        );
        // Update AuthContext so Home picks it up immediately
        updateUser({
          latitude:  coords.latitude,
          longitude: coords.longitude,
          radius,
        });
      }
    } catch {
      // Non-blocking — if save fails, still go Home
    } finally {
      setSaving(false);
      navigation.replace("Main");
    }
  };

  // ── Skip without saving ───────────────────────────────────────────────────
  const handleSkip = () => navigation.replace("Main");

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e5bff" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  // ── Render: Permission Denied ─────────────────────────────────────────────
  if (status === "denied") {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialIcons name="location-off" size={64} color="#ccc" />
        <Text style={styles.deniedTitle}>Location Access Needed</Text>
        <Text style={styles.deniedSub}>
          We use your location to show you nearby listings. Please allow location access.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchLocation}>
          <MaterialIcons name="my-location" size={18} color="#fff" />
          <Text style={styles.retryText}>Allow Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Render: Map + Slider ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Map — full screen */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude:       coords?.latitude  ?? 20.5937,
          longitude:      coords?.longitude ?? 78.9629,
          latitudeDelta:  kmToDelta(radius) * 2.5,
          longitudeDelta: kmToDelta(radius) * 2.5,
        }}
      >
        {coords && (
          <>
            <Marker coordinate={coords} title="You are here">
              <View style={styles.markerDot} />
            </Marker>
            <Circle
              center={coords}
              radius={radius * 1000} // metres
              strokeColor="rgba(46,91,255,0.6)"
              fillColor="rgba(46,91,255,0.1)"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Top card */}
      <SafeAreaView edges={["top"]} style={styles.topCardWrap}>
        <Animated.View style={[styles.topCard, { opacity: fadeAnim }]}>
          <Text style={styles.topTitle}>📍 Set Your Area</Text>
          <Text style={styles.topSub}>
            Listings within <Text style={styles.radiusBold}>{radius} km</Text> of you will be shown
          </Text>
        </Animated.View>
      </SafeAreaView>

      {/* Bottom card — slider + button */}
      <Animated.View style={[styles.bottomCard, { opacity: fadeAnim }]}>

        {/* Radius label row */}
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>Nearby Range</Text>
          <View style={styles.kmBadge}>
            <Text style={styles.kmBadgeText}>{radius} km</Text>
          </View>
        </View>

        {/* Slider */}
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={radius}
          onValueChange={(val) => setRadius(Math.round(val))}
          minimumTrackTintColor="#2e5bff"
          maximumTrackTintColor="#dde2f0"
          thumbTintColor="#2e5bff"
        />

        {/* Range labels */}
        <View style={styles.sliderEndLabels}>
          <Text style={styles.sliderEndText}>1 km</Text>
          <Text style={styles.sliderEndText}>100 km</Text>
        </View>

        {/* Quick select chips */}
        <View style={styles.chipRow}>
          {[5, 10, 20, 50].map((km) => (
            <TouchableOpacity
              key={km}
              style={[styles.chip, radius === km && styles.chipActive]}
              onPress={() => setRadius(km)}
            >
              <Text style={[styles.chipText, radius === km && styles.chipTextActive]}>
                {km} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.doneBtn, saving && styles.doneBtnDisabled]}
          onPress={handleDone}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.doneBtnText}>Done — Show Nearby Listings</Text>
              </>
            )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtnBottom} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

export default LocationSetupScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "#f8f9ff", padding: 32,
  },
  loadingText: { marginTop: 16, fontSize: 15, color: "#666" },

  // Denied
  deniedTitle: { fontSize: 22, fontWeight: "800", color: "#111", marginTop: 20, textAlign: "center" },
  deniedSub:   { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 22, marginTop: 10, marginBottom: 32 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#2e5bff", paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, marginBottom: 14,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Top card
  topCardWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topCard: {
    margin: 16, backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
  },
  topTitle:   { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 4 },
  topSub:     { fontSize: 13, color: "#666" },
  radiusBold: { color: "#2e5bff", fontWeight: "700" },

  // Marker
  markerDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#2e5bff",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#2e5bff", shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
  },

  // Bottom card
  bottomCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 12,
  },

  sliderLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sliderLabel:    { fontSize: 15, fontWeight: "700", color: "#111" },
  kmBadge: {
    backgroundColor: "#eef1ff", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  kmBadgeText: { color: "#2e5bff", fontWeight: "800", fontSize: 14 },

  slider: { width: "100%", height: 40 },

  sliderEndLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -8, marginBottom: 16 },
  sliderEndText:   { fontSize: 11, color: "#aaa" },

  chipRow:     { flexDirection: "row", gap: 8, marginBottom: 20 },
  chip: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#f3f4f8", alignItems: "center",
    borderWidth: 1.5, borderColor: "transparent",
  },
  chipActive:     { backgroundColor: "#eef1ff", borderColor: "#2e5bff" },
  chipText:       { fontSize: 13, color: "#555", fontWeight: "600" },
  chipTextActive: { color: "#2e5bff" },

  doneBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#2e5bff", paddingVertical: 16, borderRadius: 16, marginBottom: 12,
  },
  doneBtnDisabled: { backgroundColor: "#8aaaf0" },
  doneBtnText:     { color: "#fff", fontWeight: "700", fontSize: 15 },

  skipBtnBottom: { alignItems: "center", paddingVertical: 4 },
  skipBtn:       { marginTop: 16 },
  skipText:      { color: "#aaa", fontSize: 13 },
});