// modules/listings/screens/ProductDetailScreen.jsx

import React, { useState, useEffect } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
  Share, StatusBar, Modal, TextInput, FlatList,
} from "react-native";
import { SafeAreaView }  from "react-native-safe-area-context";
import Ionicons          from "react-native-vector-icons/Ionicons";
import MaterialIcons     from "react-native-vector-icons/MaterialIcons";
import { useRoute }      from "@react-navigation/native";
import { useQuery }      from "@tanstack/react-query";

import { getListingById }           from "../services/listings.service";
import { useAuth }                  from "../../../navigation/AuthContext";
import { getListingImages }         from "../../../utils/listingImages";
import { formatLocationAddress }    from "../../../utils/locationUtils";
import { startConversationService } from "../../chat/services/chatService";
import useWishlist                  from "../../wishlist/hooks/useWishlist";
import apiClient                    from "../../../api/client";
import Toast                        from "react-native-toast-message";
import { shareListing }             from "../../../utils/shareService";

const { width } = Dimensions.get("window");

const BLUE      = "#2979FF";
const DARK      = "#111827";
const GRAY      = "#6B7280";
const LIGHT     = "#F3F4F6";
const WHITE     = "#FFFFFF";
const BID_GREEN = "#059669";

const formatPrice = (price) => {
  if (price == null || price === "") return null;
  if (typeof price === "string") {
    if (price.startsWith("₹")) return price;
    const n = parseFloat(price.replace(/[^0-9.]/g, ""));
    return !isNaN(n) ? `₹ ${n.toLocaleString("en-IN")}` : price;
  }
  if (typeof price === "number") return `₹ ${price.toLocaleString("en-IN")}`;
  return null;
};

const resolveImages = (product) => {
  const images = getListingImages(product);
  return images.length > 0 ? images : ["https://via.placeholder.com/400"];
};

