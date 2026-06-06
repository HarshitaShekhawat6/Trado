// orders/components/SellerBidsModal.jsx

import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints"; 
import Toast from "react-native-toast-message";

const BID_GREEN = "#059669";
const BLUE      = "#2979FF";
const DARK      = "#111827";
const GRAY      = "#6B7280";

const SellerBidsModal = ({ visible, onClose, listing, navigation }) => {
  const [bids,    setBids]    = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && listing?.id) fetchBids();
  }, [visible, listing?.id]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${ENDPOINTS.BIDS}/seller/${listing.id}`); 
      setBids(res.data?.bids || res.data || []);
    } catch (err) {
      console.log("[SellerBidsModal] error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Highest bid
  const highestBid = bids.length > 0
    ? bids.reduce((max, b) => Number(b.amount) > Number(max.amount) ? b : max, bids[0])
    : null;

  // Chat with bidder
  const handleChat = async (bid) => {
    if (!bid.bidder_user_id) {
        Toast.show({
          type: "error", text1: "Action Failed",
          text2: "This bidder is not registered.",
          position: "top", visibilityTime: 3000, topOffset: 60,
        });
      return;
    }
    try {
    const res = await apiClient.post(`${ENDPOINTS.CHAT}/conversation`,  {
        listing_id: listing.id,
        seller_id:  listing.user_id || listing.seller_id,
        buyer_id:   bid.bidder_user_id,
      });
      const conversationId = res.data?.conversation_id || res.data?.id;
      if (!conversationId) throw new Error("No conversation ID");
      onClose();
      navigation.navigate("Chat", {
        conversationId,
        otherUserName:  bid.bidder_name,
        otherUserImage: null,
        listingTitle:   listing.title,
      });
    } catch (err) {
Toast.show(err?.response?.data?.message || "Failed to start chat. Please try again.", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  const renderBid = ({ item, index }) => {
    const isTop = item.id === highestBid?.id;
    return (
      <View style={[bm.bidCard, isTop && bm.bidCardTop]}>
        {/* Top badge */}
        {isTop && (
          <View style={bm.topBadge}>
            <Ionicons name="trophy" size={12} color={BID_GREEN} />
            <Text style={bm.topBadgeText}>Highest Bid</Text>
          </View>
        )}

        <View style={bm.bidRow}>
          {/* Avatar */}
          <View style={[bm.avatar, isTop && bm.avatarTop]}>
            <Text style={[bm.avatarText, isTop && bm.avatarTextTop]}>
              {item.bidder_name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>

          {/* Info */}
          <View style={bm.bidInfo}>
            <Text style={bm.bidderName}>{item.bidder_name}</Text>
            {!!item.note && (
              <Text style={bm.bidNote} numberOfLines={2}>{item.note}</Text>
            )}
          </View>

          {/* Amount */}
          <Text style={[bm.bidAmount, isTop && bm.bidAmountTop]}>
            ₹{Number(item.amount).toLocaleString("en-IN")}
          </Text>
        </View>

        {/* Chat button — only if user is registered */}
        {!!item.bidder_user_id && (
          <TouchableOpacity
            style={bm.chatBtn}
            onPress={() => handleChat(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={14} color={BLUE} />
            <Text style={bm.chatBtnText}>Chat with {item.bidder_name || "User"}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bm.overlay}>
        <View style={bm.sheet}>

          {/* Header */}
          <View style={bm.header}>
            <View>
              <Text style={bm.headerTitle}>Bids</Text>
              {!!listing?.title && (
                <Text style={bm.headerSub} numberOfLines={1}>{listing.title}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={bm.closeBtn}>
              <Ionicons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={BLUE} style={{ marginVertical: 40 }} />
          ) : bids.length === 0 ? (
            <View style={bm.empty}>
              <Ionicons name="hammer-outline" size={48} color="#e0e0e0" />
              <Text style={bm.emptyText}>No bids yet</Text>
              <Text style={bm.emptySub}>Buyers haven't placed any bids on this listing.</Text>
            </View>
          ) : (
            <FlatList
              data={bids}
              keyExtractor={(item, i) => item.id?.toString() || i.toString()}
              renderItem={renderBid}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                // highestBid ? (
                //   <View style={bm.topSummary}>
                //     <View style={bm.topSummaryDot} />
                //     <View style={{ flex: 1 }}>
                //       <Text style={bm.topSummaryLabel}>Highest Bid</Text>
                //       <Text style={bm.topSummaryName}>{highestBid.bidder_name}</Text>
                //     </View>
                //     <Text style={bm.topSummaryAmt}>
                //       ₹{Number(highestBid.amount).toLocaleString("en-IN")}
                //     </Text>
                //   </View>
                // ) : null
                  <Text style={bm.allBidsHeading}>All Bids ({bids.length})</Text>

              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SellerBidsModal;

const bm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, maxHeight: "88%",
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: DARK },
  headerSub:   { fontSize: 12, color: GRAY, marginTop: 2, maxWidth: 220 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#f4f4f8", alignItems: "center", justifyContent: "center",
  },

  // Top summary banner
  topSummary: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#6ee7b7",
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  topSummaryDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: BID_GREEN },
  topSummaryLabel:{ fontSize: 10, color: BID_GREEN, fontWeight: "700", textTransform: "uppercase" },
  topSummaryName: { fontSize: 15, fontWeight: "800", color: DARK },
  topSummaryAmt:  { fontSize: 20, fontWeight: "800", color: BID_GREEN },

allBidsHeading: {
  fontSize: 13, fontWeight: "700", color: GRAY,
  textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12,
},

  // Bid card
  bidCard: {
    backgroundColor: "#f8f9fb", borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#ebebf5",
  },
  bidCardTop: {
    backgroundColor: "#f0fdf4", borderColor: "#86efac",
  },
  topBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 8,
  },
  topBadgeText: { fontSize: 11, fontWeight: "700", color: BID_GREEN },

  bidRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#e8eeff", alignItems: "center", justifyContent: "center",
  },
  avatarTop:     { backgroundColor: "#dcfce7" },
  avatarText:    { fontSize: 16, fontWeight: "700", color: BLUE },
  avatarTextTop: { color: BID_GREEN },

  bidInfo:    { flex: 1 },
  bidderName: { fontSize: 14, fontWeight: "700", color: DARK },
  bidNote:    { fontSize: 12, color: GRAY, marginTop: 2, lineHeight: 17 },
  bidAmount:    { fontSize: 16, fontWeight: "800", color: DARK },
  bidAmountTop: { color: BID_GREEN },

  chatBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, alignSelf: "flex-start",
    backgroundColor: "#eef3ff", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
  },
  chatBtnText: { fontSize: 12, fontWeight: "700", color: BLUE },

  // Empty state
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#aaa" },
  emptySub:  { fontSize: 13, color: "#ccc", textAlign: "center", paddingHorizontal: 20 },
});