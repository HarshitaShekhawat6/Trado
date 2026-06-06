// modules/sell/screens/SellScreen.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";

import { getCategoriesService } from "../../home/services/home.service";
import { useSellForm } from "../hooks/useSellForm";
import {
  getCurrentLocationAddress,
  getPlaceDetails,
  searchPlaces,
} from "../../../utils/locationUtils";

import ImageUploader from "../components/ImageUploader";
import CategoryDropdown from "../components/CategoryDropdown";
import ConditionSelector from "../components/ConditionSelector";
import sellStyles from "../styles/sell.styles";

import StateDropdown from "../../../components/StateDropdown";

const SellScreen = ({ navigation }) => {
  const form = useSellForm(navigation);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesService,
  });

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 3) {
      setPlaceSuggestions([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearchingPlaces(true);
        setLocationError("");
        const results = await searchPlaces(query);
        setPlaceSuggestions(results);
      } catch (err) {
        setPlaceSuggestions([]);
        setLocationError(err.message || "Could not search locations.");
      } finally {
        setSearchingPlaces(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [locationQuery]);

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError("");
      const result = await getCurrentLocationAddress();
      form.setLocationData(result);
      setLocationQuery(
        result.address ||
          [result.address1, result.city, result.state].filter(Boolean).join(", ")
      );
      setPlaceSuggestions([]);
    } catch (err) {
      setLocationError(err.message || "Could not get your current location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePlaceSelect = async (place) => {
    try {
      setSearchingPlaces(true);
      setLocationError("");
      const details = await getPlaceDetails(place.place_id);
      form.setLocationData(details);
      setLocationQuery(place.description || details.address || "");
      setPlaceSuggestions([]);
    } catch (err) {
      setLocationError(err.message || "Could not use this location.");
    } finally {
      setSearchingPlaces(false);
    }
  };

  if (categoriesLoading) {
    return (
      <View style={sellStyles.center}>
        <ActivityIndicator size="large" color="#0040e0" />
      </View>
    );
  }

  const hasLocation = !!(
    form.address1 ||
    form.city ||
    form.state ||
    form.latitude
  );

  return (
    <SafeAreaView style={sellStyles.container} edges={["top"]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={sellStyles.header}>
        <TouchableOpacity
          style={sellStyles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#191b24" />
        </TouchableOpacity>
        <Text style={sellStyles.headerTitle}>Post Listing</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Scrollable Form ──────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={sellStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos */}
        <View style={sellStyles.section}>
          <Text style={sellStyles.sectionHeading}>Photos</Text>
          <ImageUploader images={form.images} setImages={form.setImages} />
        </View>

        {/* Listing Details */}
        <View style={sellStyles.section}>
          <Text style={sellStyles.sectionHeading}>Listing Details</Text>

          <Text style={sellStyles.fieldLabel}>TITLE</Text>
          <TextInput
            style={sellStyles.inputBox}
            placeholder="What are you selling?"
            placeholderTextColor="#aaa"
            value={form.title}
            onChangeText={form.setTitle}
            returnKeyType="next"
            maxLength={100}
          />

          <Text style={sellStyles.fieldLabel}>PRICE</Text>
          <View style={sellStyles.inputRow}>
            <Text style={sellStyles.inputPrefix}>₹</Text>
            <TextInput
              style={sellStyles.inputRowText}
              placeholder="0.00"
              placeholderTextColor="#aaa"
              value={form.price}
              onChangeText={form.setPrice}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <CategoryDropdown
            categories={categories}
            selected={form.category}
            onSelect={form.setCategory}
          />

          <Text style={[sellStyles.fieldLabel, { marginTop: 14 }]}>DESCRIPTION</Text>
          <TextInput
            style={sellStyles.inputMultiline}
            placeholder="Describe your item's key features..."
            placeholderTextColor="#aaa"
            value={form.description}
            onChangeText={form.setDescription}
            multiline
            maxLength={1000}
          />
        </View>

        {/* More Details */}
        <View style={sellStyles.section}>
          <Text style={sellStyles.sectionHeading}>More Details</Text>

          <ConditionSelector value={form.condition} onChange={form.setCondition} />

          {/* ── LOCATION ────────────────────────────────────────────────── */}
          <View style={loc.labelRow}>
            <Text style={sellStyles.fieldLabel}>LOCATION</Text>
            {hasLocation && (
              <TouchableOpacity onPress={form.clearLocation}>
                <Text style={loc.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              sellStyles.inputRow,
              loc.gpsRow,
              locationLoading && loc.gpsRowDisabled,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={locationLoading}
            activeOpacity={0.75}
          >
            {locationLoading ? (
              <ActivityIndicator
                size="small"
                color="#0040e0"
                style={{ marginRight: 6 }}
              />
            ) : (
              <MaterialIcons
                name="my-location"
                size={18}
                color="#0040e0"
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={loc.gpsText}>
              {locationLoading ? "Detecting location…" : "Use Current Location"}
            </Text>
            {form.latitude != null && (
              <MaterialIcons
                name="check-circle"
                size={16}
                color="#22c55e"
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>

          <Text style={sellStyles.fieldLabel}>SEARCH LOCATION</Text>
          <View style={sellStyles.inputRow}>
            <MaterialIcons
              name="search"
              size={18}
              color="#0040e0"
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={sellStyles.inputRowText}
              placeholder="Search area, landmark, city"
              placeholderTextColor="#aaa"
              value={locationQuery}
              onChangeText={setLocationQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchingPlaces && (
              <ActivityIndicator size="small" color="#0040e0" />
            )}
          </View>

          {placeSuggestions.length > 0 && (
            <View style={loc.suggestionsBox}>
              {placeSuggestions.map((place) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={loc.suggestionItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <MaterialIcons name="place" size={16} color="#6b7280" />
                  <Text style={loc.suggestionText} numberOfLines={2}>
                    {place.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!locationError && (
            <Text style={loc.errorText}>{locationError}</Text>
          )}

          <Text style={sellStyles.fieldLabel}>ADDRESS LINE 1</Text>
          <View style={sellStyles.inputRow}>
            <MaterialIcons
              name="location-on"
              size={18}
              color="#0040e0"
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={sellStyles.inputRowText}
              placeholder="Street, building, area"
              placeholderTextColor="#aaa"
              value={form.address1}
              onChangeText={(v) => form.setAddressField("address1", v)}
              onBlur={() =>
                form.geocodeManualAddress(
                  form.address1,
                  form.address2,
                  form.city,
                  form.state
                )
              }
              returnKeyType="next"
            />
          </View>

          <Text style={sellStyles.fieldLabel}>
            ADDRESS LINE 2{"  "}
            <Text style={loc.optional}>(optional)</Text>
          </Text>
          <View style={sellStyles.inputRow}>
            <MaterialIcons
              name="location-on"
              size={18}
              color="#aaa"
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={sellStyles.inputRowText}
              placeholder="Apartment, landmark, colony"
              placeholderTextColor="#aaa"
              value={form.address2}
              onChangeText={(v) => form.setAddressField("address2", v)}
              onBlur={() =>
                form.geocodeManualAddress(
                  form.address1,
                  form.address2,
                  form.city,
                  form.state
                )
              }
              returnKeyType="next"
            />
          </View>

          <View style={loc.rowTwo}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={sellStyles.fieldLabel}>CITY</Text>
              <View style={sellStyles.inputRow}>
                <TextInput
                  style={[sellStyles.inputRowText, { flex: 1 }]}
                  placeholder="City"
                  placeholderTextColor="#aaa"
                  value={form.city}
                  onChangeText={(v) => form.setAddressField("city", v)}
                  onBlur={() =>
                    form.geocodeManualAddress(
                      form.address1,
                      form.address2,
                      form.city,
                      form.state
                    )
                  }
                  returnKeyType="next"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
  <StateDropdown
    value={form.state}
    onChange={(v) => {
      form.setAddressField("state", v);
      form.geocodeManualAddress(form.address1, form.address2, form.city, v);
    }}
    editable={true}
  />
</View>
          </View>
          {/* ── END LOCATION ────────────────────────────────────────────── */}
        </View>

        {/* ── BIDDING SECTION ─────────────────────────────────────────────
             Placed just before Terms so seller sees it before submitting.
             biddingEnabled lives in useSellForm — zero extra local state.    */}
        <View style={bid.section}>
          <View style={bid.row}>
            <View style={bid.textGroup}>
              <View style={bid.labelRow}>
                <Ionicons name="hammer-outline" size={16} color="#0040e0" />
                <Text style={bid.title}>Enable Bidding</Text> 
                <Text style={bid.title}> ( बोली लगाओ ) </Text>
              </View>    
             

              <Text style={bid.subtitle}>
                Allow buyers to place bids on this listing. You can accept the
                best offer from your listings page.
              </Text>
            </View>

            {/* Native Switch — matches platform convention, no extra lib */}
            <Switch
              value={form.biddingEnabled}
              onValueChange={form.setBiddingEnabled}
              trackColor={{ false: "#e5e7eb", true: "#bfcfff" }}
              thumbColor={form.biddingEnabled ? "#0040e0" : "#9ca3af"}
              ios_backgroundColor="#e5e7eb"
            />
          </View>

          {/* Expanded hint shown only when bidding is ON */}
          {form.biddingEnabled && (
            <View style={bid.hint}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#0040e0"
              />
              <Text style={bid.hintText}>
                Bidding is ON. Buyers will see a "Place Bid" button on this
                listing. Your listing price acts as the starting reference.
              </Text>
            </View>
          )}
        </View>

        {/* Terms */}
        <View style={sellStyles.termsBox}>
          <Text style={sellStyles.termsText}>
            By posting, you agree to our{" "}
            <Text style={sellStyles.termsLink}>Merchant Policy</Text> and confirm
            this listing is accurate.
          </Text>
        </View>

        {/* ── Bottom Post Button ────────────────────────────────────────── */}
        <View style={sellStyles.bottomBar}>
          <TouchableOpacity
            style={[
              sellStyles.submitBtn,
              form.posting && sellStyles.submitBtnDisabled,
            ]}
            onPress={form.handleSubmit}
            disabled={form.posting}
            activeOpacity={0.85}
          >
            {form.posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={sellStyles.submitBtnText}>
                Post in {form.category?.name || "a Category"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellScreen;

// ─── Location-only local styles ───────────────────────────────────────────────
const loc = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clearText: { fontSize: 11, color: "#ef4444", fontWeight: "600" },
  gpsRow: {
    minHeight: 48,
    backgroundColor: "#eef4ff",
    borderColor: "#9bb7ff",
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#0040e0",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  gpsRowDisabled: { opacity: 0.7 },
  gpsText: { flex: 1, fontSize: 14, color: "#0040e0", fontWeight: "700" },
  optional: { fontWeight: "400", color: "#aaa", fontSize: 10 },
  rowTwo: { flexDirection: "row", alignItems: "flex-start" },
  suggestionsBox: {
    marginTop: -4,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  suggestionText: { flex: 1, color: "#374151", fontSize: 13, lineHeight: 18 },
  errorText: { color: "#ef4444", fontSize: 12, marginBottom: 8 },
});

// ─── Bidding-only local styles ────────────────────────────────────────────────
const bid = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#f8faff",
    borderWidth: 1,
    borderColor: "#dce6ff",
    borderRadius: 14,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textGroup: { flex: 1 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#eff4ff",
    borderRadius: 8,
    padding: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    lineHeight: 17,
  },
});
