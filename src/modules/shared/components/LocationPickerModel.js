// src/modules/shared/components/LocationPickerModal.js

const GOOGLE_MAPS_KEY = "AIzaSyBatDpMkpoEyBosYHqgRJI_HiyjzoXMXJg"; 

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
  PermissionsAndroid,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import toast from "react-native-toast-message";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_CENTER = {
  latitude:       20.5937,
  longitude:      78.9629,
  latitudeDelta:  20,
  longitudeDelta: 20,
};

const PIN_DELTA = {
  latitudeDelta:  0.01,
  longitudeDelta: 0.01,
};

// ─── Geocoding ────────────────────────────────────────────────────────────────

async function reverseGeocode(lat, lng) {
  // Use Google Maps if key is available, else fall back to Nominatim
  if (typeof GOOGLE_MAPS_KEY !== "undefined" && GOOGLE_MAPS_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
      const res  = await fetch(url);
      const json = await res.json();

      if (json.status === "OK" && json.results?.length) {
        const components = json.results[0].address_components;

        const get = (...types) =>
          components.find((c) => types.some((t) => c.types.includes(t)))
            ?.long_name ?? "";

        const streetNumber = get("street_number");
        const route        = get("route");
        const address1     =
          [streetNumber, route].filter(Boolean).join(" ") ||
          get("sublocality_level_2", "sublocality_level_1") ||
          "";
        const address2 = get("sublocality_level_1", "neighbourhood", "sublocality_level_2") || "";
        const city     = get("locality", "administrative_area_level_2") || "";
        const state    = get("administrative_area_level_1") || "";

        return {
          formatted: json.results[0].formatted_address,
          address1,
          address2,
          city,
          state,
        };
      }
    } catch (e) {
      console.warn("[reverseGeocode Google error]", e);
    }
  }

  // Nominatim fallback
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "ResellApp/1.0",
        },
      }
    );
    const data = await res.json();
    const a    = data.address || {};

    const address1 =
      [a.house_number, a.road].filter(Boolean).join(", ") || "";
    const address2 =
      a.neighbourhood || a.suburb || a.county || "";
    const city =
      a.city || a.town || a.village || a.district || "";
    const state = a.state || "";

    return {
      formatted: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address1,
      address2,
      city,
      state,
    };
  } catch {
    return {
      formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address1: "",
      address2: "",
      city:     "",
      state:    "",
    };
  }
}

async function forwardGeocode(query) {
  if (typeof GOOGLE_MAPS_KEY !== "undefined" && GOOGLE_MAPS_KEY) {
    try {
      const url  = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`;
      const res  = await fetch(url);
      const json = await res.json();

      if (json.status === "OK" && json.results?.length) {
        const loc = json.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (e) {
      console.warn("[forwardGeocode Google error]", e);
    }
  }

  // Nominatim fallback
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "ResellApp/1.0",
        },
      }
    );
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // silently fail
  }
  return null;
}

// ─── Request location permission ──────────────────────────────────────────────

async function requestLocationPermission() {
  try {
    if (Platform.OS === "android") {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const status = await Geolocation.requestAuthorization("whenInUse");
    return status === "granted";
  } catch (err) {
    console.warn("[Location permission error]", err);
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   visible      {boolean}
 *   initialLat   {number|null}
 *   initialLng   {number|null}
 *   onConfirm    {({ lat, lng, address1, address2, city, state, formatted }) => void}
 *   onClear      {() => void}
 *   onClose      {() => void}
 */
const LocationPickerModal = ({
  visible,
  initialLat,
  initialLng,
  onConfirm,
  onClear,
  onClose,
}) => {
  const mapRef = useRef(null);

  const hasInitial = initialLat != null && initialLng != null;

  const [pin,       setPin]       = useState(
    hasInitial
      ? { latitude: Number(initialLat), longitude: Number(initialLng) }
      : null
  );
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [geocoding,     setGeocoding]     = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [confirming,    setConfirming]    = useState(false);
  const [searchText,    setSearchText]    = useState("");
  const [searching,     setSearching]     = useState(false);

  // ── Reset state whenever modal opens ──────────────────────────────────────
  useEffect(() => {
    if (visible) {
      const hasInit = initialLat != null && initialLng != null;
      const initPin = hasInit
        ? { latitude: Number(initialLat), longitude: Number(initialLng) }
        : null;
      setPin(initPin);
      setGeocodeResult(null);
      setSearchText("");
      if (initPin) {
        setGeocoding(true);
        reverseGeocode(initPin.latitude, initPin.longitude).then((r) => {
          setGeocodeResult(r);
          setGeocoding(false);
        });
      }
    }
  }, [visible]);

  // ── Place / move pin and reverse geocode ──────────────────────────────────
  const handlePinChange = useCallback(async (latitude, longitude) => {
    setPin({ latitude, longitude });
    setGeocodeResult(null);
    setGeocoding(true);
    const result = await reverseGeocode(latitude, longitude);
    setGeocodeResult(result);
    setGeocoding(false);
  }, []);

  // ── Map tap ───────────────────────────────────────────────────────────────
  const handleMapPress = useCallback((e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    handlePinChange(latitude, longitude);
  }, [handlePinChange]);

  // ── Marker drag end ───────────────────────────────────────────────────────
  const handleDragEnd = useCallback((e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    handlePinChange(latitude, longitude);
  }, [handlePinChange]);

  // ── Search ────────────────────────────────────────────────────────────────
const [suggestions, setSuggestions] = useState([]);

const handleSearchChange = useCallback(async (text) => {
  setSearchText(text);
  if (text.trim().length < 3) { setSuggestions([]); return; }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_KEY}&language=en&components=country:in`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json.status === "OK") {
      setSuggestions(json.predictions.slice(0, 5));
    }
  } catch {
    setSuggestions([]);
  }
}, []);

