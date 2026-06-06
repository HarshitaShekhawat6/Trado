// modules/listings/components/BidModal.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";

import { getBidsForBuyer, placeBid } from "../services/bidService";
import { useBidSocket } from "../hooks/useBidSocket";

const { height: SCREEN_H } = Dimensions.get("window");
const BLUE  = "#0040e0";
const DARK  = "#111827";
const GRAY  = "#6B7280";
const LIGHT = "#F3F4F6";
const WHITE = "#FFFFFF";
const GREEN = "#16a34a";
const GOLD  = "#d97706";

const formatINR = (val) => {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? "—" : `₹ ${n.toLocaleString("en-IN")}`;
};

const HighestBidBanner = ({ bid }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  if (!bid) return null;

  return (
    <Animated.View style={[bs.topBidCard, { transform: [{ scale: pulse }] }]}>
      <View style={bs.topBidLeft}>
        <MaterialIcons name="emoji-events" size={20} color={GOLD} />
        <Text style={bs.topBidLabel}>Highest Bid</Text>
      </View>
      <View style={bs.topBidRight}>
        <Text style={bs.topBidName}>{bid.bidder_name}</Text>
        <Text style={bs.topBidAmount}>{formatINR(bid.amount)}</Text>
      </View>
    </Animated.View>
  );
};

const BidRow = ({ bid, isHighest, isNew }) => {
  const fadeIn = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [fadeIn, isNew]);

  return (
    <Animated.View style={[bs.bidRow, isHighest && bs.bidRowHighest, { opacity: fadeIn }]}>
      <View style={bs.bidAvatar}>
        <Text style={bs.bidAvatarText}>
          {(bid.bidder_name || "?")[0].toUpperCase()}
        </Text>
      </View>
      <Text style={bs.bidRowName} numberOfLines={1}>
        {bid.bidder_name}
      </Text>
      {isHighest && (
        <View style={bs.leadBadge}>
          <Text style={bs.leadBadgeText}>Leading</Text>
        </View>
      )}
      <Text style={bs.bidRowAmount}>{formatINR(bid.amount)}</Text>
    </Animated.View>
  );
};

