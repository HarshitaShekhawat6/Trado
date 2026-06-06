import React, { useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import apiClient from "../../../api/client";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const resolveImage = (img) => {
  const BASE_URL = apiClient.defaults.baseURL?.replace("/api", "") ?? "";
  if (!img) return null;
  if (typeof img === "string") {
    if (!img.trim() || img === "null" || img.includes("undefined")) return null;
    return img.startsWith("http") ? img : `${BASE_URL}/${img}`;
  }
  if (typeof img === "object") {
    const url = img?.url ?? img?.uri ?? null;
    if (!url) return null;
    return url.startsWith("http") ? url : `${BASE_URL}/${url}`;
  }
  return null;
};

const WishlistCard = ({ item, onRemove, onView }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  const handleRemove = () => {
    // Exit animation before triggering remove callback
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 0.8, useNativeDriver: true })
    ]).start(() => {
      onRemove(item.listing_id || item.id);
    });
  };

const imageUri = resolveImage(item.image) ?? resolveImage(item.images?.[0]) ?? null;


  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onView(item)}>
        <View style={styles.imageWrap}>
{imageUri ? (
  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
) : (
  <View style={[styles.image, styles.noImageBox]}>
    <Icon name="image" size={34} color="#bbb" />
    <Text style={styles.noImageText}>NO IMAGE</Text>
  </View>
)}
<View style={styles.imageOverlay} />
          {item.condition && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{item.condition}</Text>
            </View>
          )}
          {/* New ✕ remove button */}
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.locationText} numberOfLines={1}>{item.city || item.location || "Location N/A"}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>₹{item.price != null ? Number(item.price).toLocaleString("en-IN") : "—"}</Text>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onView(item)}>
            <Icon name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
         {item.seller?.name && (
          <Text style={styles.sellerText}>by {item.seller.name}</Text>
        )}
        </View>
    </Animated.View>
  );
};

export default WishlistCard;

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 160 },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 60, backgroundColor: "rgba(0,0,0,0.15)" },
 noImageBox: {
  backgroundColor: "#f0f0f0",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},
noImageText: {
  fontSize: 9,
  color: "#999",
  fontWeight: "600",
},
 
  conditionBadge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  conditionText: { fontSize: 10, fontWeight: "700", color: "#4343d5", textTransform: "uppercase" },
  removeBtn: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 15, width: 28, height: 28, justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a2e", lineHeight: 18, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  locationText: { fontSize: 11, color: "#999", flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceText: { fontSize: 15, fontWeight: "800", color: "#4343d5" },
  viewBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#4343d5", justifyContent: "center", alignItems: "center" },
  sellerText: { fontSize: 10, color: "#bbb", marginTop: 6 },
});

