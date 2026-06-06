// src/features/listings/screens/NearbyProductsScreen.js

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, PanResponder, Animated,
  Platform, Dimensions,Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Entypo from "react-native-vector-icons/Entypo";
import apiClient     from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";
import { useAuth }   from "../../../navigation/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_KM         = 1;
const MAX_KM         = 100;
const THUMB_R        = 10;
const DEFAULT_RADIUS = 20;

const SCREEN_W = Dimensions.get("window").width;
const MAP_SIZE  = Math.min(SCREEN_W - 48, 320);

// ─── Colors ───────────────────────────────────────────────────────────────────
const CORAL  = "#E8735A";
const BLUE   = "#2563EB";
const BG     = "#FFF8F5";
const WHITE  = "#FFFFFF";
const TEXT1  = "#1A1A1A";
const TEXT2  = "#6B7280";
const BORDER = "#F0EBE8";

// ─────────────────────────────────────────────────────────────────────────────
// CircularMapWrapper
// ─────────────────────────────────────────────────────────────────────────────
const CircularMapWrapper = ({ size, children }) => {
  if (Platform.OS === "ios") {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
        {children}
      </View>
    );
  }
  return (
    <View
      renderToHardwareTextureAndroid={true}
      style={{
        width: size, height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "#e8f4f8",
      }}
    >
      {children}
    </View>
  );
};


// Direction open karne ka function
const openDirections = (item) => {
  const lat = item.latitude || item.seller_latitude;
  const lng = item.longitude || item.seller_longitude;
  if (!lat || !lng) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  Linking.openURL(url);
};


