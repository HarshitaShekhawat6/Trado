

import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons      from "react-native-vector-icons/Ionicons";

import { useCardAnimation } from "./listingCard.animation";
import useWishlist           from "../../wishlist/hooks/useWishlist";
import { getListingCoverImage } from "../../../utils/listingImages";


const ListingCard = ({ listing, onPress, variant = "default" }) => {
  const { animatedStyle, onPressIn, onPressOut } = useCardAnimation();
  const isCompact = variant === "compact";

  // ── Heart animation 
  const heartScale = useRef(new Animated.Value(1)).current;

  // ── Wishlist 
  const { toggleWishlist, isWishlisted, isToggling } = useWishlist();

  const listingId  = listing?.listing_id ?? listing?.id;
  const wishlisted = isWishlisted(listingId);

  // ── Resolve image 
  const imageUri = getListingCoverImage(listing);

  // ── Handlers 
  const handleCardPress = () => {
    if (onPress) onPress(listing);
  };

  const handleWishlistPress = () => {
    if (isToggling) return;

    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1.3,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    toggleWishlist(listing, wishlisted);
  };

  // ── Render 
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handleCardPress}
      style={isCompact ? styles.wrapCompact : styles.wrapDefault}
    >
      <Animated.View style={[styles.card, animatedStyle]}>

        {/* ── Image  */}
        <View style={isCompact ? styles.imageCompact : styles.image}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.noImageBox]}>
              <MaterialIcons name="image" size={34} color="#bbb" />
              <Text style={styles.noImageText}>NO IMAGE AVAILABLE</Text>
            </View>
          )}

          {/* ── Heart button  */}
          <Animated.View
            style={[styles.heartWrapper, { transform: [{ scale: heartScale }] }]}
          >
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={handleWishlistPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={isToggling}
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={20}
                color={wishlisted ? "#e53935" : "#fff"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Info  */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {listing?.title || "Untitled"}
          </Text>

          <Text style={styles.price}>
            ₹{listing?.price != null
              ? Number(listing.price).toLocaleString("en-IN")
              : "—"}
          </Text>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={11} color="#999" />
            <Text style={styles.location} numberOfLines={1}>
              {listing?.location || "India"}
            </Text>
          </View>
        </View>

      </Animated.View>
    </TouchableOpacity>
  );
};

export default ListingCard;


const styles = StyleSheet.create({
  wrapCompact: {
    width: 150,
    margin: 6,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

image: {
  width: "100%",
  height: 180,  
},

imageCompact: {
  width: "100%",
  height: 140,  
},
wrapDefault: {
  width: "45%",  
  margin: "2%",
 
},
  // ── No image placeholder 
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
    letterSpacing: 0.4,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // ── Heart 
  heartWrapper: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  heartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Info 
  info: {
    padding: 10,
  },

  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#191b24",
  },

  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0040e0",
    marginTop: 4,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },

  location: {
    fontSize: 11,
    color: "#999",
    flex: 1,
  },
});
