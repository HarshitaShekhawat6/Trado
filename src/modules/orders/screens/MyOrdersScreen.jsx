// orders/screens/MyOrdersScreen.jsx

import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from "react-native";
import MaterialIcons      from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView }   from "react-native-safe-area-context";

import useOrders          from "../hooks/useOrders";
import OrderListingCard   from "../components/OrderListingCard";
import RepostSheet        from "../components/RepostSheet";
import EditListingModal   from "../components/EditListingModal";
import EnableBiddingModal from "../components/EnableBiddingModal";
import SellerBidsModal    from "../components/SellerBidsModal";
import { TABS }           from "../constants/orderConstants";
import C                  from "../constants/colors";

const MyOrdersScreen = ({ navigation }) => {
  
  const {
  activeTab,
  listings,
  loading,
  handleTabChange,
  handleMarkAsSold,
  handleBiddingEnabled,
  handleListingEdited,
  allListings,         
  setAllListings,
  handleRepost,
  reposting,           
  repostSheetVisible,
  setRepostSheetVisible,
  repostItem,          
  setRepostItem,
  applyFilter,
} = useOrders();

  const [bidsItem,    setBidsItem]    = useState(null);
  const [editItem,    setEditItem]    = useState(null);
  const [biddingItem, setBiddingItem] = useState(null);

  const renderItem = ({ item }) => (
    <OrderListingCard
      item={item}
    reposting={reposting ? repostItem?.id : null} 
      onRepost={handleRepost}
      onMarkSold={handleMarkAsSold}
      onViewBids={(i)      => setBidsItem(i)}
      onEdit={(i)          => setEditItem(i)}
      onEnableBidding={(i) => setBiddingItem(i)}
    />
  );

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Listings</Text>
        <TouchableOpacity>
          <MaterialIcons name="search" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={s.topSection}>
        <Text style={s.mainTitle}>Overview</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabChange(tab)}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MaterialIcons name="inbox" size={48} color={C.outline} />
              <Text style={s.empty}>No listings in this category</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate("SellScreen")}
      >
        <MaterialIcons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Modals & Sheets ── */}

     <RepostSheet
  visible={repostSheetVisible}
  product={repostItem}
  onClose={() => {
    setRepostSheetVisible(false);
    setRepostItem(null);
  }}
  onReposted={(item) => {
    const updated = allListings.map((l) =>
      l.id === item.id ? { ...l, status: "pending" } : l
    );
    setAllListings(updated);
    applyFilter(activeTab, updated);
    setRepostSheetVisible(false);
    setRepostItem(null);
  }}
/>

      <SellerBidsModal
        visible={!!bidsItem}
        listing={bidsItem}
        onClose={() => setBidsItem(null)}
        navigation={navigation}
      />

      <EditListingModal
        visible={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={handleListingEdited}
      />

      <EnableBiddingModal
        visible={!!biddingItem}
        item={biddingItem}
        onClose={() => setBiddingItem(null)}
        onEnabled={(item) => handleBiddingEnabled(item.id)}
      />

    </SafeAreaView>
  );
};

export default MyOrdersScreen;

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle:   { fontSize: 18, fontWeight: "700", color: C.primary },
  topSection:    { paddingHorizontal: 16, marginTop: 8 },
  mainTitle:     { fontSize: 28, fontWeight: "800", color: C.onSurface },
  tabsRow: {
    flexDirection: "row", paddingHorizontal: 16,
    marginTop: 16, gap: 10,
  },
  tabBtn:        { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.surfaceContainerLow },
  tabBtnActive:  { backgroundColor: C.primary },
  tabText:       { fontSize: 13, fontWeight: "600", color: C.onSurfaceVariant },
  tabTextActive: { color: "#fff" },
  loader:        { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap:     { alignItems: "center", marginTop: 60, gap: 10 },
  empty:         { textAlign: "center", color: C.outline, fontSize: 14 },
  fab: {
    position: "absolute", bottom: 30, right: 20,
    backgroundColor: C.primary, width: 56, height: 56,
    borderRadius: 28, justifyContent: "center", alignItems: "center",
    elevation: 6,
  },
});