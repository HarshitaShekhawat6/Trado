// chat/screens/InboxScreen.js

import React          from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons    from "react-native-vector-icons/MaterialIcons";
import useInbox         from "../hooks/useInbox";
import { useAuth }      from "../../../navigation/AuthContext"; 

const formatTime = (iso) => {
  if (!iso) return "";
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now - d;

  if (diff < 60000)            return "Just now";
  if (diff < 3600000)          return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000)         return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 86400000 * 7)     return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString();
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const InboxScreen = ({ navigation }) => {
  const { conversations, loading, refreshing, onRefresh } = useInbox();
  const { user } = useAuth(); // ← fixed: get user from AuthContext
  const currentUserId = user?.id; // ← fixed: user.id instead of s.auth.userId

  const handleOpen = (conv) => {
    const iAmBuyer     = conv.buyer_id === currentUserId;
    const otherName    = iAmBuyer ? conv.seller_name  : conv.buyer_name;
    const otherImage   = iAmBuyer ? conv.seller_image : conv.buyer_image;

    navigation.navigate("Chat", {
      conversationId: conv.conversation_id,
      currentUserId,
      otherUserName:  otherName,
      otherUserImage: otherImage,
      listingTitle:   conv.listing_title,
    });
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#c4c5d9" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySub}>
        When you message a seller, it'll appear here.
      </Text>
    </View>
  );

  // ── Conversation row ───────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const iAmBuyer   = item.buyer_id === currentUserId;
    const otherName  = iAmBuyer ? item.seller_name  : item.buyer_name;
    const otherImage = iAmBuyer ? item.seller_image : item.buyer_image;
    const hasUnread  = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleOpen(item)}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {otherImage ? (
            <Image source={{ uri: otherImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{getInitial(otherName)}</Text>
            </View>
          )}
          {hasUnread && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
              {otherName || "User"}
            </Text>
            <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
          </View>

          <Text style={styles.listingTag} numberOfLines={1}>
            📦 {item.listing_title}
          </Text>

          <View style={styles.rowBottom}>
            <Text
              style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
              numberOfLines={1}
            >
              {item.last_message || "No messages yet"}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unread_count > 99 ? "99+" : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0040e0" />
        </View>
      ) : (
        <FlatList
          data={conversations}
keyExtractor={(item, i) => `conv-${item.conversation_id}-${i}`}          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={conversations.length === 0 && styles.emptyContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0040e0"]}
              tintColor="#0040e0"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fbf8ff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#191b24",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  separator: {
    height: 0.5,
    backgroundColor: "#f0f0f8",
    marginLeft: 76,
  },

  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0040e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },

  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: "#191b24",
    flex: 1,
    marginRight: 8,
  },
  nameBold: {
    fontWeight: "800",
  },
  time: {
    fontSize: 11,
    color: "#9898b8",
  },
  listingTag: {
    fontSize: 11,
    color: "#0040e0",
    fontWeight: "600",
    marginBottom: 3,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMsg: {
    fontSize: 13,
    color: "#747688",
    flex: 1,
    marginRight: 8,
  },
  lastMsgBold: {
    color: "#191b24",
    fontWeight: "600",
  },

  badge: {
    backgroundColor: "#0040e0",
    borderRadius: 99,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#434656",
  },
  emptySub: {
    fontSize: 13,
    color: "#9898b8",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 19,
  },
});

export default InboxScreen;

