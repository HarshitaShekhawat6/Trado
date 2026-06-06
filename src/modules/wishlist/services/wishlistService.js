import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

// GET
export const getWishlistService = async () => {
  try {
    const res = await apiClient.get(ENDPOINTS.WISHLIST);
   
    return res.data.data || [];
  } catch (error) {
    console.error("Fetch Wishlist Error:", error);
    throw error;
  }
};

// ADD
export const addToWishlistService = async (listingId) => {
  try {
   
    return await apiClient.post(`${ENDPOINTS.WISHLIST}/${listingId}`);
  } catch (error) {
    console.error("Add Wishlist Error:", error);
    throw error;
  }
};

// REMOVE
export const removeFromWishlistService = async (listingId) => {
  try {
    return await apiClient.delete(`${ENDPOINTS.WISHLIST}/${listingId}`);
  } catch (error) {
    console.error("Remove Wishlist Error:", error);
    throw error;
  }
};

// HELPER: Resolves images safely
export const resolveImage = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return { uri: image };
  if (image.url) return { uri: image.url };
  return image;
};
