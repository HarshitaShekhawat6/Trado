import apiClient from "../../../api/client";

export const getListingsService = async (page = 1) => {
  const res = await apiClient.get(`/api/listings?page=${page}&limit=10`);
  return res.data;
};

export const getProductsByCategory = async (slug) => {
  const res = await apiClient.get(`/api/listings?category=${slug}`);
  return res.data;
};

export const getListingById = async (id) => {
  const res = await apiClient.get(`/api/listings/${id}`);
  return res.data;
};