import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import Icon     from "react-native-vector-icons/MaterialIcons";
import useInbox from "../modules/chat/hooks/useInbox"; // ← for unread count

const TabBar = ({ state, navigation }) => {
  const scaleAnim = useRef(state.routes.map(() => new Animated.Value(1))).current;

  // ← totalUnread for red dot on Inbox tab
  const { totalUnread } = useInbox();

  const animateTab = (index) => {
    Animated.sequence([
      Animated.timing(scaleAnim[index], {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          // ── SELL BUTTON (CENTER FLOATING) ──────────────────────────────────
          if (route.name === "Sell") {
            return (
              <View key={index} style={styles.sellWrapper}>
                <TouchableOpacity
                  style={styles.sellButton}
                  onPress={() => navigation.navigate(route.name)}
                >
                  <Icon name="add" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }

          const isInbox = route.name === "Inbox";

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                navigation.navigate(route.name);
                animateTab(index);
              }}
              style={[styles.tabItem,
                  route.name === "Wishlist" && {
    marginRight: 50
  },

  route.name === "Inbox" && {
    marginLeft: 50,
  },
             ] }
              activeOpacity={0.8}
            >
              {/* Icon container — with red dot for Inbox */}
              <View style={styles.iconWrapper}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.activeTab,
                    { transform: [{ scale: scaleAnim[index] }] },
                  ]}
                >
                  <Icon
                    name={getIcon(route.name)}
                    size={22}
                    color={isFocused ? "#fff" : "#555"}
                  />
                </Animated.View>

                {/* ← Red badge on Inbox tab */}
                {isInbox && totalUnread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: isFocused ? "#0d6efd" : "#666" }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getIcon = (route) => {
  switch (route) {
    case "Home":     return "home";
    case "Wishlist": return "favorite";
    case "Inbox":    return "chat-bubble-outline"; // ← chat icon for Inbox
    case "Listings":   return "shopping-bag";
    case "Profile":  return "person";
    default:         return "circle";
  }
};

export default TabBar;

const styles = StyleSheet.create({
container: {
  position: "absolute",
  bottom: 15,
  width: "100%",
  alignItems: "center",
  zIndex: 999,
},

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "92%",
    height: 70,
    borderRadius: 40,
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ← wrapper so badge can sit on top-right of icon
  iconWrapper: {
    position: "relative",
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTab: {
    backgroundColor: "#0d6efd",
  },

  label: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: "500",
  },

  // ← Red badge
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#e53935",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  sellWrapper: {
    position: "absolute",
    alignSelf: "center",
    top: -25,
  },

  sellButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0d6efd",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});