import apiClient     from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getUserByIdApi = (userId) =>
  apiClient.get(`${ENDPOINTS.USERS}/${userId}`);

export const updateUserApi = (userId, formData) =>
  apiClient.put(`${ENDPOINTS.USERS}/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteUserApi = (userId) =>
  apiClient.delete(`${ENDPOINTS.USERS}/${userId}`);