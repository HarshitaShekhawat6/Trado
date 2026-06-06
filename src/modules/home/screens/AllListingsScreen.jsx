import React from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";

import {
  getProductsService,
  getRecentProductsService,
  getProductsByCategoryService,
} from "../services/home.service";
import ListingCard from "../../listings/components/Listingcard";

const AllListingsScreen = ({ navigation, route }) => {
  const { type, category } = route.params || {};

  // ── Decide which service to call 
  const queryKey = category
    ? ["products", "category", category]
    : ["products", type];

  const queryFn = category
    ? () => getProductsByCategoryService(category)
    : type === "recent"
    ? getRecentProductsService
    : () => getProductsService(1);

  const { data: products = [], isLoading } = useQuery({ queryKey, queryFn });

  // ── Screen title 
  const screenTitle = category
    ? category
    : type === "recent"
    ? "Recently Added"
    : "Featured Listings";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#191b24" />
        </TouchableOpacity>
        <Text style={styles.title}>{screenTitle}</Text>
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0040e0" />
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item, i) => item?.id?.toString() || i.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // ✅ FIX: { product: item } matches route.params.product in ProductCard
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              variant="default"
              onPress={() => navigation.navigate("ProductDetail", { product: item })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="inbox" size={48} color="#c4c5d9" />
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
};

export default AllListingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, marginTop: 60 },

  header: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor:   "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4f0",
    gap:               12,
  },
  backBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: "#f3f2ff",
    alignItems:      "center",
    justifyContent:  "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#1a1a2e", textTransform: "capitalize" },

  listContent: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 30 },
  emptyText:   { fontSize: 15, color: "#aaa", fontWeight: "600" },
});