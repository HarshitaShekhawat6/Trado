import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import apiClient from "../../../api/client";
import {
  getMessagesService,
  sendMessageService,
} from "../services/chatService";
import Toast from "react-native-toast-message";

const SOCKET_URL = apiClient.defaults.baseURL.replace(/\/$/, "");

const useChat = ({ conversationId, currentUserId }) => {
  const [messages,  setMessages]  = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [isTyping,  setIsTyping]  = useState(false);

  const socketRef      = useRef(null);
  const typingTimerRef = useRef(null);
  const flatListRef    = useRef(null);

  // ── Load history ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getMessagesService(conversationId);
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (err) {
      console.log("[useChat] load error:", err?.response?.data || err.message);
      Toast.show({
        type: "error", text1: "Error",
        text2: "Could not load messages.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    loadMessages();

    const socket = io(SOCKET_URL, {
      transports:        ["websocket"],
      reconnection:      true,
      reconnectionDelay: 2000,
      timeout:           5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] connected, joining room:", conversationId);
      socket.emit("join_room", conversationId);
    });

    socket.on("connect_error", (err) => {
      console.log("[Socket] connect_error:", err.message);
    });

    // ── Real-time message receive ─────────────────────────────────────────
    socket.on("receive_message", (msg) => {
      setMessages((prev) => {
        // Duplicate check — same id already hai
        if (prev.find((m) => m.id === msg.id)) return prev;

        // Apna optimistic temp message replace karo
        const tempIndex = prev.findIndex(
          (m) =>
            String(m.id).startsWith("temp_") &&
            m.sender_id === msg.sender_id &&
            m.text === msg.text
        );
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = msg;
          return updated;
        }

        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });

    socket.on("user_typing",      () => setIsTyping(true));
    socket.on("user_stop_typing", () => setIsTyping(false));

    return () => {
      socket.disconnect();
      clearTimeout(typingTimerRef.current);
    };
  }, [conversationId, currentUserId, loadMessages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id:              tempId,
      conversation_id: conversationId,
      sender_id:       currentUserId,
      text,
      is_read:         0,
      created_at:      new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    flatListRef.current?.scrollToEnd({ animated: true });

    clearTimeout(typingTimerRef.current);
    socketRef.current?.emit("stop_typing", { conversation_id: conversationId });

    setSending(true);
    try {
      // REST API — DB save + server side socket broadcast
      const savedMsg = await sendMessageService({ conversation_id: conversationId, text });

      if (savedMsg?.id) {
        // Optimistic message ko real message se replace karo
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...savedMsg } : m))
        );

        
      }
    } catch (err) {
      console.log("[useChat] send error:", err?.response?.data || err.message);
      // Optimistic message hata do
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(text);
      Toast.show({
        type: "error", text1: "Error",
        text2: "Message could not be sent. Please try again.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId, currentUserId]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = useCallback((text) => {
    setInputText(text);
    if (!socketRef.current?.connected) return;

    socketRef.current.emit("typing", {
      conversation_id: conversationId,
      sender_id:       currentUserId,
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { conversation_id: conversationId });
    }, 2000);
  }, [conversationId, currentUserId]);

  return {
    messages,
    inputText,
    loading,
    sending,
    isTyping,
    flatListRef,
    handleTyping,
    sendMessage,
  };
};

export default useChat;