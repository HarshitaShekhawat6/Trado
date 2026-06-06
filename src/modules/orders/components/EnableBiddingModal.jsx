// orders/components/EnableBiddingModal.jsx

import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import Ionicons      from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import C             from "../constants/colors";
import apiClient     from "../../../api/client";
import Toast from "react-native-toast-message"; 

import { ENDPOINTS } from "../../../api/endpoints";


const EnableBiddingModal = ({ visible, item, onClose, onEnabled }) => {

  const [step,       setStep]       = useState("loading");
  const [fees,       setFees]       = useState(null);   // null = not loaded yet
  const [errMsg,     setErrMsg]     = useState("");

  useEffect(() => {
    if (!visible || !item) return;
    setStep("loading");
    setErrMsg("");

    apiClient.get(`${ENDPOINTS.PAYMENTS}/fees`)
      .then((res) => {
        if (!res.data?.success) throw new Error("Fee fetch failed");
        setFees({
          bid_fee:      res.data.bid_fee,
          listing_fee:  res.data.listing_fee,
          listing_with_bidding: res.data.listing_with_bidding,
        });
        setStep("confirm");
      })
      .catch(() => {
        // If API fails — show error, don't fallback to hardcoded value
        setErrMsg("Could not load pricing. Please try again.");
        setStep("error");
      });
  }, [visible, item]);

  const handlePay = async () => {
    setStep("paying");
    setErrMsg("");
    try {
      await apiClient.post(`${ENDPOINTS.PAYMENTS}/enable-bidding`, {
        listing_id: item.id,
      });
      onEnabled && onEnabled(item);
      setStep("success");
      Toast.show({
        type: "success", text1: "Bidding Enabled!",
        text2: `Buyers can now place bids on "${item.title}".`,
        position: "top", visibilityTime: 2500, topOffset: 60,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong.";
      setErrMsg(msg);
      setStep("confirm");
      Toast.show({
        type: "error", text1: "Payment Failed", text2: msg,
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    }
  };

  const handleClose = () => {
    setStep("loading");
    setFees(null);
    setErrMsg("");
    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* Loading */}
          {step === "loading" && (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.stateSubtitle}>Fetching pricing…</Text>
            </View>
          )}

          {/* Error loading fees */}
          {step === "error" && (
            <View style={s.centerState}>
              <MaterialIcons name="error-outline" size={48} color="#dc2626" />
              <Text style={s.stateTitle}>Couldn't load pricing</Text>
              <Text style={s.stateSubtitle}>{errMsg}</Text>
              <TouchableOpacity style={s.payBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={s.payBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Confirm */}
          {step === "confirm" && fees && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name="hammer" size={32} color="#059669" />
              </View>
              <Text style={s.title}>Enable Bidding</Text>
              <Text style={s.subtitle}>
                Allow buyers to place bids on{"\n"}
                <Text style={s.itemTitle}>"{item.title}"</Text>
              </Text>

              <View style={s.feeBox}>
                <View style={s.feeRow}>
                  <Text style={s.feeLabel}>Bidding activation fee</Text>
                  <Text style={s.feeValue}>₹{fees.bid_fee}</Text>
                </View>
                <View style={s.feeDivider} />
                <View style={s.feeRow}>
                  <Text style={[s.feeLabel, { fontWeight: "700", color: C.onSurface }]}>Total</Text>
                  <Text style={[s.feeValue, { fontSize: 20, color: C.primary }]}>₹{fees.bid_fee}</Text>
                </View>
              </View>

              <View style={s.benefitsWrap}>
                {[
                  "Buyers can place competitive bids",
                  "You choose the winning bid",
                  "Bidding active until listing expires",
                ].map((b) => (
                  <View style={s.benefitRow} key={b}>
                    <MaterialIcons name="check-circle" size={14} color="#059669" />
                    <Text style={s.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>

              {!!errMsg && (
                <View style={s.errorBox}>
                  <MaterialIcons name="error-outline" size={14} color="#dc2626" />
                  <Text style={s.errorText}>{errMsg}</Text>
                </View>
              )}

              <TouchableOpacity style={s.payBtn} onPress={handlePay} activeOpacity={0.85}>
                <MaterialIcons name="payment" size={18} color="#fff" />
                <Text style={s.payBtnText}>Pay ₹{fees.bid_fee} & Enable</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Paying */}
          {step === "paying" && (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.stateTitle}>Processing…</Text>
              <Text style={s.stateSubtitle}>Please wait a moment</Text>
            </View>
          )}

          {/* Success */}
          {step === "success" && (
            <View style={s.centerState}>
              <View style={s.successIconWrap}>
                <MaterialIcons name="check-circle" size={56} color="#059669" />
              </View>
              <Text style={s.stateTitle}>Bidding Enabled!</Text>
              <Text style={s.stateSubtitle}>Buyers can now place bids on your listing.</Text>
              <TouchableOpacity style={s.payBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={s.payBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

export default EnableBiddingModal;

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
  },
  card: {
    backgroundColor: C.surface, borderRadius: 24, padding: 24, width: "100%",
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.15,
    shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: "#ecfdf5",
    alignSelf: "center", alignItems: "center", justifyContent: "center",
    marginBottom: 16, borderWidth: 2, borderColor: "#86efac",
  },
  title:    { fontSize: 20, fontWeight: "800", color: C.onSurface, textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, color: C.onSurfaceVariant, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  itemTitle:{ fontWeight: "700", color: C.onSurface },
  feeBox: {
    backgroundColor: C.surfaceContainerLow, borderRadius: 14,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: `${C.outline}20`,
  },
  feeRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel:   { fontSize: 13, color: C.onSurfaceVariant, fontWeight: "500" },
  feeValue:   { fontSize: 15, fontWeight: "700", color: C.onSurface },
  feeDivider: { height: 1, backgroundColor: `${C.outline}25`, marginVertical: 10 },
  benefitsWrap: { gap: 8, marginBottom: 20 },
  benefitRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText:  { fontSize: 12, color: C.onSurfaceVariant, flex: 1 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fef2f2", borderRadius: 10,
    borderWidth: 1, borderColor: "#fecaca",
    padding: 10, marginBottom: 14,
  },
  errorText: { fontSize: 12, color: "#dc2626", flex: 1, fontWeight: "600" },
  payBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    elevation: 4, shadowColor: C.primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, marginBottom: 10,
  },
  payBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  cancelBtn:     { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, color: C.onSurfaceVariant, fontWeight: "600" },
  centerState:     { alignItems: "center", paddingVertical: 24, gap: 10 },
  successIconWrap: { marginBottom: 4 },
  stateTitle:    { fontSize: 18, fontWeight: "800", color: C.onSurface, textAlign: "center" },
  stateSubtitle: { fontSize: 13, color: C.onSurfaceVariant, textAlign: "center", marginBottom: 8 },
});