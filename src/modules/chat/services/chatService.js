// chat/services/chatService.js
import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

// Helper: extract array from various backend response shapes
const extractArray = (data) => {
  if (Array.isArray(data))          return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.data))     return data.data;
  return [];
};

// Helper: extract single object from various backend response shapes
const extractObject = (data) => {
  return data?.message ?? data?.conversation ?? data?.data ?? data;
};

export const startConversationService = async ({ listing_id, seller_id }) => {
  console.log("[startConversation] payload:", { listing_id, seller_id });

  const res = await apiClient.post(`${ENDPOINTS.CHAT}/conversation`, { listing_id, seller_id }); // ← singular
  
  console.log("RAW conversation response:", JSON.stringify(res.data));
  return extractObject(res.data);
};

export const sendMessageService = async ({ conversation_id, text }) => {
  const res = await apiClient.post(`${ENDPOINTS.CHAT}/messages`, {
    conversation_id,
    text,
  });
  return extractObject(res.data); // ← returns the message object, not wrapper
};

export const getConversationsService = async () => {
  const res = await apiClient.get(`${ENDPOINTS.CHAT}/conversations`);
  return extractArray(res.data); // ← always returns an array
};

export const getMessagesService = async (conversationId) => {
  
  const res = await apiClient.get(`${ENDPOINTS.CHAT}/messages/${conversationId}`);
  console.log("RAW messages response:", JSON.stringify(res.data));

  return extractArray(res.data); // ← always returns an array
};

export const saveFcmTokenService = async (token) => {
  const res = await apiClient.post(`${ENDPOINTS.CHAT}/fcm-token`, { token });
  return res.data;
};