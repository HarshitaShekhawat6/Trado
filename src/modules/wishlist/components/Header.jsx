import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from "react-native";
import { useAuth } from "../../../navigation/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";

const Header = ({ title, subtitle, onBack, showBack = false }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <Animated.View style={[s.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {showBack && onBack ? (
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
      ) : (
        <View style={s.avatarContainer}>
          <Image source={{ uri: "https://i.pravatar.cc/100" }} style={s.avatar} />
        </View>
      )}

      <View style={s.textContainer}>
        {title ? (
          <Text style={s.title}>{title}</Text>
        ) : (
          <Text style={s.title}>Welcome{userName ? `, ${userName}` : ""}</Text>
        )}
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>

      <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={20} color="#1a1a2e" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Header;

const s = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: "#fff", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, shadowColor: "#4343d5", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f4f3ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", marginRight: 12 },
  avatar: { width: "100%", height: "100%" },
  textContainer: { flex: 1, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#1a1a2e", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#999", marginTop: 2 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f4f3ff", justifyContent: "center", alignItems: "center" },
});
