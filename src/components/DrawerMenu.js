// src/components/DrawerMenu.js
// Full-screen overlay drawer — renders over everything including tab bar

import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, TouchableWithoutFeedback,
  Image, Platform, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon    from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../navigation/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

const MENU_ITEMS = [
  { label: "Home",     icon: "home",               route: "Home"     },
  { label: "Wishlist", icon: "favorite",     route: "Wishlist" },
  { label: "Inbox",    icon: "chat-bubble-outline", route: "Inbox"    },
  { label: "Listings",   icon: "shopping-bag",        route: "Orders"   },
  { label: "Profile",  icon: "person-outline",      route: "Profile"  },
  { label: "Nearby Products",  icon: "location-on",      route: "NearbyProducts"  },

];

const DrawerMenu = ({ visible, onClose, navigation, currentRoute }) => {
  const { user, logout } = useAuth();
  const insets            = useSafeAreaInsets();

  const translateX  = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue:         0,
          useNativeDriver: true,
          bounciness:      0,
          speed:           18,
        }),
        Animated.timing(overlayAnim, {
          toValue:         1,
          duration:        250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue:         -DRAWER_WIDTH,
          duration:        220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue:         0,
          duration:        220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route) => {
    onClose();
    setTimeout(() => navigation.navigate(route), 250);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => logout(), 300);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    // Modal renders above EVERYTHING — tab bar, headers, status bar
    <Modal
      visible={visible}
      transparent
      animationType="none"      // we handle animation ourselves with Animated
      statusBarTranslucent      // covers status bar on Android
      onRequestClose={onClose}  // Android back button closes drawer
    >
      {/* Dark overlay — tap anywhere to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel slides in from left */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform:     [{ translateX }],
            paddingTop:    insets.top + 12,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Close button top-right inside drawer */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={21} color="#555" />
        </TouchableOpacity>

        {/* ── User profile section ───────────────────────────────────────── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {user?.image ? (
  <Image source={{ uri: user.image }} style={styles.avatar} />
) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || "Guest User"}
          </Text>
          <Text style={styles.userSub} numberOfLines={1}>
            {user?.email || user?.phone || ""}
          </Text>

          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => handleNavigate("Profile")}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Icon name="arrow-forward" size={13} color="#0d6efd" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ── Menu items ────────────────────────────────────────────────── */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, isActive && styles.menuIconWrapActive]}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color={isActive ? "#fff" : "#555"}
                  />
                </View>
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Logout + version ──────────────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIconWrap}>
              <Icon name="logout" size={20} color="#e53935" />
            </View>
            <Text style={styles.logoutLabel}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position:        "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  drawer: {
    position:        "absolute",
    left: 0, top: 0, bottom: 0,
    width:           DRAWER_WIDTH,
    backgroundColor: "#fff",
    elevation:       24,
    shadowColor:     "#000",
    shadowOpacity:   0.2,
    shadowRadius:    20,
    shadowOffset:    { width: 6, height: 0 },
    flexDirection:   "column",
  },

  closeBtn: {
    position:        "absolute",
    top:             Platform.OS === "ios" ? 54 : 14,
    right:           14,
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: "#f4f4f8",
    alignItems:      "center",
    justifyContent:  "center",
    zIndex:          10,
  },

  profileSection: {
    paddingHorizontal: 22,
    paddingTop:        12,
    paddingBottom:     22,
  },
  avatarWrap: {
    position:     "relative",
    width:        66,
    height:       66,
    marginBottom: 14,
  },
  avatar: {
    width: 66, height: 66, borderRadius: 33,
  },
  avatarFallback: {
    width:           66, height: 66, borderRadius: 33,
    backgroundColor: "#0d6efd",
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarInitials: {
    color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 1,
  },
  onlineBadge: {
    position:        "absolute",
    bottom: 2, right: 2,
    width:           13, height: 13, borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth:     2, borderColor: "#fff",
  },
  userName: {
    fontSize: 17, fontWeight: "800", color: "#191b24", marginBottom: 3,
  },
  userSub: {
    fontSize: 12, color: "#999", marginBottom: 12,
  },
  viewProfileBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    alignSelf:         "flex-start",
    backgroundColor:   "#eef3ff",
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
  },
  viewProfileText: {
    fontSize: 12, fontWeight: "700", color: "#0d6efd",
  },

  divider: {
    height:           1,
    backgroundColor:  "#f0f0f8",
    marginHorizontal: 18,
    marginVertical:   6,
  },

  menuList: {
    flex:              1,
    paddingHorizontal: 12,
    paddingTop:        6,
    gap:               2,
  },
  menuItem: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   11,
    paddingHorizontal: 10,
    borderRadius:      14,
    gap:               13,
  },
  menuItemActive: {
    backgroundColor: "#eef3ff",
  },
  menuIconWrap: {
    width:           38, height: 38, borderRadius: 10,
    backgroundColor: "#f4f4f8",
    alignItems:      "center",
    justifyContent:  "center",
  },
  menuIconWrapActive: {
    backgroundColor: "#0d6efd",
  },
  menuLabel: {
    fontSize: 15, fontWeight: "500", color: "#444", flex: 1,
  },
  menuLabelActive: {
    fontWeight: "700", color: "#0d6efd",
  },
  activeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#0d6efd",
  },

  bottomSection: {
    paddingHorizontal: 12,
    paddingTop:        4,
  },
  logoutBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   11,
    paddingHorizontal: 10,
    borderRadius:      14,
    gap:               13,
    marginTop:         4,
  },
  logoutIconWrap: {
    width:           38, height: 38, borderRadius: 10,
    backgroundColor: "#fff0f0",
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoutLabel: {
    fontSize: 15, fontWeight: "600", color: "#e53935",
  },
  version: {
    textAlign: "center",
    fontSize:  11,
    color:     "#ccc",
    marginTop: 14,
  },
});

export default DrawerMenu;