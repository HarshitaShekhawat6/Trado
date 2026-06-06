// chat/screens/ChatScreen.js

import React          from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons    from "react-native-vector-icons/MaterialIcons";
import useChat          from "../hooks/useChat";

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");


const ChatScreen = ({ navigation, route }) => {

  const {
    conversationId,
    currentUserId,
    otherUserName  = "User",
    otherUserImage = null,
    listingTitle   = "",
  } = route.params;

  const {
    messages, inputText, loading,
    sending, isTyping, flatListRef,
    handleTyping, sendMessage,
  } = useChat({ conversationId, currentUserId });

  // ── Message bubble ─────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }) => {
    const isMine    = item.sender_id === currentUserId;
    const prev      = messages[index - 1];
    const showAvatar = !isMine && (!prev || prev.sender_id !== item.sender_id);
    const isTemp    = String(item.id).startsWith("temp_");

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>

        {/* Other user avatar */}
        {!isMine && (
          <View style={styles.avatarSlot}>
            {showAvatar ? (
              otherUserImage ? (
                <Image source={{ uri: otherUserImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{getInitial(otherUserName)}</Text>
                </View>
              )
            ) : null}
          </View>
        )}

        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={isMine ? styles.textMine : styles.textOther}>{item.text}</Text>
          <View style={styles.metaRow}>
            <Text style={isMine ? styles.timeMine : styles.timeOther}>
              {formatTime(item.created_at)}
            </Text>
            {isMine && (
              isTemp
                ? <ActivityIndicator size={10} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
                : <Text style={styles.tick}>{item.is_read ? " ✓✓" : " ✓"}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

return (
  <SafeAreaView style={styles.container} edges={["top"]}>

    {/* ── Header — KeyboardAvoidingView ke BAHAR ── */}
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="arrow-back" size={22} color="#191b24" />
      </TouchableOpacity>

      {otherUserImage ? (
        <Image source={{ uri: otherUserImage }} style={styles.headerAvatar} />
      ) : (
        <View style={styles.headerAvatarFallback}>
          <Text style={styles.headerAvatarInitial}>{getInitial(otherUserName)}</Text>
        </View>
      )}

      <View style={styles.headerInfo}>
        <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
        {!!listingTitle && (
          <Text style={styles.headerListing} numberOfLines={1}>📦 {listingTitle}</Text>
        )}
      </View>
    </View>

    {/* ── KeyboardAvoidingView sirf messages + input ke liye ── */}
  <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}  // "height" Android pe
  keyboardVerticalOffset={0}
>
  {loading ? (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0040e0" />
    </View>
  ) : (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderMessage}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      // ✅ ListFooterComponent hatao yahan se
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <MaterialIcons name="chat-bubble-outline" size={48} color="#c4c5d9" />
          <Text style={styles.emptyText}>Say hi to start the conversation!</Text>
        </View>
      }
    />
  )}

  {/* ✅ Typing indicator — FlatList ke baad, input se pehle — always yahi rahega */}
  {isTyping && (
    <View style={styles.typingWrap}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>typing…</Text>
      </View>
    </View>
  )}

      {/* Input bar — keyboard ke saath upar uthega, header nahi */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor="#aaa"
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnOff]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f4fb" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4f0",
    gap: 10,

  zIndex: 999,
  elevation: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f2ff",
    alignItems: "center", justifyContent: "center",
  },
  headerAvatar:         { width: 40, height: 40, borderRadius: 20 },
  headerAvatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#0040e0",
    alignItems: "center", justifyContent: "center",
  },
  headerAvatarInitial: { color: "#fff", fontWeight: "800", fontSize: 16 },
  headerInfo:          { flex: 1 },
  headerName:          { fontSize: 16, fontWeight: "700", color: "#191b24" },
  headerListing:       { fontSize: 11, color: "#0040e0", marginTop: 1, fontWeight: "600" },

  // List
  list: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 },

  // Message row
  msgRow:      { flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  msgRowRight: { justifyContent: "flex-end" },
  msgRowLeft:  { justifyContent: "flex-start" },

  // Avatar
  avatarSlot:    { width: 32, marginRight: 6 },
  avatar:        { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0040e0",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Bubbles
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: {
    backgroundColor: "#0040e0",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  textMine:  { color: "#fff",     fontSize: 15, lineHeight: 21 },
  textOther: { color: "#191b24",  fontSize: 15, lineHeight: 21 },
  metaRow:   { flexDirection: "row", alignItems: "center", marginTop: 3, justifyContent: "flex-end" },
  timeMine:  { color: "rgba(255,255,255,0.65)", fontSize: 10 },
  timeOther: { color: "#9898b8",  fontSize: 10 },
  tick:      { color: "rgba(255,255,255,0.65)", fontSize: 10, marginLeft: 2 },

  // Typing
  typingWrap:   { paddingHorizontal: 12, paddingBottom: 4 },
  typingBubble: {
    backgroundColor: "#fff", alignSelf: "flex-start",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 18, borderBottomLeftRadius: 4,
  },
  typingText: { color: "#747688", fontSize: 13, fontStyle: "italic" },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: "#9898b8", textAlign: "center" },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 0.5, borderTopColor: "#e4e4f0",
    gap: 8,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120,
    backgroundColor: "#f3f2ff", borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 11 : 8,
    fontSize: 15, color: "#191b24",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#0040e0",
    alignItems: "center", justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: "#b0bef7" },
});

export default ChatScreen;