// ─────────────────────────────────────────────────────────────────────────────
// RadiusSlider
// ─────────────────────────────────────────────────────────────────────────────
const RadiusSlider = ({ value, onChange }) => {
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);
  const [, rerender] = useState(0);

  const toRatio = (km) => (km - MIN_KM) / (MAX_KM - MIN_KM);
  const toKm    = (ratio) =>
    Math.round(Math.max(MIN_KM, Math.min(MAX_KM, MIN_KM + ratio * (MAX_KM - MIN_KM))));

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      if (!trackWidth.current) return;
      onChange(toKm((e.nativeEvent.pageX - trackPageX.current) / trackWidth.current));
    },
    onPanResponderMove: (e) => {
      if (!trackWidth.current) return;
      onChange(toKm((e.nativeEvent.pageX - trackPageX.current) / trackWidth.current));
    },
  })).current;

  const ratio     = toRatio(value);
  const thumbLeft = trackWidth.current > 0
    ? Math.max(-THUMB_R, Math.min(ratio * trackWidth.current - THUMB_R, trackWidth.current - THUMB_R))
    : 0;

  return (
    <View style={sl.wrap}>
      <MaterialIcons name="near-me" size={16} color={CORAL} />
      <Text style={sl.label}>Radius</Text>
      <View
        style={sl.trackWrap}
        ref={(ref) => {
          if (ref) {
            ref.measure((x, y, w, h, px) => {
              if (w !== trackWidth.current || px !== trackPageX.current) {
                trackWidth.current = w;
                trackPageX.current = px;
                rerender((n) => n + 1);
              }
            });
          }
        }}
        {...pan.panHandlers}
      >
        <View style={sl.track}>
          <View style={[sl.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View style={[sl.thumb, { left: thumbLeft }]} />
      </View>
      <Text style={sl.value}>{value} km</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard — compact horizontal row
// [60x60 image]  Product Name
//                ₹Price
//                Seller Name
// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ item, onPress }) => {
  const image = Array.isArray(item.images) && item.images.length > 0
    ? item.images[0] : (item.image || null);

  return (
    <TouchableOpacity style={pc.card} onPress={() => onPress(item)} activeOpacity={0.82}>
      <View style={pc.imgBox}>
        {image
          ? <Image source={{ uri: image }} style={pc.img} resizeMode="cover" />
          : <View style={pc.imgFallback}>
              <MaterialIcons name="image" size={18} color="#ccc" />
            </View>}
        {item.distance_km != null && (
          <View style={pc.distPill}>
            <Text style={pc.distTxt}>{item.distance_km}km</Text>
          </View>
        )}
      </View>

      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={1}>{item.title || "Product"}</Text>
        <Text style={pc.address} numberOfLines={1}>
          {item.address || item.location || item.city || "Address not available"}
        </Text>
        <Text style={pc.seller} numberOfLines={1}>
          {item.seller?.name || item.seller_name || "Seller"}
        </Text>
      </View>

      <View style={pc.rightSection}>
        <Text style={pc.price}>₹{Number(item.price).toLocaleString("en-IN")}</Text>
      </View>

      {/* ✅ Direction button */}
      <TouchableOpacity
        style={pc.dirBtn}
        onPress={() => openDirections(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Entypo name="direction" size={20} color={BLUE} />
      </TouchableOpacity>

      <MaterialIcons name="chevron-right" size={18} color="#ddd" />
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NoLocationView
// ─────────────────────────────────────────────────────────────────────────────
const NoLocationView = ({ onGoToProfile }) => (
  <View style={nl.wrap}>
    <View style={nl.iconBox}>
      <MaterialIcons name="location-off" size={52} color={CORAL} />
    </View>
    <Text style={nl.title}>Location Not Set</Text>
    <Text style={nl.sub}>
      Set your location in your profile to discover products near you.
    </Text>
    <TouchableOpacity style={nl.btn} onPress={onGoToProfile} activeOpacity={0.85}>
      <MaterialIcons name="manage-accounts" size={18} color={WHITE} />
      <Text style={nl.btnText}>Set Up Profile</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const NearbyProductsScreen = ({ navigation }) => {
  const { user, userLocation: savedLocation } = useAuth();

  const userCoords = useMemo(() => {
    const lat = savedLocation?.latitude  ?? user?.latitude;
    const lng = savedLocation?.longitude ?? user?.longitude;
    if (!lat || !lng) return null;
    return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  }, [savedLocation, user]);

  const hasLocation = !!userCoords;

  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [radius, setRadius]                   = useState(DEFAULT_RADIUS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mapReady, setMapReady]               = useState(false);

  const mapRef      = useRef(null);
  const radiusTimer = useRef(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  const mapProvider = Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (km) => {
    if (!userCoords) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(ENDPOINTS.NEARBY_LISTINGS, {
        params: {
          lat:    userCoords.latitude,
          lng:    userCoords.longitude,
          radius: km,
          limit:  100,
        },
      });

      // listing.service returns { success, rows, page, count }
      const raw = res.data?.rows ?? res.data?.data ?? [];

      // ── Map pins fix: seller ki location use karo agar listing mein nahi hai
      // Backend se seller lat/lng bhi aata hai seller join se — use karo
      const enriched = raw.map((item) => ({
        ...item,
        // Agar listing ka own lat/lng nahi hai to seller ka use karo
        latitude:  item.latitude  || item.seller_latitude  || null,
        longitude: item.longitude || item.seller_longitude || null,
      }));

      setProducts(enriched);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err) {
      console.error("[NearbyProducts] fetch error:", err);
      setError("Could not load nearby products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userCoords, fadeAnim]);

  useEffect(() => {
    if (hasLocation) fetchProducts(DEFAULT_RADIUS);
  }, [hasLocation]);

  // ── Radius change ──────────────────────────────────────────────────────────
  const handleRadiusChange = useCallback((km) => {
    setRadius(km);
    if (radiusTimer.current) clearTimeout(radiusTimer.current);
    radiusTimer.current = setTimeout(() => {
      fetchProducts(km);
      if (mapRef.current && mapReady && userCoords) {
        const delta = (km / 111) * 2.6;
        mapRef.current.animateToRegion(
          { ...userCoords, latitudeDelta: delta, longitudeDelta: delta }, 600,
        );
      }
    }, 400);
  }, [fetchProducts, mapReady, userCoords]);

  const handlePinPress = useCallback((product) => {
    setSelectedProduct((prev) => prev?.id === product.id ? null : product);
  }, []);

  const navigateToProduct = useCallback((product) => {
    navigation.navigate("ProductDetail", { product: product });
  }, [navigation]);

  const mapRegion = useMemo(() => {
    if (!userCoords) return null;
    const delta = (radius / 111) * 2.6;
    return { ...userCoords, latitudeDelta: delta, longitudeDelta: delta };
  }, [userCoords, radius]);

  // Products with valid coords for map pins
  const mappable = useMemo(
    () => products.filter((p) => p.latitude && p.longitude),
    [products]
  );

  // ── No location ────────────────────────────────────────────────────────────
  if (!hasLocation) {
    return (
      <SafeAreaView style={s.screen} edges={["top"]}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={TEXT1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nearby Products</Text>
          <View style={{ width: 36 }} />
        </View>
<NoLocationView onGoToProfile={() => navigation.navigate("Main", { screen: "Profile" })} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={TEXT1} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Nearby Products</Text>
          {!loading && products.length > 0 && (
            <View style={s.countPill}>
              <View style={s.countDot} />
              <Text style={s.countText}>{products.length} found</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={s.refreshBtn}
          onPress={() => fetchProducts(radius)}
          disabled={loading}
        >
          <MaterialIcons name="refresh" size={20} color={loading ? "#ccc" : CORAL} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >

        {/* ── 1. SLIDER — top ── */}
        <RadiusSlider value={radius} onChange={handleRadiusChange} />



         {/* ── 2. MAP — always at bottom ── */}
        {mapRegion && (
          <View style={s.mapSection}>
            <View style={s.mapTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mapTitle}>Near You on Map</Text>
                <Text style={s.mapSub}>
                  {mappable.length} product{mappable.length !== 1 ? "s" : ""} within {radius} km
                </Text>
              </View>
              <TouchableOpacity
                style={s.recentreBtn}
                onPress={() => {
                  if (mapRef.current) {
                    const delta = (radius / 111) * 2.6;
                    mapRef.current.animateToRegion(
                      { ...userCoords, latitudeDelta: delta, longitudeDelta: delta }, 500,
                    );
                  }
                }}
              >
                <MaterialIcons name="my-location" size={18} color={CORAL} />
              </TouchableOpacity>
            </View>

            <View style={s.circleOuter}>
              {/* Outer decorative ring */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: MAP_SIZE + 10, height: MAP_SIZE + 10,
                  borderRadius: (MAP_SIZE + 10) / 2,
                  borderWidth: 2.5, borderColor: `${CORAL}44`,
                  backgroundColor: "transparent",
                }}
              />
          
              <View onStartShouldSetResponder={() => true}>

              <CircularMapWrapper size={MAP_SIZE}>
                <MapView
                  ref={mapRef}
                  provider={mapProvider}
                  style={{ width: MAP_SIZE, height: MAP_SIZE }}
                  initialRegion={mapRegion}
                  onMapReady={() => setMapReady(true)}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  showsCompass={false}
                  showsScale={false}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                >
                  {/* Radius circle */}
                  <Circle
                    center={userCoords}
                    radius={radius * 1000}
                    strokeColor={`${CORAL}99`}
                    fillColor={`${CORAL}12`}
                    strokeWidth={2}
                  />

                  {/* Product pins — ek pin per unique location */}
                  {mappable.map((product) => {
                    const isSel = selectedProduct?.id === product.id;
                    return (
                      <Marker
                        key={`pin-${product.id}`}
                        coordinate={{
                          latitude:  parseFloat(product.latitude),
                          longitude: parseFloat(product.longitude),
                        }}
                        onPress={() => handlePinPress(product)}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={false}
                      >
                        <View style={pin.wrap}>
                          <View style={[pin.head, isSel && pin.headSel]}>
                            <MaterialIcons name="shopping-bag" size={9} color={WHITE} />
                          </View>
                          <View style={[pin.tail, isSel && pin.tailSel]} />
                        </View>
                      </Marker>
                    );
                  })}

                  {/* User blue dot */}
                  <Marker
                    coordinate={userCoords}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={pin.userWrap}>
                      <View style={pin.pulse} />
                      <View style={pin.userDot} />
                    </View>
                  </Marker>
                </MapView>
              </CircularMapWrapper>

              {products.length > 0 && (
                <View style={s.mapBadge}>
                  <Text style={s.mapBadgeNum}>{products.length}</Text>
                  <Text style={s.mapBadgeLbl}>items</Text>
                </View>
              )}
            </View>
            </View>

            {/* Legend */}
            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={s.legendBlue} />
                <Text style={s.legendTxt}>Your location</Text>
              </View>
              <View style={s.legendItem}>
                <View style={s.legendRed} />
                <Text style={s.legendTxt}>Product</Text>
              </View>
            </View>

            {/* Selected product mini card */}
         {/* Selected product mini card */}
{selectedProduct && (
  <TouchableOpacity
    style={s.selectedCard}
    onPress={() => navigateToProduct(selectedProduct)}
    activeOpacity={0.9}
  >
    <View style={s.selectedImgBox}>
      {(Array.isArray(selectedProduct.images)
        ? selectedProduct.images[0]
        : selectedProduct.image)
        ? <Image
            source={{ uri: Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : selectedProduct.image }}
            style={s.selectedImg}
            resizeMode="cover"
          />
        : <MaterialIcons name="image" size={16} color="#ccc" />}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.selectedTitle} numberOfLines={1}>{selectedProduct.title}</Text>
      <Text style={s.selectedPrice}>₹{Number(selectedProduct.price).toLocaleString("en-IN")}</Text>
    </View>

    {/* ✅ direction button — selectedProduct use karo, item nahi */}
    <TouchableOpacity
      style={pc.dirBtn}
      onPress={() => openDirections(selectedProduct)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialIcons name="directions" size={20} color={BLUE} />
    </TouchableOpacity>

    <MaterialIcons name="chevron-right" size={18} color={CORAL} />

    <TouchableOpacity
      onPress={() => setSelectedProduct(null)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialIcons name="close" size={14} color="#aaa" />
    </TouchableOpacity>
  </TouchableOpacity>
)}
          </View>
        )}

        {/* ── 3. PRODUCT LIST ── */}
        {loading ? (
          <View style={s.stateBox}>
            <ActivityIndicator size="large" color={CORAL} />
            <Text style={s.stateText}>Finding products near you…</Text>
          </View>
        ) : error ? (
          <View style={s.stateBox}>
            <MaterialIcons name="wifi-off" size={40} color="#ddd" />
            <Text style={s.stateText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => fetchProducts(radius)}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={s.stateBox}>
            <MaterialIcons name="inventory-2" size={48} color="#e0e0e0" />
            <Text style={s.emptyTitle}>No products found</Text>
            <Text style={s.emptyHint}>Try increasing the radius.</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Products Near You</Text>
              <Text style={s.sectionSub}>{products.length} within {radius} km</Text>
            </View>
           <View style={s.listContainer}>
  <ScrollView
    showsVerticalScrollIndicator={false}
    nestedScrollEnabled
  >
    {products.map((item) => (
      <ProductCard
        key={item.id}
        item={item}
        onPress={navigateToProduct}
      />
    ))}
  </ScrollView>
</View>
          </Animated.View>
        )}

       

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default NearbyProductsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 16 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:   { fontSize: 17, fontWeight: "700", color: TEXT1 },
  countPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFF0ED", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  countDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: CORAL },
  countText: { fontSize: 11, fontWeight: "700", color: CORAL },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFF0ED", alignItems: "center", justifyContent: "center",
  },

  stateBox: {
    alignItems: "center", gap: 10,
    paddingVertical: 48, paddingHorizontal: 32,
  },
  stateText:  { fontSize: 13, color: TEXT2, textAlign: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#ccc" },
  emptyHint:  { fontSize: 12, color: "#bbb", textAlign: "center" },
  retryBtn: {
    marginTop: 6, backgroundColor: CORAL,
    borderRadius: 20, paddingHorizontal: 24, paddingVertical: 9,
  },
  retryText: { color: WHITE, fontWeight: "700", fontSize: 13 },

  sectionHeader: {
    flexDirection: "row", alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: TEXT1 },
  sectionSub:   { fontSize: 11, color: TEXT2 },
listContainer: {
  height: 350, // apne hisab se 300-500 rakh sakti ho
  marginHorizontal: 12,
  backgroundColor: WHITE,
  borderRadius: 12,
  overflow: "hidden",
},
  // Vertical list with dividers
  list: {  gap: 1 },

  mapSection: {
    backgroundColor: WHITE,
    marginTop: 14,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  mapTitleRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 14,
  },
  mapTitle: { fontSize: 15, fontWeight: "800", color: TEXT1 },
  mapSub:   { fontSize: 11, color: TEXT2, marginTop: 2 },
  recentreBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#FFF0ED",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#FECDC3",
  },

  circleOuter: {
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },

  mapBadge: {
    position: "absolute", top: 10,
    alignSelf: "flex-end", marginRight: 14,
    backgroundColor: CORAL, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    alignItems: "center",
    borderWidth: 2, borderColor: WHITE,
    elevation: 5,
    shadowColor: CORAL, shadowOpacity: 0.35,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  mapBadgeNum: { color: WHITE, fontSize: 13, fontWeight: "800", lineHeight: 16 },
  mapBadgeLbl: { color: WHITE, fontSize: 9,  fontWeight: "600" },

  legend: { flexDirection: "row", gap: 18, justifyContent: "center", marginBottom: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendBlue: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: BLUE, borderWidth: 2, borderColor: WHITE, elevation: 2,
  },
  legendRed: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#E8392A", borderWidth: 2, borderColor: WHITE, elevation: 2,
  },
  legendTxt: { fontSize: 11, color: TEXT2, fontWeight: "500" },

  // Selected card (appears below legend when pin tapped)
  selectedCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 8,
    backgroundColor: "#FFF8F5", borderRadius: 12,
    padding: 10,
    borderWidth: 1, borderColor: `${CORAL}44`,
  },
  selectedImgBox: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: "#F3F4F6", overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  selectedImg:   { width: 40, height: 40 },
  selectedTitle: { fontSize: 12, fontWeight: "700", color: TEXT1 },
  selectedPrice: { fontSize: 12, fontWeight: "800", color: CORAL, marginTop: 1 },
});

// ── Radius slider
const sl = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    gap: 8,
  },
  label:    { fontSize: 12, fontWeight: "700", color: CORAL, minWidth: 44 },
  trackWrap: {
    flex: 1, height: THUMB_R * 2,
    justifyContent: "center", position: "relative",
  },
  track: { height: 4, borderRadius: 999, backgroundColor: "#F0EBE8", overflow: "hidden" },
  fill:  {
    position: "absolute", left: 0, top: 0, bottom: 0,
    backgroundColor: CORAL, borderRadius: 999,
  },
  thumb: {
    position: "absolute", top: 0,
    width: THUMB_R * 2, height: THUMB_R * 2, borderRadius: THUMB_R,
    backgroundColor: CORAL, borderWidth: 3, borderColor: WHITE,
    elevation: 5,
    shadowColor: CORAL, shadowOpacity: 0.4,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    zIndex: 99,
  },
  value: { fontSize: 12, fontWeight: "700", color: CORAL, minWidth: 50, textAlign: "right" },
});

// ── Product card — compact horizontal
const pc = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },

  imgBox: {
    width: 58, height: 58, borderRadius: 10,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
  },
  img:        { width: "100%", height: "100%" },
  imgFallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  distPill: {
    position: "absolute", bottom: 3, left: 3,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
  },
  distTxt: { color: WHITE, fontSize: 8, fontWeight: "700" },

  info:   { flex: 1 },
  name:   { fontSize: 13, fontWeight: "600", color: TEXT1 },
  price:  { fontSize: 13, fontWeight: "800", color: CORAL, marginTop: 2 },
  seller: { fontSize: 11, color: TEXT2, marginTop: 3 },


  rightSection: {
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 4,
},

address: {
  fontSize: 11,
  color: TEXT2,
  marginTop: 3,
},

price: {
  fontSize: 13,
  fontWeight: "800",
  color: CORAL,
},
dirBtn: {
  width: 32, height: 32,
  alignItems: "center", justifyContent: "center",
},
});

// ── Map pins
const pin = StyleSheet.create({
  wrap: { alignItems: "center" },
  head: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#E8392A",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: WHITE,
    elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.3,
    shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  headSel: { backgroundColor: CORAL, transform: [{ scale: 1.3 }] },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: "#E8392A", marginTop: -1,
  },
  tailSel: { borderTopColor: CORAL },

  userWrap: { alignItems: "center", justifyContent: "center", width: 28, height: 28 },
  pulse: {
    position: "absolute",
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${BLUE}20`,
    borderWidth: 1.5, borderColor: `${BLUE}40`,
  },
  userDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: BLUE, borderWidth: 3, borderColor: WHITE,
    elevation: 5,
    shadowColor: BLUE, shadowOpacity: 0.5,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
});

// ── No location
const nl = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 36, gap: 12, paddingTop: 80,
  },
  iconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#FFF0ED",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  title:   { fontSize: 20, fontWeight: "800", color: TEXT1, textAlign: "center" },
  sub:     { fontSize: 14, color: TEXT2, textAlign: "center", lineHeight: 21 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: CORAL, borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 12,
    elevation: 3,
    shadowColor: CORAL, shadowOpacity: 0.35,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  btnText: { color: WHITE, fontWeight: "700", fontSize: 15 },
});