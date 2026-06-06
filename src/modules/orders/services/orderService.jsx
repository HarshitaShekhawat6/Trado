// orders/services/orderService.js

import apiClient     from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const fetchMyListings = async () => {
  const res  = await apiClient.get(ENDPOINTS.MY_LISTINGS);
  const data = res.data;
  if (Array.isArray(data))           return data;
  if (Array.isArray(data?.data))     return data.data;
  if (Array.isArray(data?.listings)) return data.listings;
  return [];
};

export const markAsSoldService = async (listingId) => {
  const res = await apiClient.patch(`${ENDPOINTS.LISTINGS}/${listingId}/sold`);
  return res.data;
};

// ── Edit listing (title, price, description, condition, location) ─────────────
export const updateListingService = async (listingId, fields) => {
  const res = await apiClient.patch(`/api/listings/${listingId}`, fields);
  return res.data;
};
export const repostListingService = async (listingId) => {
  const res = await apiClient.patch(`/api/listings/${listingId}/repost`);
  return res.data;
};