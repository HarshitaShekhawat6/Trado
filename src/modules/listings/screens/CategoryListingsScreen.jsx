import React from "react";
import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, StyleSheet
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getProductsByCategory } from "../services/listings.service";
import ListingCard from "../components/Listingcard";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const CategoryListingsScreen = ({ route, navigation }) => {
  const { category } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ["category-products", category.slug],
    queryFn: () => getProductsByCategory(category.slug),
  });

  const listings = data?.rows || [];

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2979FF" />
      </View>
    );
  }

  // ── Empty ────────────────────────────────────────────────
 

  // ── Listings ─────────────────────────────────────────────
 return (
  <SafeAreaView style={styles.container}>

    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity 
          style={styles.backBtn}
onPress={() => navigation.goBack()}>
    <MaterialIcons name="arrow-back" size={20} color="#191b24" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{category.name}</Text>
      <View style={{ width: 36 }} /> 
    </View>

    {listings.length === 0 ? (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No Items Found</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to post in this category
        </Text>

        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate("Sell")}
        >
          <Text style={styles.postBtnText}>Post Item</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <FlatList
        data={listings}
        keyExtractor={(item, index) =>
          item?.id?.toString() ?? index.toString()
        }
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={(listing) =>
              navigation.navigate("ProductDetail", {
                product: listing,
              })
            }
          />
        )}
      />
    )}

  </SafeAreaView>
);
};

export default CategoryListingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb"},
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
header: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#fff",
  elevation: 2,
},
backBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#f3f2ff",
  alignItems: "center",
  justifyContent: "center",
},
headerTitle: {
  flex: 1,           
  textAlign: "center",
  fontSize: 18,
  fontWeight: "700",
  color: "#111",
},
 emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { marginTop: 8, color: "#666" },
  postBtn: {
    marginTop: 20,
    backgroundColor: "#2979FF",
    padding: 12,
    borderRadius: 8,
  },
  postBtnText: { color: "#fff", fontWeight: "600" },
});