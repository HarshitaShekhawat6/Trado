import axios from "axios";
import { getToken } from "../utils/storage";
import ENV from "../config/env";  

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;