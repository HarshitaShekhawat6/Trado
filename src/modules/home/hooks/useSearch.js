// src/features/search/hooks/useSearch.js
// Search data comes from the API only: results, counts, suggestions, and history.

import { useState, useEffect, useCallback, useRef } from "react";
import { searchProductsService } from "../../home/services/home.service";
import {
  getSearchHistoryService,
  saveSearchQueryService,
  deleteSearchQueryService,
  clearSearchHistoryService,
  getSearchSuggestionsService,
  nearbyProductsService
} from "../services/searchService";
import { Alert } from "react-native";

const DEBOUNCE = 350;

export const SORT_OPTIONS = [
    { key: "nearest",    label: "Nearest",       icon: "near-me"       },
  { key: "newest", label: "Newest", icon: "schedule" },
  { key: "price_asc", label: "Lowest Price", icon: "arrow-upward" },
  { key: "price_desc", label: "Highest Price", icon: "arrow-downward" },
  { key: "most_viewed", label: "Most Viewed", icon: "visibility" },
];
export const RADIUS_OPTIONS = [5, 10, 20, 50, 100];

export const CONDITION_OPTIONS = [
  { key: "", label: "Any" },
  { key: "new", label: "New" },
  { key: "like_new", label: "Like New" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
];

export const DEFAULT_FILTERS = {
  category: "",
  city: "",
  condition: "",
  priceMin: "",
  priceMax: "",
  dateRange: "",
  sortBy: "newest",
};

const useSearch = (initialQuery = "" , userLocation = null, navigateToProfile = null) => {
  const [inputQuery, setInputQueryRaw] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  const [isNearestMode,  setIsNearestMode]  = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(100);
  const [nearestResults, setNearestResults] = useState([]);
  const [nearestLoading, setNearestLoading] = useState(false);
  const [nearestError,   setNearestError]   = useState(null);
  const [nearestCount,   setNearestCount]   = useState(0);


  const debounceRef = useRef(null);
  const suggestionRequestRef = useRef(0);

  const syncHistoryFromServer = useCallback(async () => {
    try {
      const data = await getSearchHistoryService();
      setHistory(data);
    } catch {
      setHistory([]);
    }
  }, []);

  const executeSearch = useCallback(
    async (query, currentFilters) => {
      const trimmed = query?.trim();
      if (!trimmed) return;

      setActiveQuery(trimmed);
      setShowSuggestions(false);
      setLoading(true);
      setError(null);

      saveSearchQueryService(trimmed)
        .then(syncHistoryFromServer)
        .catch(() => {});

      try {
        const params = {
          sortBy: currentFilters.sortBy || "newest",
          category: currentFilters.category || undefined,
          city: currentFilters.city || undefined,
          condition: currentFilters.condition || undefined,
          priceMin: currentFilters.priceMin || undefined,
          priceMax: currentFilters.priceMax || undefined,
          dateRange: currentFilters.dateRange || undefined,
          limit: 30,
        };

        const data = await searchProductsService(trimmed, 1, params);
        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
      } catch {
        setError("Search failed. Please try again.");
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [syncHistoryFromServer]
  );



   const fetchNearestProducts = useCallback(
    async (radius, query) => {
      // User ne location set nahi ki — alert + profile pe bhejo
      if (!userLocation?.latitude || !userLocation?.longitude) {
        Alert.alert(
          "Location Required",
          "Please add your location first to see nearby products.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Location",
              onPress: () => {
                if (navigateToProfile) navigateToProfile();
              },
            },
          ]
        );
        return;
      }

      setNearestLoading(true);
      setNearestError(null);

      try {
        const data = await nearbyProductsService({
          lat:    userLocation.latitude,
          lng:    userLocation.longitude,
          radius: radius ?? selectedRadius,
          query:  query  ?? activeQuery,
        });

        setNearestResults(data.results || []);
        setNearestCount(data.totalCount || 0);
      } catch {
        setNearestError("Could not load nearby products. Please try again.");
        setNearestResults([]);
        setNearestCount(0);
      } finally {
        setNearestLoading(false);
      }
    },
    [userLocation, selectedRadius, activeQuery, navigateToProfile]
  );

  // ── Toggle Nearest Mode ──────────────────────────────────────────────────
  const toggleNearestMode = useCallback(() => {
    if (!isNearestMode) {
      // Switch ON — check location, fetch products
      setIsNearestMode(true);
      fetchNearestProducts(selectedRadius, activeQuery);
    } else {
      // Switch OFF — back to normal search
      setIsNearestMode(false);
      setNearestResults([]);
      setNearestError(null);
    }
  }, [isNearestMode, fetchNearestProducts, selectedRadius, activeQuery]);

  // ── Radius change ────────────────────────────────────────────────────────
  const handleRadiusChange = useCallback(
    (radius) => {
      setSelectedRadius(radius);
      if (isNearestMode) {
        fetchNearestProducts(radius, activeQuery);
      }
    },
    [isNearestMode, fetchNearestProducts, activeQuery]
  );


  useEffect(() => {
    syncHistoryFromServer();
    if (initialQuery) executeSearch(initialQuery, DEFAULT_FILTERS);
  }, [executeSearch, initialQuery, syncHistoryFromServer]);

  const setInputQuery = useCallback((text) => {
    setInputQueryRaw(text);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = suggestionRequestRef.current + 1;
      suggestionRequestRef.current = requestId;

      try {
        const data = await getSearchSuggestionsService(trimmed);
        if (suggestionRequestRef.current === requestId) {
          setSuggestions(data);
        }
      } catch {
        if (suggestionRequestRef.current === requestId) {
          setSuggestions([]);
        }
      }
    }, DEBOUNCE);
  }, []);

  const handleSearch = (q) => {
    const query = q ?? inputQuery;
    executeSearch(query, filters);
    if (isNearestMode) {
      fetchNearestProducts(selectedRadius, query);
    }
  };

  const handleSuggestionPress = (item) => {
    setInputQueryRaw(item.query);
    executeSearch(item.query, filters);
        if (isNearestMode) fetchNearestProducts(selectedRadius, item.query);

  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    if (activeQuery) executeSearch(activeQuery, updated);
  };

 const handleSortChange = (sortKey) => {

  if (sortKey === "nearest") {
      toggleNearestMode();
      return;
    }

    if (isNearestMode) setIsNearestMode(false);
    handleFilterChange("sortBy", sortKey);
  };
  const resetFilters = () => {
    const reset = { ...DEFAULT_FILTERS };
    setFilters(reset);
    setIsNearestMode(false);
    setNearestResults([]);
    setNearestError(null);
    if (activeQuery) executeSearch(activeQuery, reset);
  };

  const removeHistoryItem = async (item) => {
    try {
      await deleteSearchQueryService(item.id);
    } finally {
      await syncHistoryFromServer();
    }
  };

  const clearAllHistory = async () => {
    try {
      await clearSearchHistoryService();
    } finally {
      await syncHistoryFromServer();
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "sortBy" && v !== ""
  ).length;

  return {
    inputQuery,
    setInputQuery,
    activeQuery,
    handleSearch,
    results,
    loading,
    error,
    totalCount,
    filters,
    handleFilterChange,
    handleSortChange,
    resetFilters,
    activeFilterCount,
    showFilters,
    setShowFilters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    history,
    isNearestMode, toggleNearestMode,
    selectedRadius, handleRadiusChange,
    nearestResults, nearestLoading, nearestError, nearestCount,
    RADIUS_OPTIONS,
    removeHistoryItem,
    clearAllHistory,
    handleSuggestionPress,
  };
};

export default useSearch;
