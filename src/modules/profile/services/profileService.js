import apiClient     from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

const BASE_URL = apiClient.defaults.baseURL?.replace(/\/$/, "") ?? "";

export const getProfileService = async () => {
  const res = await apiClient.get(ENDPOINTS.PROFILE);
  return res.data?.data ?? res.data;
};

export const updateProfileService = async (fields, imageUri = null) => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== "") {
      formData.append(key, String(val));
    }
  });

  if (imageUri) {
    if (imageUri.startsWith("http")) {
      formData.append("imageUrl", imageUri);
    } else {
      const filename = imageUri.split("/").pop();
      const ext      = filename.split(".").pop()?.toLowerCase() || "jpg";
      formData.append("image", {
        uri:  imageUri,
        type: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        name: filename,
      });
    }
  }

  const res = await apiClient.put(ENDPOINTS.PROFILE, formData, {
    headers:          { "Content-Type": "multipart/form-data" },
    transformRequest: (data) => data,
  });

  return res.data;
};

export const deleteAccountService = async () => {
  await apiClient.delete(ENDPOINTS.PROFILE);
};

export const resolveImage = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}${imagePath}`;
};