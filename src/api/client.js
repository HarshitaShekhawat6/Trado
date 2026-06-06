import axios from "axios";
import ENV from "../config/env";

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 60000,
  headers: {
    // "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Token inject karne ka helper
export const setAuthToken = (token) => {
   
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export default apiClient;