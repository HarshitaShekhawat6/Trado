// src/features/search/screens/SearchResultsScreen.js

import React, { useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
  Modal, Platform, Keyboard, PanResponder, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Alert } from "react-native";

import useSearch, { SORT_OPTIONS, CONDITION_OPTIONS } from "../hooks/useSearch";
import ListingCard from "../../listings/components/Listingcard";
import { useAuth } from "../../../navigation/AuthContext";

const MIN_KM = 1;
const MAX_KM = 100;

// ─────────────────────────────────────────────────────────────────────────────
// RadiusSlider — uses onLayout + measure for pixel-perfect thumb alignment
// ─────────────────────────────────────────────────────────────────────────────
const THUMB_R = 9;

const RadiusSlider = ({ selected, onChange }) => {
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);
  const [, forceRender] = useState(0); // trigger re-render after layout

  const toRatio = (km) => (km - MIN_KM) / (MAX_KM - MIN_KM);
  const toKm = (ratio) =>
    Math.round(Math.max(MIN_KM, Math.min(MAX_KM, MIN_KM + ratio * (MAX_KM - MIN_KM))));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!trackWidth.current) return;
        const ratio = (evt.nativeEvent.pageX - trackPageX.current) / trackWidth.current;
        onChange(toKm(ratio));
      },
      onPanResponderMove: (evt) => {
        if (!trackWidth.current) return;
        const ratio = (evt.nativeEvent.pageX - trackPageX.current) / trackWidth.current;
        onChange(toKm(ratio));
      },
    })
  ).current;

  const ratio = toRatio(selected);

  // thumb center = ratio * trackWidth
  // thumb left edge = center - THUMB_R
  const thumbLeft = trackWidth.current > 0
    ? Math.max(-THUMB_R, Math.min(ratio * trackWidth.current - THUMB_R, trackWidth.current - THUMB_R))
    : 0;

  const fillWidth = trackWidth.current > 0
    ? `${ratio * 100}%`
    : "0%";

  return (
    <View style={sl.wrap}>
      <View style={sl.distanceRow}>
        <Text style={sl.distanceLabel}>Distance</Text>

        {/* trackWrap: measure real pixel position and width */}
        <View
          style={sl.trackWrap}
          onLayout={() => {}}
          ref={(ref) => {
            if (ref) {
              ref.measure((x, y, w, h, px) => {
                if (w !== trackWidth.current || px !== trackPageX.current) {
                  trackWidth.current = w;
                  trackPageX.current = px;
                  forceRender((n) => n + 1); // repaint with real values
                }
              });
            }
          }}
          {...panResponder.panHandlers}
        >
          {/* Track background */}
          <View style={sl.track}>
            {/* Filled portion */}
            <View style={[sl.fill, { width: fillWidth }]} />
          </View>

          {/* Thumb — perfectly centered on fill end */}
          <View
            style={[
              sl.thumb,
              { left: thumbLeft },
            ]}
          />
        </View>

        <Text style={sl.rangeValue}>{selected} KM</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SortChip
// ─────────────────────────────────────────────────────────────────────────────
const SortChip = ({ label, icon, active, onPress }) => (
  <TouchableOpacity
    style={[chip.wrap, active && chip.active]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialIcons name={icon} size={14} color={active ? "#fff" : "#555"} />
    <Text style={[chip.text, active && chip.textActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterTag
// ─────────────────────────────────────────────────────────────────────────────
const FilterTag = ({ label, onRemove }) => (
  <View style={tag.wrap}>
    <Text style={tag.text}>{label}</Text>
    <TouchableOpacity
      onPress={onRemove}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialIcons name="close" size={13} color="#0040e0" />
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterModal
// ─────────────────────────────────────────────────────────────────────────────
const FilterModal = ({ visible, filters, onChange, onReset, onClose, activeCount }) => {
  const DATE_OPTIONS = [
    { key: "",      label: "Any Time"   },
    { key: "today", label: "Today"      },
    { key: "week",  label: "This Week"  },
    { key: "month", label: "This Month" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={fm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={fm.sheet}>
        <View style={fm.handle} />

        <View style={fm.header}>
          <Text style={fm.title}>Filters</Text>
          <View style={fm.headerRight}>
            {activeCount > 0 && (
              <TouchableOpacity onPress={onReset} style={fm.resetBtn}>
                <Text style={fm.resetText}>Reset All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
              <MaterialIcons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Price */}
          <View style={fm.section}>
            <Text style={fm.label}>Price Range (₹)</Text>
            <View style={fm.priceRow}>
              <TextInput
                style={fm.priceInput}
                placeholder="Min"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={filters.priceMin}
                onChangeText={(v) => onChange("priceMin", v)}
              />
              <View style={fm.dash} />
              <TextInput
                style={fm.priceInput}
                placeholder="Max"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={filters.priceMax}
                onChangeText={(v) => onChange("priceMax", v)}
              />
            </View>
          </View>

          {/* City */}
          <View style={fm.section}>
            <Text style={fm.label}>City</Text>
            <View style={fm.cityWrap}>
              <MaterialIcons name="location-on" size={16} color="#aaa" />
              <TextInput
                style={fm.cityInput}
                placeholder="e.g. Jaipur, Mumbai"
                placeholderTextColor="#bbb"
                value={filters.city}
                onChangeText={(v) => onChange("city", v)}
              />
              {!!filters.city && (
                <TouchableOpacity onPress={() => onChange("city", "")}>
                  <MaterialIcons name="cancel" size={16} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Condition */}
          <View style={fm.section}>
            <Text style={fm.label}>Condition</Text>
            <View style={fm.chipRow}>
              {CONDITION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[fm.optChip, filters.condition === opt.key && fm.optChipOn]}
                  onPress={() => onChange("condition", opt.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      fm.optChipText,
                      filters.condition === opt.key && fm.optChipTextOn,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={fm.section}>
            <Text style={fm.label}>Date Posted</Text>
            <View style={fm.chipRow}>
              {DATE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[fm.optChip, filters.dateRange === opt.key && fm.optChipOn]}
                  onPress={() => onChange("dateRange", opt.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      fm.optChipText,
                      filters.dateRange === opt.key && fm.optChipTextOn,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={fm.applyBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={fm.applyText}>
            Apply{activeCount > 0 ? ` (${activeCount} filters)` : " Filters"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const SearchResultsScreen = ({ navigation, route }) => {
  const inputRef = useRef(null);
  const { user, userLocation: savedLocation } = useAuth();

  const userLocation =
    savedLocation?.latitude && savedLocation?.longitude
      ? { latitude: savedLocation.latitude, longitude: savedLocation.longitude }
      : null;

  const {
    inputQuery, setInputQuery,
    activeQuery, handleSearch,
    results, loading, error, totalCount,
    filters, handleFilterChange, handleSortChange, resetFilters, activeFilterCount,
    showFilters, setShowFilters,
    suggestions, showSuggestions, setShowSuggestions,
    history, removeHistoryItem, clearAllHistory, handleSuggestionPress,
    isNearestMode, selectedRadius, handleRadiusChange,
    nearestResults, nearestLoading, nearestError, nearestCount,
    RADIUS_OPTIONS,
  } = useSearch(
    route.params?.query || "",
    userLocation,
    () => navigation.navigate("Main", { screen: "Profile" }),
  );

  const dropdownItems   = inputQuery.trim() ? suggestions : history;
  const showDropdown    = showSuggestions && dropdownItems.length > 0;
  const isShowingRecent = !inputQuery.trim();

  const filterTags = [
    filters.city      && { key: "city",      label: `📍 ${filters.city}`,        onRemove: () => handleFilterChange("city", "")      },
    filters.condition && { key: "condition", label: `✅ ${filters.condition}`,    onRemove: () => handleFilterChange("condition", "")  },
    filters.priceMin  && { key: "priceMin",  label: `₹ Min ${filters.priceMin}`, onRemove: () => handleFilterChange("priceMin", "")   },
    filters.priceMax  && { key: "priceMax",  label: `₹ Max ${filters.priceMax}`, onRemove: () => handleFilterChange("priceMax", "")   },
    filters.dateRange && { key: "dateRange", label: `🗓 ${filters.dateRange}`,    onRemove: () => handleFilterChange("dateRange", "")  },
  ].filter(Boolean);

  const activeResults = isNearestMode ? nearestResults : results;
  const activeCount   = isNearestMode ? nearestCount   : totalCount;
  const activeLoading = isNearestMode ? nearestLoading : loading;
  const activeError   = isNearestMode ? nearestError   : error;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#191b24" />
        </TouchableOpacity>

        <View style={s.searchBox}>
          <MaterialIcons name="search" size={18} color="#727785" />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            value={inputQuery}
            onChangeText={setInputQuery}
            onSubmitEditing={() => handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            returnKeyType="search"
            placeholder="Search products, vehicles..."
            placeholderTextColor="#aaa"
            autoFocus={!route.params?.query}
          />
          {inputQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => { setInputQuery(""); inputRef.current?.focus(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
          onPress={() => { Keyboard.dismiss(); setShowFilters(true); }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="tune"
            size={20}
            color={activeFilterCount > 0 ? "#fff" : "#191b24"}
          />
          {activeFilterCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Suggestions / History Dropdown ── */}
      {showDropdown && (
        <View style={s.dropdown}>
          <View style={s.dropdownHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons
                name={isShowingRecent ? "history" : "search"}
                size={14}
                color="#aaa"
              />
              <Text style={s.dropdownHeaderText}>
                {isShowingRecent ? "Recent Searches" : "Suggestions"}
              </Text>
            </View>
            {isShowingRecent && history.length > 0 && (
              <TouchableOpacity onPress={clearAllHistory}>
                <Text style={s.clearAll}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {dropdownItems.map((item, i) => (
            <TouchableOpacity
              key={item.id || i}
              style={s.dropdownItem}
              onPress={() => handleSuggestionPress(item)}
              activeOpacity={0.6}
            >
              <MaterialIcons
                name={isShowingRecent ? "history" : "search"}
                size={16}
                color="#ccc"
              />
              <Text style={s.dropdownItemText} numberOfLines={1}>
                {item.query}
              </Text>
              {isShowingRecent && (
                <TouchableOpacity
                  onPress={() => removeHistoryItem(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={14} color="#ddd" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Sort Bar ── */}
      {!!activeQuery && (
        <View style={s.sortBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: "center" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <SortChip
                key={opt.key}
                label={opt.label}
                icon={opt.icon}
                active={
                  opt.key === "nearest"
                    ? isNearestMode
                    : !isNearestMode && filters.sortBy === opt.key
                }
                onPress={() => handleSortChange(opt.key)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Radius Slider — only when "Nearest" sort is active ── */}
      {isNearestMode && (
        <RadiusSlider selected={selectedRadius} onChange={handleRadiusChange} />
      )}

      {/* ── Active Filter Tags ── */}
      {filterTags.length > 0 && (
        <View style={s.tagRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
          >
            {filterTags.map((t) => (
              <FilterTag key={t.key} label={t.label} onRemove={t.onRemove} />
            ))}
            <TouchableOpacity onPress={resetFilters} style={tag.resetWrap}>
              <Text style={tag.resetText}>Reset</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Results ── */}
      {activeLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0040e0" />
          <Text style={s.hint}>Searching...</Text>
        </View>
      ) : activeError ? (
        <View style={s.center}>
          <MaterialIcons name="wifi-off" size={44} color="#ddd" />
          <Text style={s.emptyText}>{activeError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => handleSearch()}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeResults}
          numColumns={2}
          keyExtractor={(item, i) => item?.id?.toString() || i.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowSuggestions(false)}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              variant="default"
              onPress={() => navigation.navigate("ProductDetail", { product: item })}
            />
          )}
          ListHeaderComponent={
            activeQuery ? (
              <Text style={s.resultCount}>
                {activeCount} result{activeCount !== 1 ? "s" : ""} for{" "}
                <Text style={s.resultBold}>"{activeQuery}"</Text>
              </Text>
            ) : null
          }
          ListEmptyComponent={
            activeQuery ? (
              <View style={s.center}>
                <MaterialIcons name="search-off" size={52} color="#e0e0e0" />
                <Text style={s.emptyText}>
                  {isNearestMode
                    ? "No products found in this range."
                    : "No results found"}
                </Text>
                <Text style={s.hint}>Try different keywords or remove filters</Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity style={s.retryBtn} onPress={resetFilters}>
                    <Text style={s.retryText}>Remove Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={s.emptyState}>
                <MaterialIcons name="search" size={56} color="#e8e8f0" />
                <Text style={s.emptyText}>Search for anything</Text>
                <Text style={s.hint}>Products, vehicles, property and more</Text>
              </View>
            )
          }
        />
      )}

      {/* ── Filter Modal ── */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
        onClose={() => setShowFilters(false)}
        activeCount={activeFilterCount}
      />
    </SafeAreaView>
  );
};

export default SearchResultsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheets
// ─────────────────────────────────────────────────────────────────────────────

const sl = StyleSheet.create({
  wrap: {
    backgroundColor: "#eef3ff",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d6e2ff",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#002b8f",
    marginRight: 12,
  },
  trackWrap: {
    flex: 1,
    height: THUMB_R * 2,          // exact thumb height so nothing clips
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#bfd0ff",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#003cb3",
    borderRadius: 999,
  },
  thumb: {
    position: "absolute",
    // center vertically: (trackWrap height - thumb height) / 2 = 0
    top: 0,
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    backgroundColor: "#003cb3",
    borderWidth: 3,
    borderColor: "#fff",
    zIndex: 99,
    elevation: 5,
    shadowColor: "#003cb3",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rangeValue: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#002b8f",
    minWidth: 58,
    textAlign: "right",
  },
});

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f8f9fb" },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, marginTop: 60 },
  emptyState: { alignItems: "center", marginTop: 80, gap: 8 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5, borderBottomColor: "#e4e4f0", gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f2ff", alignItems: "center", justifyContent: "center",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f3f2ff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  searchInput:    { flex: 1, fontSize: 15, color: "#191b24", padding: 0 },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#f3f2ff", alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  filterBtnActive: { backgroundColor: "#0040e0" },
  badge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#ff4757", borderRadius: 8,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  dropdown: {
    position: "absolute", top: 60, left: 0, right: 0,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    elevation: 12, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16,
    zIndex: 999, maxHeight: 320,
  },
  dropdownHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
  },
  dropdownHeaderText: {
    fontSize: 11, color: "#aaa", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  clearAll:     { fontSize: 12, color: "#0040e0", fontWeight: "700" },
  dropdownItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    borderTopWidth: 0.5, borderTopColor: "#f5f5f5",
  },
  dropdownItemText: { flex: 1, fontSize: 14, color: "#191b24" },
  sortBar:  { backgroundColor: "#fff", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f8" },
  tagRow:   { paddingVertical: 8, backgroundColor: "#fff" },
  list:     { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 30 },
  resultCount: { fontSize: 13, color: "#747688", marginBottom: 12, marginLeft: 6 },
  resultBold:  { color: "#191b24", fontWeight: "700" },
  emptyText:   { fontSize: 16, color: "#aaa", fontWeight: "600", textAlign: "center" },
  hint:        { fontSize: 13, color: "#bbb", textAlign: "center", marginTop: 4 },
  retryBtn:    { marginTop: 12, backgroundColor: "#0040e0", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText:   { color: "#fff", fontWeight: "600", fontSize: 14 },
});

const chip = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#f3f2ff", borderWidth: 1, borderColor: "#ebebf5",
  },
  active:     { backgroundColor: "#0040e0", borderColor: "#0040e0" },
  text:       { fontSize: 12, fontWeight: "600", color: "#555" },
  textActive: { color: "#fff" },
});

const tag = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#eef3ff", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1, borderColor: "#d0dfff",
  },
  text:      { fontSize: 12, color: "#0040e0", fontWeight: "600" },
  resetWrap: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, borderColor: "#ffcdd2", backgroundColor: "#fff5f5",
  },
  resetText: { fontSize: 12, color: "#e53935", fontWeight: "600" },
});

const fm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: "88%",
    position: "absolute", bottom: 0, left: 0, right: 0, elevation: 24,
  },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0e0e0", alignSelf: "center", marginBottom: 16 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  title:       { fontSize: 18, fontWeight: "800", color: "#191b24" },
  resetBtn:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "#fff0f0" },
  resetText:   { fontSize: 12, color: "#e53935", fontWeight: "700" },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f4f4f8", alignItems: "center", justifyContent: "center" },
  section:     { marginBottom: 24 },
  label:       { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  priceRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  priceInput:  {
    flex: 1, backgroundColor: "#f8f9fb", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#191b24",
    borderWidth: 1, borderColor: "#ebebf5",
  },
  dash:        { width: 16, height: 2, backgroundColor: "#ddd", borderRadius: 1 },
  cityWrap:    {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f8f9fb",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: "#ebebf5", gap: 8,
  },
  cityInput:    { flex: 1, fontSize: 14, color: "#191b24", padding: 0 },
  chipRow:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f2ff", borderWidth: 1, borderColor: "#ebebf5" },
  optChipOn:    { backgroundColor: "#0040e0", borderColor: "#0040e0" },
  optChipText:  { fontSize: 13, color: "#555", fontWeight: "500" },
  optChipTextOn:{ color: "#fff", fontWeight: "700" },
  applyBtn:     {
    backgroundColor: "#0040e0", borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 8,
    marginBottom: Platform.OS === "ios" ? 24 : 16,
  },
  applyText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});