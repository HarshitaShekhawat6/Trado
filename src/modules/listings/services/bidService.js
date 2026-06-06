// modules/listings/services/bidService.js
//
// All HTTP calls related to bidding.
// Base URL comes from your existing apiClient — no config change needed.

import apiClient from "../../../api/client";

// ─── Buyer: fetch bids for a product ─────────────────────────────────────────
// Returns: [{ id, bidder_name, amount, created_at }, ...]
// Notes are intentionally excluded by the backend endpoint.
export const getBidsForBuyer = async (productId) => {
  const res = await apiClient.get(`/api/bids/${productId}`);
  return Array.isArray(res.data) ? res.data : res.data?.bids ?? res.data?.data ?? []; // ← ?bids add karo
};

// ─── Place a bid ──────────────────────────────────────────────────────────────
// Payload: { product_id, bidder_name, amount, note?, bidder_user_id? }
// Returns: { id, bidder_name, amount, created_at }
export const placeBid = async (payload) => {
  const res = await apiClient.post("/api/bids", payload);
  return res.data?.bid ?? res.data?.data ?? res.data; // ← ?bid add karo
};

// ─── Seller: fetch bids including notes ──────────────────────────────────────
// Requires seller auth (backend middleware verifies product ownership).
// Returns: [{ id, bidder_name, amount, note, bidder_user_id, created_at }, ...]
export const getBidsForSeller = async (productId) => {
  const res = await apiClient.get(`/api/bids/${productId}/seller`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
};