
import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform,
  KeyboardAvoidingView, Modal,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// ─── Constants ────────────────────────────────────────────────────────────────

// Default centre: India
const DEFAULT_REGION = {
  latitude:       20.5937,
  longitude:      78.9629,
  latitudeDelta:  20,
  longitudeDelta: 20,
};

const PIN_DELTA = {
  latitudeDelta:  0.01,
  longitudeDelta: 0.01,
};

// ─── Reverse geocode via OpenStreetMap Nominatim (free, no key needed) ───────

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          // Replace with your app name + contact as Nominatim requires a User-Agent
          "User-Agent": "YourAppName/1.0 (your@email.com)",
        },
      }
    );
    const data = await res.json();
    const a    = data.address || {};
    return {
      address:  data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address1: [a.house_number, a.road].filter(Boolean).join(", "),
      address2: a.neighbourhood || a.suburb || a.county || "",
      city:     a.city || a.town || a.village || a.district || "",
      state:    a.state || "",
    };
  } catch {
    return {
      address:  `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      address1: "",
      address2: "",
      city:     "",
      state:    "",
    };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   visible      {boolean}
 *   initialLat   {number|null}
 *   initialLng   {number|null}
 *   onConfirm    {(result: { lat, lng, address, address1, address2, city, state }) => void}
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

  const [pin, setPin] = useState(
    hasInitial
      ? { latitude: Number(initialLat), longitude: Number(initialLng) }
      : null
  );
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [geocoding,     setGeocoding]     = useState(false);
  const [confirming,    setConfirming]    = useState(false);
  const [searchText,    setSearchText]    = useState("");

  // ── Reverse geocode when pin changes ──────────────────────────────────────
  const handlePinChange = useCallback(async (coordinate) => {
    const { latitude, longitude } = coordinate;
    setPin({ latitude, longitude });
    setGeocoding(true);
    const result = await reverseGeocode(latitude, longitude);
    setGeocodeResult(result);
    setGeocoding(false);
  }, []);

  // ── Map tap ───────────────────────────────────────────────────────────────
  const handleMapPress = useCallback((e) => {
    handlePinChange(e.nativeEvent.coordinate);
  }, [handlePinChange]);

  // ── Marker drag end ───────────────────────────────────────────────────────
  const handleDragEnd = useCallback((e) => {
    handlePinChange(e.nativeEvent.coordinate);
  }, [handlePinChange]);

  // ── Search address via Nominatim (forward geocode) ────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setGeocoding(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText.trim())}&limit=1&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "YourAppName/1.0 (your@email.com)",
          },
        }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const coordinate = { latitude: lat, longitude: lng };
        mapRef.current?.animateToRegion({ ...coordinate, ...PIN_DELTA }, 600);
        await handlePinChange(coordinate);
      }
    } catch {
      // Search failed — user can still tap the map
    } finally {
      setGeocoding(false);
    }
  }, [searchText, handlePinChange]);

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pin) return;
    setConfirming(true);
    try {
      const result = geocodeResult ?? await reverseGeocode(pin.latitude, pin.longitude);
      onConfirm({
        lat:      pin.latitude,
        lng:      pin.longitude,
        address:  result.address,
        address1: result.address1,
        address2: result.address2,
        city:     result.city,
        state:    result.state,
      });
    } finally {
      setConfirming(false);
    }
  };

  // ── Initial region ────────────────────────────────────────────────────────
  const initialRegion = hasInitial
    ? { latitude: Number(initialLat), longitude: Number(initialLng), ...PIN_DELTA }
    : DEFAULT_REGION;

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

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <MaterialIcons name="arrow-back" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Set Location</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Search bar */}
          <View style={s.searchRow}>
            <View style={s.searchWrap}>
              <MaterialIcons name="search" size={18} color="#aaa" style={s.searchIcon} />
              <TextInput
                style={s.searchInput}
                placeholder="Search address or place…"
                placeholderTextColor="#bbb"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <MaterialIcons name="cancel" size={16} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[s.searchBtn, geocoding && s.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={geocoding}
            >
              {geocoding
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="search" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
            >
              {pin && (
                <Marker
                  coordinate={pin}
                  draggable
                  onDragEnd={handleDragEnd}
                  title="User location"
                />
              )}
            </MapView>

            {/* Tap hint — shown until first pin is placed */}
            {!pin && (
              <View style={s.tapHint} pointerEvents="none">
                <View style={s.tapHintBubble}>
                  <MaterialIcons name="touch-app" size={14} color="#555" />
                  <Text style={s.tapHintText}>Tap the map to place a pin</Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            {pin ? (
              <>
                <View style={s.addressRow}>
                  <MaterialIcons name="location-on" size={16} color="#2e5bff" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    {geocoding ? (
                      <View style={s.geocodingRow}>
                        <ActivityIndicator size="small" color="#2e5bff" />
                        <Text style={s.geocodingText}>Resolving address…</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={s.addressText} numberOfLines={2}>
                          {geocodeResult?.address || `${pin.latitude.toFixed(6)}, ${pin.longitude.toFixed(6)}`}
                        </Text>
                        {geocodeResult?.city ? (
                          <Text style={s.addressSub}>
                            {[geocodeResult.city, geocodeResult.state].filter(Boolean).join(", ")}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                </View>

                <View style={s.footerBtns}>
                  <TouchableOpacity style={s.clearBtn} onPress={onClear}>
                    <MaterialIcons name="delete-outline" size={16} color="#c00" />
                    <Text style={s.clearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.confirmBtn, (geocoding || confirming) && s.confirmBtnDisabled]}
                    onPress={handleConfirm}
                    disabled={geocoding || confirming}
                  >
                    {confirming
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.confirmText}>Confirm Location</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={s.noSelectionText}>
                No location selected — tap the map or search above.
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
  container:          { flex: 1, backgroundColor: "#fff" },

  // Header
  header:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fff" },
  closeBtn:           { padding: 6, borderRadius: 20 },
  headerTitle:        { fontSize: 16, fontWeight: "700", color: "#111" },

  // Search
  searchRow:          { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  searchWrap:         { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#f8f9ff", height: 40 },
  searchIcon:         { marginRight: 6 },
  searchInput:        { flex: 1, fontSize: 13, color: "#111", padding: 0 },
  searchBtn:          { width: 40, height: 40, borderRadius: 10, backgroundColor: "#2e5bff", alignItems: "center", justifyContent: "center" },
  searchBtnDisabled:  { backgroundColor: "#b0bef7" },

  // Tap hint overlay
  tapHint:            { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "flex-end", paddingBottom: 24 },
  tapHintBubble:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  tapHintText:        { fontSize: 13, color: "#555", fontWeight: "500" },

  // Footer
  footer:             { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", padding: 14, paddingBottom: Platform.OS === "ios" ? 28 : 14 },
  addressRow:         { flexDirection: "row", gap: 8, marginBottom: 12 },
  geocodingRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  geocodingText:      { fontSize: 13, color: "#888" },
  addressText:        { fontSize: 13, fontWeight: "600", color: "#111", lineHeight: 18 },
  addressSub:         { fontSize: 12, color: "#888", marginTop: 2 },
  footerBtns:         { flexDirection: "row", gap: 10 },
  clearBtn:           { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#ffd5d5", backgroundColor: "#fff5f5", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  clearText:          { color: "#c00", fontWeight: "600", fontSize: 13 },
  confirmBtn:         { flex: 1, backgroundColor: "#2e5bff", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
  confirmBtnDisabled: { backgroundColor: "#b0bef7" },
  confirmText:        { color: "#fff", fontWeight: "700", fontSize: 14 },
  noSelectionText:    { textAlign: "center", color: "#aaa", fontSize: 13, paddingVertical: 8 },
});