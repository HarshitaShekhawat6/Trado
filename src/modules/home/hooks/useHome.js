// src/modules/home/hooks/useHome.js

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getProductsService,
  getRecentProductsService,
  getCategoriesService,
  getHomeContentService,
} from "../services/home.service";
import { getProfileService } from "../../profile/services/profileService";
import { setAuthToken } from "../../../api/client";
import { useAuth } from "../../../navigation/AuthContext"; // ← ADD THIS

export const HOME_QUERY_KEYS = {
  content:    ["home", "content"],
  profile:    ["home", "profile"],
  featured:   ["products", "featured"],
  recent:     ["products", "recent"],
  categories: ["categories"],
};

const normalizeProfile = (profile) => {
  const candidate =
    profile?.data?.user ??
    profile?.data?.profile ??
    profile?.data ??
    profile?.user ??
    profile?.profile ??
    profile;

  if (!candidate || typeof candidate !== "object") return null;

  const composedName = [
    candidate.firstName ?? candidate.first_name,
    candidate.lastName  ?? candidate.last_name,
  ].filter(Boolean).join(" ");

  const displayName =
    [
      candidate.name, candidate.full_name, candidate.fullName,
      composedName, candidate.username, candidate.user_name,
    ].find((v) => typeof v === "string" && v.trim()) ?? "";

  return {
    ...candidate,
    name:   displayName,
    avatar: candidate.avatar ?? candidate.image ??
            candidate.profile_image ?? candidate.profileImage ?? null,
  };
};

export const useHome = (token) => {
  // ── Pull updateUser + userLocation from AuthContext ──────────────────────
  const { userLocation, updateUser } = useAuth(); // ← ADD THIS

  const contentQuery = useQuery({
    queryKey: HOME_QUERY_KEYS.content,
    queryFn:  getHomeContentService,
    retry: 1,
    throwOnError: false,
  });

  const profileQuery = useQuery({
    queryKey: [...HOME_QUERY_KEYS.profile, token],
    queryFn:  () => { setAuthToken(token); return getProfileService(); },
    enabled:  !!token,
    retry: 1,
  });

  const featuredQuery = useQuery({
    queryKey: HOME_QUERY_KEYS.featured,
    queryFn:  () => { setAuthToken(token); return getProductsService(1); },
    enabled:  !!token,
    retry: 1,
  });

  const recentQuery = useQuery({
    queryKey: HOME_QUERY_KEYS.recent,
    queryFn:  () => { setAuthToken(token); return getRecentProductsService(); },
    enabled:  !!token,
    retry: 1,
  });

  const categoryQuery = useQuery({
    queryKey: HOME_QUERY_KEYS.categories,
    queryFn:  getCategoriesService,
    enabled:  !!token,
    retry: 1,
  });

  // ── When profile loads from API, sync lat/lng into AuthContext ───────────
  useEffect(() => {
    if (!profileQuery.data) return;

    const raw =
      profileQuery.data?.data?.user    ??
      profileQuery.data?.data?.profile ??
      profileQuery.data?.data          ??
      profileQuery.data?.user          ??
      profileQuery.data?.profile       ??
      profileQuery.data;

    const lat = raw?.latitude  ?? raw?.lat;
    const lng = raw?.longitude ?? raw?.lng;

    // Only sync if DB has location but AuthContext doesn't yet
    if (lat && lng && !userLocation?.latitude) {
      updateUser({
        latitude:  Number(lat),
        longitude: Number(lng),
        radius:    raw?.radius ? Number(raw.radius) : undefined,
      });
    }
  }, [profileQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    homeContent: contentQuery.isError ? null : contentQuery.data ?? null,
    profile:     normalizeProfile(profileQuery.data),
    featured:    featuredQuery.data  ?? [],
    recent:      recentQuery.data    ?? [],
    categories:  categoryQuery.data  ?? [],
    userLocation,                          // expose so HomeScreen can use it
    loading:
      profileQuery.isLoading  ||
      featuredQuery.isLoading ||
      recentQuery.isLoading   ||
      categoryQuery.isLoading,
    refreshing:
      contentQuery.isFetching  ||
      profileQuery.isFetching  ||
      featuredQuery.isFetching ||
      recentQuery.isFetching   ||
      categoryQuery.isFetching,
    errors: {
      content:    contentQuery.error,
      profile:    profileQuery.error,
      featured:   featuredQuery.error,
      recent:     recentQuery.error,
      categories: categoryQuery.error,
    },
    refetchAll: () => {
      contentQuery.refetch();
      profileQuery.refetch();
      featuredQuery.refetch();
      recentQuery.refetch();
      categoryQuery.refetch();
    },
  };
};

export default useHome;