const BidModal = ({ visible, onClose, product, currentUser }) => {
  const [bids, setBids]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newBidIds, setNewBidIds]   = useState(new Set());

  const [name, setName]             = useState(currentUser?.name || "");
  const [note, setNote]             = useState("");
  const [amount, setAmount]         = useState("");
  const [amountError, setAmountError] = useState("");

  const scrollRef = useRef(null);

  const highestBid = bids.length > 0
    ? bids.reduce((max, b) =>
        parseFloat(b.amount) > parseFloat(max.amount) ? b : max, bids[0])
    : null;

  const fetchBids = useCallback(async () => {
    if (!product?.id) return;
    try {
      setLoading(true);
      const data = await getBidsForBuyer(product.id);
      setBids(data || []);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  useEffect(() => {
    if (visible) {
      fetchBids();
      if (currentUser?.name) setName(currentUser.name);
    } else {
      setAmount("");
      setNote("");
      setAmountError("");
      setNewBidIds(new Set());
    }
  }, [visible, fetchBids, currentUser?.name]);

  const handleIncomingBid = useCallback((incomingBid) => {
    setBids((prev) => {
      const exists = prev.some((b) => b.id === incomingBid.id);
      if (exists) return prev;
      setNewBidIds((ids) => new Set([...ids, incomingBid.id]));
      return [incomingBid, ...prev].sort(
        (a, b) => parseFloat(b.amount) - parseFloat(a.amount)
      );
    });
  }, []);

  useBidSocket({
    productId: product?.id,
    enabled: visible && !!product?.id,
    onNewBid: handleIncomingBid,
  });

  const validateAmount = (raw) => {
    const val = parseFloat(raw);
    if (!raw || isNaN(val) || val <= 0) {
      setAmountError("Please enter a valid amount.");
      return false;
    }
    if (highestBid && val <= parseFloat(highestBid.amount)) {
      setAmountError(
        `Your bid must be higher than the current top bid of ${formatINR(highestBid.amount)}.`
      );
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleSubmit = async () => {
  if (!name.trim()) {
    Toast.show({ type: "error", text1: "Name required", text2: "Please enter your name to place a bid.", visibilityTime: 3000 });
    return;
  }
  if (!validateAmount(amount)) return;

  try {
    setSubmitting(true);

    const payload = {
      product_id:     product.id,
      bidder_name:    name.trim(),
      amount:         parseFloat(amount),
      note:           note.trim() || null,
      bidder_user_id: currentUser?.id || null,
    };

    const saved = await placeBid(payload);  // ← pehle API call

    // ── Sirf ek baar reset ──
    setBids((prev) =>
      [{ id: saved.id, bidder_name: payload.bidder_name, amount: payload.amount, created_at: new Date().toISOString() }, ...prev]
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    );
    setAmount("");
    setNote("");
    setAmountError("");

    Toast.show({
      type: "success",
      text1: "🎉 Bid Placed!",
      text2: `Your bid of ${formatINR(payload.amount)} placed successfully.`,
      visibilityTime: 2000,
    });
    setTimeout(() => onClose(), 2000);

  } catch (err) {
    Toast.show({
      type: "error",
      text1: "Could not place bid",
      text2: err?.response?.data?.message || "Please try again.",
      visibilityTime: 3000,
    });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={bs.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={bs.sheet}
      >
        <View style={bs.handle} />

        <View style={bs.header}>
          <View>
            <Text style={bs.headerTitle}>Place a Bid</Text>
            <Text style={bs.headerSub} numberOfLines={1}>
              {product?.title || ""}
            </Text>
          </View>
          <TouchableOpacity style={bs.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={bs.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator size="small" color={BLUE} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <HighestBidBanner bid={highestBid} />

              {bids.length === 0 ? (
                <View style={bs.emptyState}>
                  <Ionicons name="hammer-outline" size={36} color="#d1d5db" />
                  <Text style={bs.emptyText}>No bids yet. Be the first!</Text>
                </View>
              ) : (
                <View style={bs.bidList}>
                  <Text style={bs.listHeading}>All Bids ({bids.length})</Text>
                  {bids.map((bid, idx) => (
                    <BidRow
                      key={bid.id ?? idx}
                      bid={bid}
                      isHighest={idx === 0}
                      isNew={newBidIds.has(bid.id)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={bs.divider} />

          <View style={bs.form}>
            <Text style={bs.formTitle}>Your Bid</Text>

            <Text style={bs.fieldLabel}>YOUR NAME *</Text>
            <TextInput
              style={bs.input}
              placeholder="Full name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              autoCapitalize="words"
            />

            <Text style={bs.fieldLabel}>
              MESSAGE TO SELLER{" "}
              <Text style={bs.optional}>(optional · private)</Text>
            </Text>
            <TextInput
              style={[bs.input, bs.inputMulti]}
              placeholder="Why you want this item, offer details…"
              placeholderTextColor="#aaa"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <Text style={bs.noteHint}>
              <Ionicons name="lock-closed-outline" size={11} color={GRAY} />
              {" "}Only the seller can see this message.
            </Text>

            <Text style={bs.fieldLabel}>BID AMOUNT *</Text>
            <View style={[bs.amountRow, !!amountError && bs.amountRowError]}>
              <Text style={bs.rupee}>₹</Text>
              <TextInput
                style={bs.amountInput}
                placeholder={highestBid ? `More than ${formatINR(highestBid.amount)}` : "0.00"}
                placeholderTextColor="#aaa"
                value={amount}
                onChangeText={(v) => {
                  setAmount(v);
                  if (amountError) validateAmount(v);
                }}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            {!!amountError && <Text style={bs.amountError}>{amountError}</Text>}

            <TouchableOpacity
              style={[bs.submitBtn, submitting && bs.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Ionicons name="hammer-outline" size={17} color={WHITE} />
                  <Text style={bs.submitBtnText}>Place Bid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BidModal;

const bs = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.88,
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: DARK },
  headerSub:   { fontSize: 12, color: GRAY, marginTop: 2, maxWidth: 260 },
  closeBtn: {
    backgroundColor: LIGHT,
    borderRadius: 16,
    padding: 6,
    marginTop: 2,
  },
  topBidCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#fcd34d",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBidLeft:   { flexDirection: "row", alignItems: "center", gap: 6 },
  topBidLabel:  { fontSize: 12, fontWeight: "600", color: GOLD },
  topBidRight:  { alignItems: "flex-end" },
  topBidName:   { fontSize: 13, fontWeight: "600", color: DARK },
  topBidAmount: { fontSize: 20, fontWeight: "800", color: GOLD },
  bidList:      { paddingHorizontal: 16 },
  listHeading: {
    fontSize: 12,
    fontWeight: "600",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bidRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 10,
  },
  bidRowHighest: { backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 8 },
  bidAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  bidAvatarText: { fontSize: 13, fontWeight: "700", color: BLUE },
  bidRowName:    { flex: 1, fontSize: 14, fontWeight: "500", color: DARK },
  bidRowAmount:  { fontSize: 14, fontWeight: "700", color: DARK },
  leadBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leadBadgeText: { fontSize: 10, fontWeight: "700", color: GREEN },
  emptyState:    { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText:     { fontSize: 14, color: GRAY },
  divider: {
    height: 8,
    backgroundColor: "#f8fafc",
    marginVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  form:      { paddingHorizontal: 16 },
  formTitle: { fontSize: 15, fontWeight: "700", color: DARK, marginBottom: 14 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: GRAY,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  optional: { fontWeight: "400", textTransform: "none", letterSpacing: 0 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: DARK,
    backgroundColor: WHITE,
  },
  inputMulti:  { height: 80, textAlignVertical: "top", paddingTop: 10 },
  noteHint:    { fontSize: 11, color: GRAY, marginTop: 5, lineHeight: 16 },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: WHITE,
    paddingLeft: 14,
    overflow: "hidden",
  },
  amountRowError: { borderColor: "#ef4444" },
  rupee:          { fontSize: 16, fontWeight: "700", color: DARK, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
    paddingVertical: 11,
    paddingRight: 14,
  },
  amountError: { fontSize: 12, color: "#ef4444", marginTop: 5, lineHeight: 16 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { fontSize: 15, fontWeight: "700", color: WHITE },
});