// ─── BidModal ─────────────────────────────────────────────────────────────────
const BidModal = ({ visible, onClose, product, currentUser }) => {
  const [name,        setName]        = useState(currentUser?.name || "");
  const [note,        setNote]        = useState("");
  const [amount,      setAmount]      = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [bids,        setBids]        = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  React.useEffect(() => {
    if (visible && product?.id) fetchBids();
  }, [visible, product?.id]);

  const fetchBids = async () => {
    try {
      setLoadingBids(true);
      const res = await apiClient.get(`/api/bids/${product.id}`);
      setBids(res.data?.bids || res.data || []);
    } catch (err) {
      console.log("[BidModal] fetchBids error:", err?.response?.data || err.message);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleSubmitBid = async () => {
    // ── Validation ──
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Action Failed", text2: "Please enter your name.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    if (!amount.trim()) {
      Toast.show({ type: "error", text1: "Action Failed", text2: "Please enter a bid amount.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Toast.show({ type: "error", text1: "Action Failed", text2: "Enter a valid amount.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/api/bids", {
        product_id:     product.id,
        bidder_name:    name.trim(),
        note:           note.trim() || null,
        amount:         Number(amount),
        bidder_user_id: currentUser?.id || null,
      });
      setAmount("");
      setNote("");
      await fetchBids();
      onClose();
      Toast.show({
        type: "success", text1: "Bid Placed!",
        text2: `Your bid of ₹${Number(amount).toLocaleString("en-IN")} has been placed.`,
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } catch (err) {
      Toast.show({
        type: "error", text1: "Failed to Place Bid",
        text2: err?.response?.data?.message || "Could not place bid.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const highestBid = bids.length > 0
    ? bids.reduce((max, b) => Number(b.amount) > Number(max.amount) ? b : max, bids[0])
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bm.overlay}>
        <View style={bm.sheet}>
          <View style={bm.header}>
            <Text style={bm.headerTitle}>Place a Bid</Text>
            <TouchableOpacity onPress={onClose} style={bm.closeBtn}>
              <Ionicons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {highestBid && (
              <View style={bm.topBid}>
                <View style={bm.topBidDot} />
                <View>
                  <Text style={bm.topBidLabel}>Highest Bid</Text>
                  <Text style={bm.topBidName}>{highestBid.bidder_name}</Text>
                </View>
                <Text style={bm.topBidAmount}>
                  ₹{Number(highestBid.amount).toLocaleString("en-IN")}
                </Text>
              </View>
            )}

            {loadingBids ? (
              <ActivityIndicator color={BLUE} style={{ marginVertical: 16 }} />
            ) : bids.length > 0 ? (
              <View style={bm.bidList}>
                <Text style={bm.sectionLabel}>ALL BIDS</Text>
                {bids.map((bid, i) => (
                  <View key={bid.id || i} style={bm.bidRow}>
                    <View style={bm.bidAvatar}>
                      <Text style={bm.bidAvatarText}>
                        {bid.bidder_name?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <Text style={bm.bidderName} numberOfLines={1}>{bid.bidder_name}</Text>
                    <Text style={bm.bidAmount}>₹{Number(bid.amount).toLocaleString("en-IN")}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={bm.noBids}>No bids yet. Be the first!</Text>
            )}

            <View style={bm.divider} />
            <Text style={bm.sectionLabel}>YOUR BID</Text>

            <Text style={bm.inputLabel}>Name</Text>
            <TextInput
              style={bm.input}
              placeholder="Your name"
              placeholderTextColor="#bbb"
              value={name}
              onChangeText={setName}
            />

            <Text style={bm.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={bm.input}
              placeholder={highestBid
                ? `More than ₹${Number(highestBid.amount).toLocaleString("en-IN")}`
                : "Enter your bid amount"}
              placeholderTextColor="#bbb"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Text style={bm.inputLabel}>
              Message / Note <Text style={bm.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[bm.input, bm.inputMultiline]}
              placeholder="Write a message to the seller..."
              placeholderTextColor="#bbb"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[bm.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitBid}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={bm.submitBtnText}>Submit Bid</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProductDetailScreen = ({ navigation }) => {
  const route    = useRoute();
  const { user } = useAuth();

  const { isWishlisted, toggleWishlist, isToggling } = useWishlist();

  const paramProduct = route?.params?.product || route?.params?.item || null;
  const productId    = paramProduct?.id ?? paramProduct?._id ?? null;

  const [activeImage,  setActiveImage]  = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [chatLoading,  setChatLoading]  = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["listing", productId],
    queryFn:  () => getListingById(productId),
    enabled:  !!productId,
    retry:    1,
    staleTime: 0,
  });

  useEffect(() => {
    if (productId) {
      apiClient.post(`/api/listings/${productId}/view`).catch(() => {});
    }
  }, [productId]);

  const apiProduct =
    apiResponse?.data ||
    (apiResponse && typeof apiResponse === "object" && !apiResponse.data
      ? apiResponse : null);
  const product = apiProduct ? { ...paramProduct, ...apiProduct } : paramProduct;

  const wishlisted = product ? isWishlisted(product.id) : false;

  const biddingEnabled = !!(
    product?.bidding_enabled === true  ||
    product?.bidding_enabled === 1     ||
    product?.bidding_enabled === "1"
  );

  const isOwnListing = !!(user?.id && product?.user_id && user.id === product.user_id);

  if (!product) {
    return (
      <SafeAreaView style={s.errorWrap}>
        <MaterialIcons name="error-outline" size={56} color="#ccc" />
        <Text style={s.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.goBackBtn}>
          <Text style={{ color: BLUE, fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images      = resolveImages(product);
  const priceText   = formatPrice(product.price);
  const addressText =
    formatLocationAddress(product) ||
    product.address ||
    product.location ||
    product.city || "";

  const handleShare = async () => {
    try {
      await shareListing(product, priceText, addressText);
    } catch {
      Toast.show({ type: "error", text1: "Share Failed", text2: "Could not share this product.", position: "top", visibilityTime: 3000, topOffset: 60 });
    }
  };

  const handleWishlistPress = () => {
    if (!user?.id) {
      Toast.show({ type: "error", text1: "Login Required", text2: "Please log in to save items.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    toggleWishlist(product, wishlisted);
  };

  const handleChatPress = async () => {
    if (!user?.id) {
      Toast.show({ type: "error", text1: "Login Required", text2: "Please log in to chat with the seller.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    if (isOwnListing) {
      Toast.show({ type: "error", text1: "Action Failed", text2: "You cannot chat on your own listing.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    try {
      setChatLoading(true);
      const conversation = await startConversationService({
        listing_id: product.id,
        seller_id:  product.user_id,
      });
      const conversationId = conversation?.id ?? conversation?.conversation_id;
      if (!conversationId) throw new Error("No conversation ID returned");
      navigation.navigate("Chat", {
        conversationId,
        currentUserId:  user.id,
        otherUserName:  product.seller?.name   || product.seller_name  || "Seller",
        otherUserImage: product.seller?.avatar || product.seller_avatar || null,
        listingTitle:   product.title || "",
      });
    } catch {
      Toast.show({ type: "error", text1: "Action Failed", text2: "Could not start conversation. Please try again.", position: "top", visibilityTime: 3000, topOffset: 60 });
    } finally {
      setChatLoading(false);
    }
  };

  const handleBidPress = () => {
    if (!user?.id) {
      Toast.show({ type: "error", text1: "Login Required", text2: "Please log in to place a bid.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    if (isOwnListing) {
      Toast.show({ type: "error", text1: "Not allowed", text2: "You cannot bid on your own listing.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return;
    }
    setBidModalOpen(true);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleWishlistPress} disabled={isToggling} activeOpacity={0.7}>
            {isToggling
              ? <ActivityIndicator size="small" color="red" />
              : <Ionicons name={wishlisted ? "heart" : "heart-outline"} size={22} color={wishlisted ? "red" : DARK} />
            }
          </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => {}} activeOpacity={0.7}>
    <Ionicons name="navigate-outline" size={22} color={DARK} />
  </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScroll={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
          scrollEventThrottle={16}
        >
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={s.image} resizeMode="contain" />
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={s.dots}>
            {images.map((_, i) => (
              <View key={i} style={[s.dot, activeImage === i && s.dotActive]} />
            ))}
          </View>
        )}

        {isLoading && (
          <View style={s.loadingBar}>
            <ActivityIndicator size="small" color={BLUE} />
            <Text style={s.loadingText}>Loading details…</Text>
          </View>
        )}

        <View style={s.content}>
          <Text style={s.title}>{product.title || "Untitled"}</Text>

          {priceText
            ? <Text style={s.price}>{priceText}</Text>
            : <Text style={s.priceNA}>Contact for price</Text>
          }

          {biddingEnabled && (
            <View style={s.bidBadge}>
              <View style={s.bidBadgeDot} />
              <Text style={s.bidBadgeText}>Bidding open</Text>
            </View>
          )}

          {!!addressText && (
            <View style={s.row}>
              <Ionicons name="location-outline" size={15} color={GRAY} />
              <Text style={s.metaText}>{addressText}</Text>
            </View>
          )}

          {[product.condition, product.category, product.brand].some(Boolean) && (
            <View style={s.chipsRow}>
              {product.condition && <View style={s.chip}><Text style={s.chipBlue}>{product.condition}</Text></View>}
              {product.category  && <View style={s.chipAlt}><Text style={s.chipGrayText}>{product.category}</Text></View>}
              {product.brand     && <View style={s.chipAlt}><Text style={s.chipGrayText}>{product.brand}</Text></View>}
            </View>
          )}

          {product.description ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.description} numberOfLines={descExpanded ? undefined : 4}>
                {product.description}
              </Text>
              <TouchableOpacity style={s.readMore} onPress={() => setDescExpanded(v => !v)}>
                <Text style={s.readMoreText}>{descExpanded ? "Show less" : "Read more"}</Text>
                <Ionicons name={descExpanded ? "chevron-up" : "chevron-down"} size={16} color={BLUE} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Seller Info</Text>
            <View style={s.sellerCard}>
              {product.seller?.avatar ? (
                <Image source={{ uri: product.seller.avatar }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, { backgroundColor: "#e8e8f0", alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="person" size={24} color="#aaa" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.sellerName}>{product.seller?.name || product.seller_name || "Seller"}</Text>
                {(product.seller?.phone || product.seller_phone) ? (
                  <Text style={s.sellerPhone}>{product.seller?.phone || product.seller_phone}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar — sirf tab dikhao jab user apna listing na dekh raha ho */}
      {!isOwnListing && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[
              s.chatBtn,
              biddingEnabled ? s.btnHalf : s.btnFull,
              chatLoading && s.chatBtnDisabled,
            ]}
            onPress={handleChatPress}
            disabled={chatLoading}
            activeOpacity={0.85}
          >
            {chatLoading
              ? <ActivityIndicator size="small" color={BLUE} />
              : <Ionicons name="chatbubble-outline" size={18} color={BLUE} />
            }
            <Text style={s.chatBtnText}>
              {chatLoading ? "Opening chat…" : "Chat with Seller"}
            </Text>
          </TouchableOpacity>

          {biddingEnabled && (
            <TouchableOpacity style={[s.bidBtn, s.btnHalf]} onPress={handleBidPress} activeOpacity={0.85}>
              <Ionicons name="hammer-outline" size={18} color={WHITE} />
              <Text style={s.bidBtnText}>Place Bid</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {biddingEnabled && (
        <BidModal
          visible={bidModalOpen}
          onClose={() => setBidModalOpen(false)}
          product={product}
          currentUser={user}
        />
      )}
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: WHITE },
  errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: GRAY },
  goBackBtn: { marginTop: 8, padding: 12 },
// To this:
topBar: {
  position: "absolute", top: 44, left: 0, right: 0,
  flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  paddingHorizontal: 12, paddingVertical: 10, zIndex: 10,
},
topRight: { flexDirection: "column", gap: 6 },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, padding: 8,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  scroll:    { paddingBottom: 20 },
  image:     { width, height: 400 },
  dots:      { flexDirection: "row", justifyContent: "center", marginTop: 10, gap: 6 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: "#D1D5DB" },
  dotActive: { backgroundColor: BLUE, width: 20 },
  loadingBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 8, backgroundColor: "#EFF6FF",
  },
  loadingText: { fontSize: 12, color: BLUE },
  content:  { padding: 16, gap: 4 },
  title:    { fontSize: 20, fontWeight: "700", color: DARK, lineHeight: 28, marginTop: 8 },
  price:    { fontSize: 24, fontWeight: "800", color: BLUE, marginTop: 4 },
  priceNA:  { fontSize: 15, color: GRAY, marginTop: 4 },
  bidBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
    alignSelf: "flex-start", backgroundColor: "#ecfdf5",
    borderWidth: 1, borderColor: "#6ee7b7", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  bidBadgeDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: BID_GREEN },
  bidBadgeText: { fontSize: 12, fontWeight: "600", color: BID_GREEN },
  row:          { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metaText:     { fontSize: 13, color: GRAY },
  chipsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip:         { backgroundColor: "#EFF6FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipAlt:      { backgroundColor: LIGHT, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipBlue:     { fontSize: 12, color: BLUE, fontWeight: "600" },
  chipGrayText: { fontSize: 12, color: GRAY, fontWeight: "600" },
  section:      { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 8 },
  description:  { fontSize: 14, color: "#4B5563", lineHeight: 22 },
  readMore:     { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 2 },
  readMoreText: { fontSize: 13, fontWeight: "700", color: BLUE },
  sellerCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: LIGHT, borderRadius: 12, padding: 12, gap: 12,
  },
  avatar:      { width: 48, height: 48, borderRadius: 24 },
  sellerName:  { fontSize: 15, fontWeight: "600", color: DARK },
  sellerPhone: { fontSize: 13, color: GRAY, marginTop: 2 },
  bottomBar: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: WHITE, borderTopWidth: 0.5, borderTopColor: "#E5E7EB",
    gap: 10, marginBottom: 70,
  },
  btnFull: { flex: 1 },
  btnHalf: { flex: 1 },
  chatBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: BLUE, borderRadius: 12, paddingVertical: 13,
  },
  chatBtnDisabled: { borderColor: "#B0C4FF", opacity: 0.7 },
  chatBtnText:     { fontSize: 14, fontWeight: "700", color: BLUE },
  bidBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: BID_GREEN, borderRadius: 12, paddingVertical: 13,
  },
  bidBtnText: { fontSize: 14, fontWeight: "700", color: WHITE },
});

const bm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, maxHeight: "90%",
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: DARK },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#f4f4f8", alignItems: "center", justifyContent: "center",
  },
  topBid: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#6ee7b7",
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  topBidDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: BID_GREEN },
  topBidLabel:  { fontSize: 10, color: BID_GREEN, fontWeight: "700", textTransform: "uppercase" },
  topBidName:   { fontSize: 14, fontWeight: "700", color: DARK },
  topBidAmount: { marginLeft: "auto", fontSize: 18, fontWeight: "800", color: BID_GREEN },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#aaa",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },
  bidList:  { marginBottom: 12 },
  bidRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f8",
  },
  bidAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#e8eeff", alignItems: "center", justifyContent: "center",
  },
  bidAvatarText: { fontSize: 14, fontWeight: "700", color: BLUE },
  bidderName:    { flex: 1, fontSize: 14, color: DARK, fontWeight: "500" },
  bidAmount:     { fontSize: 14, fontWeight: "700", color: BID_GREEN },
  noBids: { textAlign: "center", color: "#aaa", fontSize: 13, marginVertical: 16 },
  divider: { height: 1, backgroundColor: "#f0f0f8", marginVertical: 16 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#000", marginBottom: 6 },
  optional:   { fontWeight: "400", color: "#bbb" },
  input: {
    backgroundColor: "#f8f9fb", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: DARK,
    borderWidth: 1, borderColor: "#ebebf5", marginBottom: 12,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: BID_GREEN, borderRadius: 14,
    paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 20,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});