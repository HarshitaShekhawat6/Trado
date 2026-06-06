import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, Pressable, TouchableOpacity,
  Modal, Animated, StyleSheet, ActivityIndicator,
} from "react-native";
import C          from "../constants/colors";
import apiClient  from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";
import Toast      from "react-native-toast-message";

const RepostSheet = ({ visible, product, onClose, onReposted }) => {
  const [selected,  setSelected]  = useState("single");
  const [fees,      setFees]      = useState(null);   // loaded from API
  const [paying,    setPaying]    = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current;

  // ── Animate in/out ────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 60, friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Load fees from API when sheet opens ───────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setFees(null);
    apiClient.get(`${ENDPOINTS.PAYMENTS}/fees`)
      .then((res) => {
        if (!res.data?.success) throw new Error();
        setFees({
          single: res.data.repost_single_fee,
          pro:    res.data.repost_pro_fee,
        });
      })
      .catch(() => {
        Toast.show({
          type: "error", text1: "Couldn't load pricing",
          text2: "Please close and try again.",
          position: "top", topOffset: 60,
        });
      });
  }, [visible]);

  // ── Pay & Repost ──────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!fees) return;
    setPaying(true);
    try {
      await apiClient.post(`${ENDPOINTS.PAYMENTS}/repost`, {
        listing_id: product.id,
        plan:       selected,           // "single" | "pro"
      });
      onReposted && onReposted(product);
      onClose();
      Toast.show({
        type: "success", text1: "Listing Reposted!",
        text2: `"${product.title}" is now active again.`,
        position: "top", visibilityTime: 2500, topOffset: 60,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || "Payment failed. Try again.";
      Toast.show({
        type: "error", text1: "Repost Failed", text2: msg,
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } finally {
      setPaying(false);
    }
  };

  const selectedFee = fees ? fees[selected] : null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        <View style={s.handle} />
        <Text style={s.title}>Repost Listing</Text>
        <Text style={s.subtitle}>
          Boost your item's visibility by reposting it.{"\n"}Choose a plan below.
        </Text>

        {/* Loading fees */}
        {!fees && (
          <View style={s.feeLoading}>
            <ActivityIndicator color={C.primary} />
            <Text style={s.feeLoadingText}>Loading pricing…</Text>
          </View>
        )}

        {/* Plans — shown only after fees load */}
        {fees && (
          <>
            {/* Single Boost */}
            <Pressable
              style={[s.planRow, selected === "single" && s.planRowActive]}
              onPress={() => setSelected("single")}
            >
              <View style={s.planInfo}>
                <Text style={s.planName}>Single Boost</Text>
                <Text style={s.planNote}>One-time visibility jump</Text>
              </View>
              <Text style={s.planPrice}>₹{fees.single}</Text>
              <View style={[s.radio, selected === "single" && s.radioActive]}>
                {selected === "single" && <View style={s.radioDot} />}
              </View>
            </Pressable>

            {/* Pro Seller */}
            <Pressable
              style={[s.planRow, s.planRowPro, selected === "pro" && s.planRowActive]}
              onPress={() => setSelected("pro")}
            >
              <View style={s.bestBadge}>
                <Text style={s.bestBadgeText}>BEST VALUE</Text>
              </View>
              <View style={s.planInfo}>
                <Text style={[s.planName, { color: C.primary }]}>Pro Seller</Text>
                <Text style={s.planNote}>Unlimited reposts for 30{"\n"}days</Text>
              </View>
              <View style={s.proPriceCol}>
                <Text style={[s.planPrice, { color: C.primary }]}>₹{fees.pro}</Text>
                <Text style={s.perMonth}>PER{"\n"}MONTH</Text>
              </View>
              <View style={[s.radio, selected === "pro" && s.radioActive]}>
                {selected === "pro" && <View style={s.radioDot} />}
              </View>
            </Pressable>

            <TouchableOpacity
              style={[s.payBtn, (!fees || paying) && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handlePay}
              disabled={!fees || paying}
            >
              {paying
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.payBtnText}>
                    Pay ₹{selectedFee} & Repost
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={onClose} style={s.maybeLaterBtn} disabled={paying}>
          <Text style={s.maybeLater}>Maybe Later</Text>
        </TouchableOpacity>

      </Animated.View>
    </Modal>
  );
};

export default RepostSheet;

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
    elevation: 24,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  handle:   { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 9999, alignSelf: "center", marginBottom: 20 },
  title:    { fontSize: 22, fontWeight: "800", color: "#1a1a2e", marginBottom: 6, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: C.outline, lineHeight: 20, marginBottom: 20 },
  feeLoading:     { alignItems: "center", paddingVertical: 24, gap: 8 },
  feeLoadingText: { fontSize: 13, color: C.outline },
  planRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.outlineVariant,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 12, gap: 10,
  },
  planRowPro:    { borderColor: C.primary, backgroundColor: "#eff0fe", position: "relative", paddingTop: 24 },
  planRowActive: { borderColor: C.primary, borderWidth: 2 },
  bestBadge: {
    position: "absolute", top: -1, left: 16,
    backgroundColor: C.primary,
    paddingHorizontal: 10, paddingVertical: 3,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },
  bestBadgeText: { fontSize: 8, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  planInfo:    { flex: 1 },
  planName:    { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginBottom: 2 },
  planNote:    { fontSize: 11, color: C.outline, lineHeight: 16 },
  planPrice:   { fontSize: 22, fontWeight: "800", color: "#1a1a2e" },
  proPriceCol: { alignItems: "flex-end", gap: 1 },
  perMonth:    { fontSize: 9, color: C.outline, fontWeight: "700", letterSpacing: 0.5, textAlign: "right" },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.outline,
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: C.primary },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  payBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
    elevation: 4, shadowColor: C.primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  payBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  maybeLaterBtn: { alignItems: "center", marginTop: 14 },
  maybeLater:    { fontSize: 13, color: C.outline, fontWeight: "600" },
});