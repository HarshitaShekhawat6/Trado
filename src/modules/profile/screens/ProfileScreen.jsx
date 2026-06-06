// src/features/profile/screens/ProfileScreen.js

import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, StyleSheet, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView }  from "react-native-safe-area-context";
import MaterialIcons     from "react-native-vector-icons/MaterialIcons";
import useProfile        from "../hooks/useProfile";
import ProfileSkeleton   from "../components/ProfileSkeleton";
import { getPlaceDetails, searchPlaces } from "../../../utils/locationUtils";
import StateDropdown from "../../../components/StateDropdown";


const Field = ({
  label, value, onChangeText, editable,
  keyboardType, placeholder, multiline,
}) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={[
        s.input,
        !editable && s.inputDisabled,
        multiline && s.inputMultiline,
      ]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType || "default"}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      multiline={multiline}
    />
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const {
    user, form, loading, saving, error,
    isEditing, setIsEditing,
    avatarUri,
    locationLoading,
    fetchCurrentLocation,
    setLocationData,
    handleChange, handleSave, handleCancelEdit,
    handleImagePick,
    showLogoutModal, setShowLogoutModal, confirmLogout,
    showDeleteModal, setShowDeleteModal, confirmDelete,
    retryFetch,
    showUrlModal,
    urlInput,        handleUrlChange,
    urlError,
    urlPreviewOk,    setUrlPreviewOk,
    urlLoading,      setUrlLoading,
    isUrlButtonEnabled,
    handleUrlConfirm,
    handleUrlClose,
  } = useProfile(navigation);

  const [locationQuery, setLocationQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setPlaceSuggestions([]);
      return undefined;
    }

    const query = locationQuery.trim();
    if (query.length < 3) {
      setPlaceSuggestions([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearchingPlaces(true);
        setLocationSearchError("");
        const results = await searchPlaces(query);
        setPlaceSuggestions(results);
      } catch (err) {
        setPlaceSuggestions([]);
        setLocationSearchError(err.message || "Could not search locations.");
      } finally {
        setSearchingPlaces(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [isEditing, locationQuery]);

  const handlePlaceSelect = async (place) => {
    try {
      setSearchingPlaces(true);
      setLocationSearchError("");
      // Location logic: selected Google place -> details API -> address fields
      // plus hidden latitude/longitude in the profile form.
      const details = await getPlaceDetails(place.place_id);
      setLocationData(details);
      setLocationQuery(place.description || details.address || "");
      setPlaceSuggestions([]);
    } catch (err) {
      setLocationSearchError(err.message || "Could not use this location.");
    } finally {
      setSearchingPlaces(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error && !user) {
    return (
      <View style={s.center}>
        <MaterialIcons name="wifi-off" size={48} color="#ccc" />
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retryFetch}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
          {isEditing ? (
            <View style={s.headerBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={handleCancelEdit}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => setIsEditing(true)}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline error banner — shown for both save & load errors */}
        {!!error && !!user && (
          <View style={s.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#c00" />
            <Text style={s.errorBannerText}>{error}</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={s.avatarSection}>
            <TouchableOpacity
              onPress={handleImagePick}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <View style={s.avatarWrap}>
                <Image source={{ uri: avatarUri }} style={s.avatar} />
                {isEditing && (
                  <View style={s.cameraOverlay}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity onPress={handleImagePick}>
                <Text style={s.changePhoto}>Change Profile Photo</Text>
              </TouchableOpacity>
            )}
            {/*
              ── FIX: name now comes from `user` which is optimistically updated
                 the moment Save is tapped — no page refresh needed.
            */}
            <Text style={s.userName}>{user?.name || "No name set"}</Text>
            <Text style={s.userPhone}>{user?.phone}</Text>
            {user?.modified_at && (
              <Text style={s.lastUpdated}>
                Last updated:{" "}
                {new Date(user.modified_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </Text>
            )}
          </View>

          {/* Personal Info */}
          <Text style={s.sectionTitle}>Personal Information</Text>
          <Field
            label="Full Name"
            value={form.name}
            onChangeText={(v) => handleChange("name", v)}
            editable={isEditing}
            placeholder="Enter your full name"
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(v) => handleChange("email", v)}
            editable={isEditing}
            placeholder="Enter email"
            keyboardType="email-address"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={(v) => handleChange("phone", v)}
            editable={isEditing}
            placeholder="Enter phone"
            keyboardType="phone-pad"
          />

          {/* Address */}
          <Text style={s.sectionTitle}>Address</Text>

          {/* Use Current Location button — only visible in edit mode */}
          {isEditing && (
            <TouchableOpacity
              style={s.locationBtn}
              onPress={fetchCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <ActivityIndicator size="small" color="#2e5bff" />
                  <Text style={s.locationBtnText}>Getting location…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="my-location" size={16} color="#2e5bff" />
                  <Text style={s.locationBtnText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Location search: Google Places Autocomplete suggestions */}
          {isEditing && (
            <>
              <View style={s.locationSearchWrap}>
                <MaterialIcons name="search" size={18} color="#2e5bff" />
                <TextInput
                  style={s.locationSearchInput}
                  placeholder="Search area, landmark, city"
                  placeholderTextColor="#aaa"
                  value={locationQuery}
                  onChangeText={setLocationQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchingPlaces && <ActivityIndicator size="small" color="#2e5bff" />}
              </View>

              {placeSuggestions.length > 0 && (
                <View style={s.suggestionsBox}>
                  {placeSuggestions.map((place) => (
                    <TouchableOpacity
                      key={place.place_id}
                      style={s.suggestionItem}
                      onPress={() => handlePlaceSelect(place)}
                    >
                      <MaterialIcons name="place" size={16} color="#777" />
                      <Text style={s.suggestionText} numberOfLines={2}>
                        {place.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!!locationSearchError && (
                <Text style={s.locationSearchError}>{locationSearchError}</Text>
              )}
            </>
          )}

          <Field
            label="Address Line 1"
            value={form.address1}
            onChangeText={(v) => handleChange("address1", v)}
            editable={isEditing}
            placeholder="House / Flat / Building"
          />
          <Field
            label="Address Line 2"
            value={form.address2}
            onChangeText={(v) => handleChange("address2", v)}
            editable={isEditing}
            placeholder="Street / Area / Landmark"
          />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="City"
                value={form.city}
                onChangeText={(v) => handleChange("city", v)}
                editable={isEditing}
                placeholder="City"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
  <StateDropdown
    value={form.state}
    onChange={(v) => handleChange("state", v)}
    editable={isEditing}
  />
</View>
          </View>

          {/* Latitude / Longitude — shown always, editable only in edit mode */}
          {/* <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Latitude"
                value={form.latitude}
                onChangeText={(v) => handleChange("latitude", v)}
                editable={isEditing}
                placeholder="e.g. 26.9124"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field
                label="Longitude"
                value={form.longitude}
                onChangeText={(v) => handleChange("longitude", v)}
                editable={isEditing}
                placeholder="e.g. 75.7873"
                keyboardType="decimal-pad"
              />
            </View>
          </View> */}

          {/* Hint shown only in edit mode so user knows GPS fills these */}
          {isEditing && (
            <View style={s.locationHint}>
              <MaterialIcons name="info-outline" size={13} color="#aaa" />
              <Text style={s.locationHintText}>
                Use GPS or search to save map coordinates silently, or type your address manually.
              </Text>
            </View>
          )}

          {/* Account */}
          <Text style={s.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => navigation.navigate("Orders")}
          >
            <MaterialIcons name="list-alt" size={22} color="#2e5bff" />
            <Text style={s.menuText}>My Listings</Text>
            <MaterialIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => navigation.navigate("Wishlist")}
          >
            <MaterialIcons name="favorite" size={22} color="#ff432e" />
            <Text style={s.menuText}>My Wishlist</Text>
            <MaterialIcons name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialIcons name="logout" size={20} color="#2e5bff" />
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={s.dangerBox}>
            <MaterialIcons name="warning" size={36} color="#c00" />
            <Text style={s.dangerTitle}>Danger Zone</Text>
            <Text style={s.dangerText}>
              Deleting your account will permanently remove all your data.
            </Text>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => setShowDeleteModal(true)}
            >
              <Text style={s.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={m.overlay}>
          <View style={m.box}>
            <Text style={m.title}>Logout</Text>
            <Text style={m.message}>Are you sure you want to logout?</Text>
            <View style={m.btnRow}>
              <TouchableOpacity
                style={m.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.confirmBtn, { backgroundColor: "#2e5bff" }]}
                onPress={confirmLogout}
              >
                <Text style={m.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <View style={m.overlay}>
          <View style={m.box}>
            <Text style={m.title}>Delete Account</Text>
            <Text style={m.message}>
              This will permanently delete your account and all your data. This
              cannot be undone.
            </Text>
            <View style={m.btnRow}>
              <TouchableOpacity
                style={m.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.confirmBtn, { backgroundColor: "#c00" }]}
                onPress={confirmDelete}
              >
                <Text style={m.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* URL Image Modal */}
      <Modal
        visible={showUrlModal}
        transparent
        animationType="fade"
        onRequestClose={handleUrlClose}
      >
        <KeyboardAvoidingView
          style={u.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleUrlClose}
          />

          <View style={u.card}>
            {/* Header */}
            <View style={u.header}>
              <Text style={u.title}>Paste Image URL</Text>
              <TouchableOpacity onPress={handleUrlClose}>
                <MaterialIcons name="close" size={22} color="#747688" />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={[u.inputWrap, urlError ? u.inputError : null]}>
              <MaterialIcons
                name="insert-link"
                size={18}
                color="#aaa"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={u.input}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor="#bbb"
                value={urlInput}
                onChangeText={handleUrlChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
              />
              {urlInput.length > 0 && (
                <TouchableOpacity onPress={() => handleUrlChange("")}>
                  <MaterialIcons name="cancel" size={16} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>

            {!!urlError && <Text style={u.errorText}>{urlError}</Text>}

            {/* Preview */}
            {urlInput.trim().length > 5 && (
              <View style={u.previewWrap}>
                {urlLoading && !urlPreviewOk && (
                  <View style={u.previewPlaceholder}>
                    <ActivityIndicator color="#0040e0" />
                    <Text style={u.previewHint}>Loading preview…</Text>
                  </View>
                )}
                <Image
                  source={{ uri: urlInput.trim() }}
                  style={[u.preview, !urlPreviewOk && { height: 0 }]}
                  resizeMode="cover"
                  onLoadStart={() => setUrlLoading(true)}
                  onLoad={() => { setUrlPreviewOk(true); setUrlLoading(false); }}
                  onError={() => { setUrlLoading(false); }}
                />
                {urlPreviewOk && (
                  <View style={u.previewTick}>
                    <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                    <Text style={u.previewTickText}>Preview loaded</Text>
                  </View>
                )}
                {!urlPreviewOk && !urlLoading && urlInput.trim().length > 5 && (
                  <View style={u.previewNoLoad}>
                    <MaterialIcons name="info-outline" size={14} color="#aaa" />
                    <Text style={u.previewNoLoadText}>
                      Preview unavailable — URL will still be used
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Buttons */}
            <View style={u.btnRow}>
              <TouchableOpacity style={u.cancelBtn} onPress={handleUrlClose}>
                <Text style={u.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[u.addBtn, !isUrlButtonEnabled && u.addBtnOff]}
                onPress={handleUrlConfirm}
                disabled={!isUrlButtonEnabled}
              >
                <Text style={u.addText}>Use This Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f8f9ff" },
  center:           { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText:        { color: "#888", marginTop: 12, fontSize: 14, textAlign: "center" },
  retryBtn:         { marginTop: 16, backgroundColor: "#2e5bff", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText:        { color: "#fff", fontWeight: "600" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff0f0", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ffd5d5" },
  errorBannerText:  { color: "#c00", fontSize: 13, flex: 1 },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  headerTitle:      { fontSize: 20, fontWeight: "800", color: "#111" },
  headerBtns:       { flexDirection: "row", gap: 8 },
  cancelBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#ddd" },
  cancelText:       { color: "#555", fontWeight: "500" },
  editBtn:          { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2e5bff", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  editBtnText:      { color: "#fff", fontWeight: "600" },
  saveBtn:          { flexDirection: "row", alignItems: "center", backgroundColor: "#2e5bff", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, minWidth: 60, justifyContent: "center" },
  saveBtnDisabled:  { opacity: 0.6 },
  saveBtnText:      { color: "#fff", fontWeight: "600" },
  content:          { padding: 16, paddingBottom: 40 },
  avatarSection:    { alignItems: "center", marginBottom: 28, marginTop: 8 },
  avatarWrap:       { position: "relative", marginBottom: 8 },
  avatar:           { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e0e0e0" },
  cameraOverlay:    { position: "absolute", bottom: 0, right: 0, backgroundColor: "#2e5bff", padding: 7, borderRadius: 20, borderWidth: 2, borderColor: "#fff" },
  changePhoto:      { color: "#2e5bff", fontWeight: "600", marginBottom: 6 },
  userName:         { fontSize: 20, fontWeight: "700", color: "#111" },
  userPhone:        { fontSize: 14, color: "#777", marginTop: 2 },
  lastUpdated:      { fontSize: 11, color: "#bbb", marginTop: 4 },
  sectionTitle:     { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  inputGroup:       { marginBottom: 14 },
  label:            { fontSize: 13, color: "#555", fontWeight: "500", marginBottom: 5 },
  input:            { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e8e8e8", color: "#111", fontSize: 14 },
  inputDisabled:    { backgroundColor: "#f5f5f5", color: "#999", borderColor: "#f0f0f0" },
  inputMultiline:   { height: 80, textAlignVertical: "top" },
  row:              { flexDirection: "row" },
  // Location button
  locationBtn:      { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#2e5bff", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14, backgroundColor: "#f0f3ff", alignSelf: "flex-start" },
  locationBtnText:  { color: "#2e5bff", fontWeight: "600", fontSize: 13 },
  locationSearchWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e8e8e8", marginBottom: 8 },
  locationSearchInput: { flex: 1, color: "#111", fontSize: 14, padding: 0 },
  suggestionsBox:   { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  suggestionItem:   { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  suggestionText:   { flex: 1, color: "#374151", fontSize: 13, lineHeight: 18 },
  locationSearchError: { color: "#c00", fontSize: 12, marginBottom: 10 },
  locationHint:     { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 14, marginTop: -6 },
  locationHintText: { fontSize: 11, color: "#aaa", flex: 1, lineHeight: 16 },
  // Account section
  menuItem:         { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f0f0f0" },
  menuText:         { flex: 1, fontSize: 15, color: "#111", fontWeight: "500" },
  logoutBtn:        { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#eef1ff", padding: 14, borderRadius: 10, marginTop: 8, marginBottom: 8, justifyContent: "center" },
  logoutText:       { fontSize: 15, fontWeight: "600", color: "#2e5bff" },
  dangerBox:        { marginTop: 8, padding: 20, backgroundColor: "#fff5f5", borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#ffd5d5", marginBottom: 20 },
  dangerTitle:      { fontWeight: "700", fontSize: 16, color: "#c00", marginTop: 6 },
  dangerText:       { textAlign: "center", marginVertical: 8, color: "#777", lineHeight: 20, fontSize: 13 },
  deleteBtn:        { marginTop: 8, borderWidth: 1.5, borderColor: "#c00", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 8 },
  deleteText:       { color: "#c00", fontWeight: "600" },
});

const m = StyleSheet.create({
  overlay:    { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24, zIndex: 9999, elevation: 9999 },
  box:        { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20 },
  title:      { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 10 },
  message:    { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 24 },
  btnRow:     { flexDirection: "row", gap: 12 },
  cancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  cancelText: { color: "#555", fontWeight: "600", fontSize: 15 },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  confirmText:{ color: "#fff", fontWeight: "700", fontSize: 15 },
});

const u = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  card:               { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  header:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:              { fontSize: 16, fontWeight: "800", color: "#191b24" },
  inputWrap:          { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e4e4f0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fafafa", marginBottom: 10 },
  inputError:         { borderColor: "#ff4d4f" },
  input:              { flex: 1, fontSize: 13, color: "#191b24", padding: 0 },
  errorText:          { color: "#ff4d4f", fontSize: 12, marginBottom: 10 },
  previewWrap:        { borderRadius: 12, overflow: "hidden", marginBottom: 16, backgroundColor: "#f3f2ff" },
  previewPlaceholder: { height: 80, alignItems: "center", justifyContent: "center", gap: 8 },
  previewHint:        { fontSize: 12, color: "#aaa" },
  preview:            { width: "100%", height: 140 },
  previewTick:        { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, backgroundColor: "#f0fdf4" },
  previewTickText:    { fontSize: 12, color: "#22c55e", fontWeight: "600" },
  previewNoLoad:      { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, backgroundColor: "#fafafa" },
  previewNoLoadText:  { fontSize: 11, color: "#aaa", flex: 1 },
  btnRow:             { flexDirection: "row", gap: 10 },
  cancelBtn:          { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f3f2ff", alignItems: "center" },
  cancelText:         { fontWeight: "700", color: "#444", fontSize: 14 },
  addBtn:             { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: "#0040e0", alignItems: "center" },
  addBtnOff:          { backgroundColor: "#b0bef7" },
  addText:            { fontWeight: "700", color: "#fff", fontSize: 14 },
});
