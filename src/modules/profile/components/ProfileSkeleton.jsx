// components/ProfileSkeleton.js
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Bone = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[s.bone, style, { opacity }]} />;
};

const ProfileSkeleton = () => (
  <SafeAreaView style={s.container} edges={["top"]}>
    {/* Header */}
    <View style={s.header}>
      <Bone style={{ width: 80, height: 22, borderRadius: 6 }} />
      <Bone style={{ width: 60, height: 32, borderRadius: 20 }} />
    </View>

    <View style={s.content}>
      {/* Avatar */}
      <View style={s.avatarSection}>
        <Bone style={{ width: 100, height: 100, borderRadius: 50 }} />
        <Bone style={{ width: 140, height: 18, borderRadius: 6, marginTop: 12 }} />
        <Bone style={{ width: 100, height: 14, borderRadius: 6, marginTop: 8 }} />
      </View>

      {/* Section title */}
      <Bone style={{ width: 160, height: 13, borderRadius: 4, marginBottom: 14 }} />

      {/* Fields */}
      {[...Array(4)].map((_, i) => (
        <View key={i} style={s.fieldGroup}>
          <Bone style={{ width: 80, height: 12, borderRadius: 4, marginBottom: 6 }} />
          <Bone style={{ width: "100%", height: 44, borderRadius: 10 }} />
        </View>
      ))}

      {/* Section title */}
      <Bone style={{ width: 80, height: 13, borderRadius: 4, marginTop: 8, marginBottom: 14 }} />

      {/* Address fields */}
      {[...Array(2)].map((_, i) => (
        <View key={i} style={s.fieldGroup}>
          <Bone style={{ width: 100, height: 12, borderRadius: 4, marginBottom: 6 }} />
          <Bone style={{ width: "100%", height: 44, borderRadius: 10 }} />
        </View>
      ))}

      {/* City + State row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[...Array(2)].map((_, i) => (
          <View key={i} style={[s.fieldGroup, { flex: 1 }]}>
            <Bone style={{ width: 60, height: 12, borderRadius: 4, marginBottom: 6 }} />
            <Bone style={{ width: "100%", height: 44, borderRadius: 10 }} />
          </View>
        ))}
      </View>
    </View>
  </SafeAreaView>
);

export default ProfileSkeleton;

const s = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: "#f8f9ff" 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: "#fff", 
    elevation: 2 
  },
  content: { 
    padding: 16 
  },
  avatarSection: { 
    alignItems: "center", 
    marginBottom: 28, 
    marginTop: 8 
  },
  fieldGroup: { 
    marginBottom: 14 
  },
  bone: { 
    backgroundColor: "#e0e0e0" 
  },
});