const handleSuggestionPress = useCallback(async (placeId, description) => {
  setSuggestions([]);
  setSearchText(description);
  setSearching(true);
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_KEY}`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json.status === "OK") {
      const { lat, lng } = json.result.geometry.location;
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, ...PIN_DELTA }, 600
      );
      await handlePinChange(lat, lng);
    }
  } finally {
    setSearching(false);
  }
}, [handlePinChange]);
  // ── Current location ──────────────────────────────────────────────────────
  const handleCurrentLocation = useCallback(async () => {
    const granted = await requestLocationPermission();
    setLocationPermissionGranted(granted);

    if (!granted) {
      Toast.show({
        type: "error", text1: "Permission denied",
        text2: "Location permission is required to use this feature.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
      return;
    }

    setLocating(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          mapRef.current?.animateToRegion(
            { latitude, longitude, ...PIN_DELTA },
            600
          );
          await handlePinChange(latitude, longitude);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        console.warn("[Geolocation error]", err);
        Toast.show({
          type: "error", text1: "Location unavailable",
          text2: "Could not get your current location. Please tap the map instead.",
          position: "top", visibilityTime: 3000, topOffset: 60,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  }, [handlePinChange]);

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pin) return;
    setConfirming(true);
    try {
      const geo = geocodeResult ?? await reverseGeocode(pin.latitude, pin.longitude);
      onConfirm({
        lat:       pin.latitude,
        lng:       pin.longitude,
        formatted: geo.formatted,
        address1:  geo.address1,
        address2:  geo.address2,
        city:      geo.city,
        state:     geo.state,
      });
    } finally {
      setConfirming(false);
    }
  };

  // ── Initial map region ────────────────────────────────────────────────────
  const initialRegion = hasInitial
    ? {
        latitude:  Number(initialLat),
        longitude: Number(initialLng),
        ...PIN_DELTA,
      }
    : INDIA_CENTER;

  const busy = geocoding || confirming || locating || searching;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.container}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.iconBtn}>
              <MaterialIcons name="arrow-back" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Set Location</Text>
            {/* Current-location GPS button */}
            <TouchableOpacity
              style={s.iconBtn}
              onPress={handleCurrentLocation}
              disabled={locating}
            >
              {locating
                ? <ActivityIndicator size="small" color="#0040e0" />
                : <MaterialIcons name="my-location" size={22} color="#0040e0" />}
            </TouchableOpacity>
          </View>

         {/* ── Search bar ─────────────────────────────────────────────── */}
<View style={s.searchRow}>
  <View style={s.searchWrap}>
    <MaterialIcons name="search" size={16} color="#aaa" style={s.searchIcon} />
    <TextInput
      style={s.searchInput}
      placeholder="Search address or place…"
      placeholderTextColor="#bbb"
      value={searchText}
      onChangeText={handleSearchChange}   // ← changed
      returnKeyType="search"
      autoCorrect={false}
    />
    {searchText.length > 0 && (
      <TouchableOpacity onPress={() => { setSearchText(""); setSuggestions([]); }}>
        <MaterialIcons name="cancel" size={16} color="#bbb" />
      </TouchableOpacity>
    )}
  </View>
  <TouchableOpacity
    style={[s.searchBtn, searching && s.searchBtnDisabled]}
    disabled={searching}
  >
    {searching
      ? <ActivityIndicator size="small" color="#fff" />
      : <MaterialIcons name="search" size={18} color="#fff" />}
  </TouchableOpacity>
</View>

{/* ── Autocomplete suggestions ────────────────────────────────── */}
{suggestions.length > 0 && (
  <View style={s.suggestionsBox}>
    {suggestions.map((item) => (
      <TouchableOpacity
        key={item.place_id}
        style={s.suggestionItem}
        onPress={() => handleSuggestionPress(item.place_id, item.description)}
      >
        <MaterialIcons name="location-on" size={14} color="#0040e0" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.suggestionMain} numberOfLines={1}>
            {item.structured_formatting.main_text}
          </Text>
          <Text style={s.suggestionSub} numberOfLines={1}>
            {item.structured_formatting.secondary_text}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
)}

          {/* ── Map ────────────────────────────────────────────────────── */}
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              onPress={handleMapPress}
              showsUserLocation={locationPermissionGranted}
              showsMyLocationButton={false} // we use our own button
            >
              {pin && (
                <Marker
                  coordinate={pin}
                  draggable
                  onDragEnd={handleDragEnd}
                  title="Listing location"
                />
              )}
            </MapView>

            {/* Tap hint */}
            {!pin && (
              <View style={s.tapHint} pointerEvents="none">
                <View style={s.tapHintBubble}>
                  <MaterialIcons name="touch-app" size={14} color="#555" />
                  <Text style={s.tapHintText}>Tap the map to place a pin</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <View style={s.footer}>
            {pin ? (
              <>
                {/* Address preview */}
                <View style={s.addressRow}>
                  <MaterialIcons name="location-on" size={16} color="#0040e0" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    {geocoding ? (
                      <View style={s.geocodingRow}>
                        <ActivityIndicator size="small" color="#0040e0" />
                        <Text style={s.geocodingText}>Resolving address…</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={s.addressMain} numberOfLines={2}>
                          {geocodeResult?.address1 || geocodeResult?.formatted || `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`}
                        </Text>
                        {(geocodeResult?.city || geocodeResult?.state) ? (
                          <Text style={s.addressSub}>
                            {[geocodeResult.city, geocodeResult.state].filter(Boolean).join(", ")}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                </View>

                {/* Buttons */}
                <View style={s.footerBtns}>
                  <TouchableOpacity
                    style={s.clearBtn}
                    onPress={onClear}
                    disabled={busy}
                  >
                    <MaterialIcons name="delete-outline" size={15} color="#c00" />
                    <Text style={s.clearText}>Clear</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.confirmBtn, busy && s.confirmBtnDisabled]}
                    onPress={handleConfirm}
                    disabled={busy}
                  >
                    {confirming
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.confirmText}>Confirm Location</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={s.noSelectionText}>
                No location selected — tap the map, search above, or use the GPS button.
              </Text>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default LocationPickerModal;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingHorizontal: 12,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor:   "#fff",
  },
  iconBtn:     { padding: 6, borderRadius: 20, minWidth: 36, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

suggestionsBox: {
  backgroundColor:   "#fff",
  borderBottomWidth: 1,
  borderBottomColor: "#f0f0f0",
  maxHeight:         220,
},
suggestionItem: {
  flexDirection:     "row",
  alignItems:        "center",
  paddingHorizontal: 14,
  paddingVertical:   11,
  borderBottomWidth: 1,
  borderBottomColor: "#f5f5f5",
},
suggestionMain: { fontSize: 13, fontWeight: "600", color: "#111" },
suggestionSub:  { fontSize: 11, color: "#888", marginTop: 1 },  searchRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             8,
    padding:         10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchWrap: {
    flex:             1,
    flexDirection:    "row",
    alignItems:       "center",
    borderWidth:      1,
    borderColor:      "#e0e0e0",
    borderRadius:     10,
    paddingHorizontal: 10,
    backgroundColor:  "#f8f9ff",
    height:           40,
  },
  searchIcon:         { marginRight: 6 },
  searchInput:        { flex: 1, fontSize: 13, color: "#111", padding: 0 },
  searchBtn:          { width: 40, height: 40, borderRadius: 10, backgroundColor: "#0040e0", alignItems: "center", justifyContent: "center" },
  searchBtnDisabled:  { backgroundColor: "#8aabf0" },

  // Tap hint overlay
  tapHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems:    "center",
    justifyContent: "flex-end",
    paddingBottom:  28,
  },
  tapHintBubble: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              6,
    backgroundColor:  "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:     20,
    shadowColor:      "#000",
    shadowOpacity:    0.1,
    shadowRadius:     6,
    elevation:        4,
  },
  tapHintText: { fontSize: 13, color: "#555", fontWeight: "500" },

  // Footer
  footer: {
    backgroundColor: "#fff",
    borderTopWidth:  1,
    borderTopColor:  "#f0f0f0",
    padding:         14,
    paddingBottom:   Platform.OS === "ios" ? 28 : 14,
  },
  addressRow:    { flexDirection: "row", gap: 8, marginBottom: 12 },
  geocodingRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  geocodingText: { fontSize: 13, color: "#888" },
  addressMain:   { fontSize: 13, fontWeight: "600", color: "#111", lineHeight: 18 },
  addressSub:    { fontSize: 12, color: "#888", marginTop: 2 },

  footerBtns: { flexDirection: "row", gap: 10 },
  clearBtn: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              6,
    borderWidth:      1,
    borderColor:      "#ffd5d5",
    backgroundColor:  "#fff5f5",
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:     10,
  },
  clearText:          { color: "#c00", fontWeight: "600", fontSize: 13 },
  confirmBtn:         { flex: 1, backgroundColor: "#0040e0", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
  confirmBtnDisabled: { backgroundColor: "#8aabf0" },
  confirmText:        { color: "#fff", fontWeight: "700", fontSize: 14 },
  noSelectionText:    { textAlign: "center", color: "#aaa", fontSize: 13, paddingVertical: 8 },
});
