// orders/components/EditListingModal.jsx

import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import C from "../constants/colors";
import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";
import Toast from "react-native-toast-message";
import { searchPlaces, getPlaceDetails } from "../../../utils/locationUtils";

const CONDITIONS = ["new", "used"];
const CONDITION_LABELS = {
  new:      "New",
  used: "Used",

};

// ── Validation ────────────────────────────────────────────────────────────────
const validate = ({ title, price }) => {
  const errors = {};
  if (!title.trim())                               errors.title = "Title is required";
  else if (title.trim().length < 3)               errors.title = "Min 3 characters";
  if (!price.trim() || isNaN(Number(price)))      errors.price = "Enter a valid price";
  else if (Number(price) <= 0)                    errors.price = "Price must be greater than 0";
  return errors;
};

// ── Component ─────────────────────────────────────────────────────────────────
const EditListingModal = ({ visible, item, onClose, onSaved }) => {
  const [title,       setTitle]       = useState("");
  const [price,       setPrice]       = useState("");
  const [description, setDescription] = useState("");
  const [condition,   setCondition]   = useState("");
  const [location,    setLocation]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});

  // Location search state
  const [locationQuery,    setLocationQuery]    = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [searchingPlaces,  setSearchingPlaces]  = useState(false);

  // ── Prefill when item changes ──────────────────────────────────────────────
