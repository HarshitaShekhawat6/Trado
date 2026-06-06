import apiClient     from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

const normalizeArrayResponse = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getSearchHistoryService = async () => {
  const { data } = await apiClient.get(ENDPOINTS.SEARCH_HISTORY);
  return normalizeArrayResponse(data, ["history", "results"]);
};

export const saveSearchQueryService = async (query) => {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) throw new Error("Search query is required");
  const { data } = await apiClient.post(ENDPOINTS.SEARCH_HISTORY, { query: trimmed });
  return data;
};

export const deleteSearchQueryService = async (id) => {
  if (!id) throw new Error("Search history id is required");
  const { data } = await apiClient.delete(`${ENDPOINTS.SEARCH_HISTORY}/${encodeURIComponent(String(id))}`);
  return data;
};

export const clearSearchHistoryService = async () => {
  const { data } = await apiClient.delete(ENDPOINTS.SEARCH_HISTORY);
  return data;
};

export const getSearchSuggestionsService = async (query) => {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get(ENDPOINTS.SEARCH_SUGGESTIONS, { params: { q: trimmed } });
  return normalizeArrayResponse(data, ["suggestions", "results"]);
};

export const nearbyProductsService = async ({ lat, lng, radius, query }) => {
  const params = {
    lat,
    lng,
    radius,
    limit: 50,
  };
  if (query && query.trim()) params.search = query.trim();

  const { data } = await apiClient.get(ENDPOINTS.NEARBY_LISTINGS, { params });

  // Response: { success, rows, page, count }
  const rows = data?.rows ?? data?.results ?? data?.data ?? [];
  return {
    results:    Array.isArray(rows) ? rows : [],
    totalCount: data?.count ?? rows?.length ?? 0,
  };
};