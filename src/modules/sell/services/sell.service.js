import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const createListingService = async (formData) => {
  const response = await apiClient.post(ENDPOINTS.LISTINGS, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (data) => data,
  });
  return response.data;
};