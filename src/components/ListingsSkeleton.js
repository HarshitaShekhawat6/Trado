import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ScrollView } from "react-native";

const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#e0e0e0", opacity }, style]}
    />
  );
};

// Compact skeleton — for Featured horizontal scroll
export const CompactCardSkeleton = () => (
  <View style={styles.compactCard}>
    <SkeletonBox width="100%" height={115} borderRadius={0} />
    <View style={styles.compactBody}>
      <SkeletonBox width={90}   height={16} />
      <SkeletonBox width="90%" height={12} style={{ marginTop: 6 }} />
      <SkeletonBox width={70}   height={10} style={{ marginTop: 4 }} />
    </View>
  </View>
);

// Full skeleton — for Recent / All Listings vertical list
export const FullCardSkeleton = () => (
  <View style={styles.card}>
    <SkeletonBox width="100%" height={200} borderRadius={0} />
    <View style={styles.info}>
      <SkeletonBox width={130}  height={20} />
      <SkeletonBox width="80%" height={14} style={{ marginTop: 8 }} />
      <SkeletonBox width="55%" height={14} style={{ marginTop: 4 }} />
      <View style={styles.row}>
        <SkeletonBox width={110} height={12} />
        <SkeletonBox width={55}  height={12} />
      </View>
    </View>
  </View>
);

// Horizontal row of compact skeletons
export const FeaturedSkeleton = ({ count = 4 }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    scrollEnabled={false}
  >
    {Array.from({ length: count }).map((_, i) => (
      <CompactCardSkeleton key={i} />
    ))}
  </ScrollView>
);

// Vertical stack of full skeletons
export const RecentSkeleton = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <FullCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginBottom: 12, overflow: "hidden", elevation: 1,
  },
  info: { padding: 12, gap: 4 },
  row:  { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  compactCard: {
    width: 175, backgroundColor: "#fff",
    borderRadius: 12, overflow: "hidden", marginRight: 12, elevation: 1,
  },
  compactBody: { padding: 10, gap: 4 },
});