
import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getAllProducts = () => {
  return apiClient.get("/products");
};


//  user info
export const getHomeUser = () => {
  return apiClient.get(ENDPOINTS.HOME_USER);
};

//  products
export const getProducts = () => {
  return apiClient.get(ENDPOINTS.PRODUCTS);
};

//  categories
export const getCategories = () => {
  return apiClient.get(ENDPOINTS.CATEGORIES);
};