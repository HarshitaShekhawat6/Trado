// chat/hooks/useInbox.js

import { useState, useCallback } from "react";
import { useFocusEffect }        from "@react-navigation/native";
import { getConversationsService } from "../services/chatService";

const useInbox = () => {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [totalUnread,   setTotalUnread]   = useState(0); // ← NEW

  const loadConversations = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getConversationsService();
      const list = Array.isArray(data) ? data : [];
      setConversations(list);

      // ← NEW: sum up all unread_count values
      const unread = list.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
      setTotalUnread(unread);
    } catch (err) {
      console.log("[useInbox] error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const onRefresh = () => loadConversations(true);

  return { conversations, loading, refreshing, onRefresh, totalUnread }; // ← totalUnread added
};

export default useInbox;


