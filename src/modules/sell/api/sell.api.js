import apiClient from "../../../api/client";

export const createListingApi = (formData) => {
  return apiClient.post("/api/listings", formData);
};
export const createListingService = createListingApi;
