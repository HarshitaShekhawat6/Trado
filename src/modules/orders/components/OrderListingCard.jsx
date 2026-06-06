// orders/components/OrderListingCard.jsx

import React from "react";
import {
  View, Text, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons      from "react-native-vector-icons/Ionicons";
import C             from "../constants/colors";
import { BADGE_CONFIG } from "../constants/orderConstants";

const GREEN = "#059669";

const OrderListingCard = ({
  item,
  reposting,
  onRepost,
  onMarkSold,
  onViewBids,
  onEnableBidding,
  onEdit,
}) => {
  const badge   = BADGE_CONFIG[item.status] ?? { ...BADGE_CONFIG.default, label: item.status };
  const expired = item.status === "expired";
  const sold    = item.status === "sold";
const pending = item.status === "pending" || item.status === "active";  const hasBidding = item.bidding_enabled == 1 || item.bidding_enabled === true;

  return (
    <View style={[s.card, expired && s.cardExpired]}>

      {/* ── Image + info row ── */}
      <View style={s.row}>
        <View style={s.imageWrap}>
          <Image
            source={{ uri: item.image }}
            style={[s.thumb, expired && { opacity: 0.75 }]}
            resizeMode="cover"
          />
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={s.info}>

          {/* Title row with edit icon */}
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            {/* Edit icon — only on non-sold listings */}
            {!sold && (
              <TouchableOpacity
                style={s.editIcon}
                onPress={() => onEdit && onEdit(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="edit" size={16} color={C.primary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.category}>{item.category_slug}</Text>

          {/* Bidding pill — "Bidding Open" if active, "Enable Bidding" if not (non-sold only) */}
          {!sold && (
            hasBidding ? (
              /* Already active — just a static pill, no button */
              <View style={s.biddingPill}>
    <View style={s.activeDot} />
    <Text style={s.biddingPillText}>Bidding Open</Text>
  </View>
            ) : (
              /* Not active — tappable pill to enable */
              <TouchableOpacity
                style={s.enableBiddingPill}
                onPress={() => onEnableBidding && onEnableBidding(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="hammer-outline" size={10} color={GREEN} />
                <Text style={s.enableBiddingPillText}>Enable Bidding</Text>
              </TouchableOpacity>
            )
          )}

          <View style={s.bottom}>
            <Text style={s.price}>
              ₹{item.price != null ? Number(item.price).toLocaleString("en-IN") : "—"}
            </Text>
            <Text style={[s.date, expired && { color: C.error }]}>
              {item.daysListed?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Mark as Sold + View Bids ── */}
      {(pending || hasBidding) && (
        <View style={s.actionsRow}>
          {pending && (
            <TouchableOpacity
              style={s.soldBtn}
              activeOpacity={0.85}
              onPress={() => onMarkSold(item)}
            >
              <MaterialIcons name="check-circle-outline" size={18} color={C.primary} />
              <Text style={s.soldBtnText}>Mark as Sold</Text>
            </TouchableOpacity>
          )}
          {hasBidding && (
            <TouchableOpacity
              style={s.viewBidsBtn}
              activeOpacity={0.8}
              onPress={() => onViewBids && onViewBids(item)}
            >
              <Ionicons name="list-outline" size={14} color={GREEN} />
              <Text style={s.viewBidsBtnText}>View Bids</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Repost (expired only) ── */}
      {expired && (
        <TouchableOpacity
          style={s.repostBtn}
          activeOpacity={0.85}
          onPress={() => onRepost(item)}
          disabled={reposting === item.id}
        >
          {reposting === item.id ? (
            <ActivityIndicator size="small" color={C.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="refresh" size={18} color={C.onPrimary} />
              <Text style={s.repostBtnText}>Repost Listing</Text>
            </>
          )}
        </TouchableOpacity>
      )}

    </View>
  );
};

export default OrderListingCard;

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16, padding: 20, marginBottom: 24,
    elevation: 1,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardExpired: { borderWidth: 1, borderColor: `${C.primary}18` },

  row:       { flexDirection: "row", gap: 16 },
  imageWrap: { width: 108, height: 108, borderRadius: 12, overflow: "hidden", flexShrink: 0 },
  thumb:     { width: "100%", height: "100%" },
  badge: {
    position: "absolute", top: 8, left: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999,
  },
  badgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: -0.3 },

  info: { flex: 1, justifyContent: "space-between" },

  /* Title + edit icon on same row */
  titleRow: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", gap: 6,
  },
  title: {
    fontSize: 15, fontWeight: "700", color: C.onSurface,
    lineHeight: 20, flex: 1,
  },
  editIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: `${C.primary}12`,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 0,
  },

  category: {
    fontSize: 10, fontWeight: "600", color: C.onSurfaceVariant,
    textTransform: "uppercase", letterSpacing: 1, marginTop: 2,
  },

  /* Static "Bidding Open" pill */
 biddingPill: {
  flexDirection: "row", alignItems: "center", gap: 4,
  marginTop: 6, alignSelf: "flex-start",
},

/* Green pulsing dot */
activeDot: {
  width: 7, height: 7, borderRadius: 99,
  backgroundColor: GREEN,
},
  biddingPillText: { fontSize: 10, fontWeight: "700", color: GREEN },

  /* Tappable "Enable Bidding" pill */
  enableBiddingPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "#f0fdf4", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#6ee7b7",
    borderStyle: "dashed",
  },
  enableBiddingPillText: { fontSize: 10, fontWeight: "700", color: GREEN },

  bottom: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 6,
  },
  price: { fontSize: 20, fontWeight: "800", color: C.onSurface, letterSpacing: -0.5 },
  date:  { fontSize: 9, fontWeight: "700", color: C.outline, textTransform: "uppercase" },

  /* Actions row */
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" },
  soldBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: C.primary, backgroundColor: `${C.primary}10`,
  },
  soldBtnText: { fontSize: 13, fontWeight: "700", color: C.primary },
  viewBidsBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#86efac",
    borderRadius: 12, paddingVertical: 13,
  },
  viewBidsBtnText: { fontSize: 13, fontWeight: "700", color: GREEN },

  /* Repost */
  repostBtn: {
    marginTop: 14, borderRadius: 12, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, elevation: 4, shadowColor: C.primary,
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  repostBtnText: { fontSize: 13, fontWeight: "700", color: C.onPrimary },
});