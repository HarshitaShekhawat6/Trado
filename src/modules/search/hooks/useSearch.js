// // src/features/search/hooks/useSearch.js
// // Search data comes from the API only: results, counts, suggestions, and history.

// import { useState, useEffect, useCallback, useRef } from "react";
// import { searchProductsService } from "../../home/services/home.service";
// import {
//   getSearchHistoryService,
//   saveSearchQueryService,
//   deleteSearchQueryService,
//   clearSearchHistoryService,
//   getSearchSuggestionsService,
// } from "../../home/services/searchService";

// const DEBOUNCE = 350;

// export const SORT_OPTIONS = [
//   { key: "newest", label: "Newest", icon: "schedule" },
//   { key: "price_asc", label: "Lowest Price", icon: "arrow-upward" },
//   { key: "price_desc", label: "Highest Price", icon: "arrow-downward" },
//   { key: "most_viewed", label: "Most Viewed", icon: "visibility" },
// ];

// export const CONDITION_OPTIONS = [
//   { key: "", label: "Any" },
//   { key: "new", label: "New" },
//   { key: "like_new", label: "Like New" },
//   { key: "good", label: "Good" },
//   { key: "fair", label: "Fair" },
// ];

// export const DEFAULT_FILTERS = {
//   category: "",
//   city: "",
//   condition: "",
//   priceMin: "",
//   priceMax: "",
//   dateRange: "",
//   sortBy: "newest",
// };

// const useSearch = (initialQuery = "") => {
//   const [inputQuery, setInputQueryRaw] = useState(initialQuery);
//   const [activeQuery, setActiveQuery] = useState(initialQuery);
//   const [filters, setFilters] = useState(DEFAULT_FILTERS);
//   const [showFilters, setShowFilters] = useState(false);
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [totalCount, setTotalCount] = useState(0);
//   const [history, setHistory] = useState([]);
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   const debounceRef = useRef(null);
//   const suggestionRequestRef = useRef(0);

//   const syncHistoryFromServer = useCallback(async () => {
//     try {
//       const data = await getSearchHistoryService();
//       setHistory(data);
//     } catch {
//       setHistory([]);
//     }
//   }, []);

//   const executeSearch = useCallback(
//     async (query, currentFilters) => {
//       const trimmed = query?.trim();
//       if (!trimmed) return;

//       setActiveQuery(trimmed);
//       setShowSuggestions(false);
//       setLoading(true);
//       setError(null);

//       saveSearchQueryService(trimmed)
//         .then(syncHistoryFromServer)
//         .catch(() => {});

//       try {
//         const params = {
//           sortBy: currentFilters.sortBy || "newest",
//           category: currentFilters.category || undefined,
//           city: currentFilters.city || undefined,
//           condition: currentFilters.condition || undefined,
//           priceMin: currentFilters.priceMin || undefined,
//           priceMax: currentFilters.priceMax || undefined,
//           dateRange: currentFilters.dateRange || undefined,
//           limit: 30,
//         };

//         const data = await searchProductsService(trimmed, 1, params);
//         setResults(data.results || []);
//         setTotalCount(data.totalCount || 0);
//       } catch {
//         setError("Search failed. Please try again.");
//         setResults([]);
//         setTotalCount(0);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [syncHistoryFromServer]
//   );

//   useEffect(() => {
//     syncHistoryFromServer();
//     if (initialQuery) executeSearch(initialQuery, DEFAULT_FILTERS);
//   }, [executeSearch, initialQuery, syncHistoryFromServer]);

//   const setInputQuery = useCallback((text) => {
//     setInputQueryRaw(text);
//     setShowSuggestions(true);

//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     const trimmed = text.trim();
//     if (!trimmed) {
//       setSuggestions([]);
//       return;
//     }

//     debounceRef.current = setTimeout(async () => {
//       const requestId = suggestionRequestRef.current + 1;
//       suggestionRequestRef.current = requestId;

//       try {
//         const data = await getSearchSuggestionsService(trimmed);
//         if (suggestionRequestRef.current === requestId) {
//           setSuggestions(data);
//         }
//       } catch {
//         if (suggestionRequestRef.current === requestId) {
//           setSuggestions([]);
//         }
//       }
//     }, DEBOUNCE);
//   }, []);

//   const handleSearch = (q) => executeSearch(q ?? inputQuery, filters);

//   const handleSuggestionPress = (item) => {
//     setInputQueryRaw(item.query);
//     executeSearch(item.query, filters);
//   };

//   const handleFilterChange = (key, value) => {
//     const updated = { ...filters, [key]: value };
//     setFilters(updated);
//     if (activeQuery) executeSearch(activeQuery, updated);
//   };

//   const handleSortChange = (sortKey) => handleFilterChange("sortBy", sortKey);

//   const resetFilters = () => {
//     const reset = { ...DEFAULT_FILTERS };
//     setFilters(reset);
//     if (activeQuery) executeSearch(activeQuery, reset);
//   };

//   const removeHistoryItem = async (item) => {
//     try {
//       await deleteSearchQueryService(item.id);
//     } finally {
//       await syncHistoryFromServer();
//     }
//   };

//   const clearAllHistory = async () => {
//     try {
//       await clearSearchHistoryService();
//     } finally {
//       await syncHistoryFromServer();
//     }
//   };

//   const activeFilterCount = Object.entries(filters).filter(
//     ([k, v]) => k !== "sortBy" && v !== ""
//   ).length;

//   return {
//     inputQuery,
//     setInputQuery,
//     activeQuery,
//     handleSearch,
//     results,
//     loading,
//     error,
//     totalCount,
//     filters,
//     handleFilterChange,
//     handleSortChange,
//     resetFilters,
//     activeFilterCount,
//     showFilters,
//     setShowFilters,
//     suggestions,
//     showSuggestions,
//     setShowSuggestions,
//     history,
//     removeHistoryItem,
//     clearAllHistory,
//     handleSuggestionPress,
//   };
// };

// export default useSearch;