useEffect(() => {
  if (item) {
    setTitle(item.title ?? "");
    setPrice(item.price != null ? String(Math.round(Number(item.price))) : "");
    setDescription(item.description ?? "");
    setCondition(item.condition ?? "");
    setLocation(item.location ?? "");
    setLocationQuery(item.location ?? "");  // ← wapas item.location karo
    setErrors({});
    setPlaceSuggestions([]);
  }
}, [item]);

  // ── Google Places autocomplete ─────────────────────────────────────────────
 useEffect(() => {
  const query = locationQuery.trim();
  
  // Agar query same hai jo already saved hai to suggestions mat dikhao
  if (query === (item?.location ?? "").trim()) {
    setPlaceSuggestions([]);
    return;
  }
  
  if (query.length < 3) { setPlaceSuggestions([]); return; }

  const timeout = setTimeout(async () => {
    try {
      setSearchingPlaces(true);
      const results = await searchPlaces(query);
      setPlaceSuggestions(results);
    } catch {
      setPlaceSuggestions([]);
    } finally {
      setSearchingPlaces(false);
    }
  }, 350);

  return () => clearTimeout(timeout);
}, [locationQuery]);

  const handlePlaceSelect = async (place) => {
  try {
    setSearchingPlaces(true);
    const fullAddress = place.description; // ← sirf description, koi trim/shorten nahi
    setLocation(fullAddress);
    setLocationQuery(fullAddress);
    setPlaceSuggestions([]);
  } catch { /* ignore */ }
  finally { setSearchingPlaces(false); }
};

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate({ title, price });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      setSaving(true);
      await apiClient.patch(`${ENDPOINTS.LISTINGS}/${item.id}`, {
        title:       title.trim(),
        price:       Number(price),
        description: description.trim(),
        condition:   condition || null,
        location:    location.trim() || null,
  address:     location.trim() || null, 
      });

      onSaved && onSaved({
        ...item,
        title, price: Number(price),
        description, condition, location,
      });
      onClose();

      Toast.show({
        type:           "success",
        text1:          "Listing Updated!",
        text2:          `"${title.trim()}" successfully saved.`,
        position:       "top",
        visibilityTime: 2500,
        topOffset:      60,
      });
    } catch (err) {
      Toast.show({
        type:           "error",
        text1:          "Update Failed",
        text2:          err?.response?.data?.message || "Something went wrong.",
        position:       "top",
        visibilityTime: 3000,
        topOffset:      60,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.kvWrapper}
        >
          <View style={s.sheet}>
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.header}>
              <Text style={s.headerTitle}>Edit Listing</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.body}
              keyboardShouldPersistTaps="handled"
            >

              {/* ── Title ── */}
              <Text style={s.label}>Title</Text>
              <TextInput
                style={[s.input, !!errors.title && s.inputError]}
                value={title}
                onChangeText={(v) => { setTitle(v); setErrors(e => ({ ...e, title: "" })); }}
                placeholder="Product title"
                placeholderTextColor={C.outline}
              />
              {!!errors.title && (
                <Text style={s.errorText}>{errors.title}</Text>
              )}

              {/* ── Price ── */}
              <Text style={s.label}>Price (₹)</Text>
              <TextInput
                style={[s.input, !!errors.price && s.inputError]}
                value={price}
                onChangeText={(v) => { const clean = v.replace(/[^0-9]/g, "");
                                  setPrice(clean);setErrors(e => ({ ...e, price: "" })); }}
                placeholder="0"
                placeholderTextColor={C.outline}
                keyboardType="numeric"
              />
              {!!errors.price && (
                <Text style={s.errorText}>{errors.price}</Text>
              )}

              {/* ── Description ── */}
              <Text style={s.label}>Description</Text>
              <TextInput
                style={[s.input, s.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product..."
                placeholderTextColor={C.outline}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* ── Location (Google Places) ── */}
              <Text style={s.label}>Location</Text>
              <View style={s.locationWrap}>
                <TextInput
                  style={[s.input, { paddingRight: 40 }]}
                  value={locationQuery}
                  onChangeText={(v) => {
                    setLocationQuery(v);
                    setLocation(v);
                  }}
                  placeholder="Search city, area, landmark..."
                  placeholderTextColor={C.outline}
                />
                {searchingPlaces && (
                  <ActivityIndicator
                    size="small"
                    color={C.primary}
                    style={s.locationSpinner}
                  />
                )}
              </View>

              {placeSuggestions.length > 0 && (
                <View style={s.suggestionsBox}>
                  {placeSuggestions.map((place) => (
                    <TouchableOpacity
                      key={place.place_id}
                      style={s.suggestionItem}
                      onPress={() => handlePlaceSelect(place)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="place" size={14} color={C.onSurfaceVariant} />
                      <Text style={s.suggestionText} numberOfLines={2}>
                        {place.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ── Condition ── */}
              <Text style={s.label}>Condition</Text>
              <View style={s.conditionRow}>
                {CONDITIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.condPill, condition === c && s.condPillActive]}
                    onPress={() => setCondition(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.condPillText, condition === c && s.condPillTextActive]}>
                      {CONDITION_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Save Button ── */}
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default EditListingModal;

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  kvWrapper: { justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.outline,
    alignSelf: "center", marginTop: 12, marginBottom: 4,
    opacity: 0.4,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: `${C.outline}20`,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: C.onSurface },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surfaceContainerLow,
    alignItems: "center", justifyContent: "center",
  },
  body: { padding: 20, gap: 6 },
  label: {
    fontSize: 12, fontWeight: "700", color: C.onSurfaceVariant,
    textTransform: "uppercase", letterSpacing: 0.8,
    marginTop: 12, marginBottom: 6,
  },

  // Input
  input: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: C.onSurface,
    borderWidth: 1, borderColor: `${C.outline}30`,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#ef4444", fontSize: 11,
    fontWeight: "600", marginTop: 4, marginLeft: 4,
  },
  multiline: { height: 100, paddingTop: 13 },

  // Location
  locationWrap: { position: "relative" },
  locationSpinner: {
    position: "absolute", right: 14, top: 14,
  },
  suggestionsBox: {
    marginTop: 4,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: `${C.outline}30`,
    borderRadius: 12, overflow: "hidden",
    marginBottom: 4,
  },
  suggestionItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: `${C.outline}15`,
  },
  suggestionText: {
    flex: 1, color: C.onSurface,
    fontSize: 13, lineHeight: 18,
  },

  // Condition pills
  conditionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  condPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: `${C.outline}40`,
    backgroundColor: C.surfaceContainerLow,
  },
  condPillActive: {
    borderColor: C.primary,
    backgroundColor: `${C.primary}12`,
  },
  condPillText:       { fontSize: 12, fontWeight: "600", color: C.onSurfaceVariant },
  condPillTextActive: { color: C.primary },

  // Save button
  saveBtn: {
    marginTop: 24, backgroundColor: C.primary,
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    elevation: 4, shadowColor: C.primary,
    shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});