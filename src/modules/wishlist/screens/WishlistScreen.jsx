import React, { useRef, useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

import Header from "../components/Header";
import useWishlist from "../hooks/useWishlist";
import WishlistCard from "../components/WishlistCard";

const ITEMS_PER_PAGE = 10;

const EmptyState = ({ onExplore }) => (
  <View style={s.emptyWrap}>
    <View style={s.emptyIconWrap}>
      <Ionicons name="heart-outline" size={48} color="#c7b8ff" />
    </View>
    <Text style={s.emptyTitle}>Nothing saved yet</Text>
   
<View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
  <Text style={s.emptySubtitle}>Tap the </Text>
  <Ionicons name="heart" size={16} color="#f90606" />
  <Text style={s.emptySubtitle}> on any item to save it here for later</Text>
</View>
    <TouchableOpacity style={s.exploreBtn} onPress={onExplore} activeOpacity={0.8}>
      <Text style={s.exploreBtnText}>Explore Listings</Text>
      <Ionicons name="arrow-forward" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

const WishlistScreen = ({ navigation }) => {
  const { wishlist, isLoading, toggleWishlist, error } = useWishlist();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side pagination logic
  const totalPages = Math.ceil((wishlist?.length || 0) / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return wishlist.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [wishlist, currentPage]);

  if (isLoading) {
    return (
      <View style={s.loaderWrap}>
        <ActivityIndicator size="large" color="#4343d5" />
        <Text style={s.loaderText}>Loading your wishlist...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <Header 
        title="Your Wishlist" 
        subtitle={wishlist.length > 0 ? `${wishlist.length} items saved` : "Save items you love"} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />

      {error && (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#c62828" />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      <Animated.FlatList
        data={currentItems}
        keyExtractor={(item) => String(item.listing_id || item.id)}
        numColumns={2}
        contentContainerStyle={[s.listContent, wishlist.length === 0 && s.listContentEmpty]}
        columnWrapperStyle={s.columnWrapper}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <WishlistCard
            item={item}
            onRemove={(id) => {
              // The hook expects the listing object
              toggleWishlist({ listing_id: id }, true);
            }}
            onView={(itemObj) => navigation.navigate("ProductDetail", { product: itemObj })}
          />
        )}
        ListEmptyComponent={<EmptyState onExplore={() => navigation.navigate("Home")} />}
        ListFooterComponent={
          wishlist.length > ITEMS_PER_PAGE ? (
            <View style={s.paginationContainer}>
              <TouchableOpacity style={[s.pageBtn, currentPage === 1 && s.pageBtnDisabled]} onPress={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? "#aaa" : "#fff"} />
                <Text style={[s.pageBtnText, currentPage === 1 && s.pageBtnTextDisabled]}>Prev</Text>
              </TouchableOpacity>
              <Text style={s.pageIndicator}>{currentPage} of {totalPages}</Text>
              <TouchableOpacity style={[s.pageBtn, currentPage === totalPages && s.pageBtnDisabled]} onPress={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                <Text style={[s.pageBtnText, currentPage === totalPages && s.pageBtnTextDisabled]}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? "#aaa" : "#fff"} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default WishlistScreen;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f6fb" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText: { fontSize: 14, color: "#999" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffebee", marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#e53935" },
  errorText: { fontSize: 13, color: "#c62828", flex: 1 },
  listContent: { padding: 16, paddingTop: 20 },
  listContentEmpty: { flex: 1 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 16 },
  
  // Pagination
  paginationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 30, paddingHorizontal: 10 },
  pageBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#4343d5", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 25, gap: 4 },
  pageBtnDisabled: { backgroundColor: "#e0e0e0" },
  pageBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  pageBtnTextDisabled: { color: "#aaa" },
  pageIndicator: { fontSize: 13, fontWeight: "600", color: "#555" },

  // Empty
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#f4f3ff", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a2e", marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  exploreBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#4343d5", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 50 },
  exploreBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
