import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import listingService from "../services/listings.service";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const LISTING_KEYS = {
  featured:   ["listings", "featured"],
  recent:     ["listings", "recent"],
  all:        (slug) => ["listings", "all", slug ?? "all"],
  byId:       (id)   => ["listings", id],
};

// ─────────────────────────────────────────────────────────────────────────────
// useFeaturedListings
// For Home screen featured horizontal section
// ─────────────────────────────────────────────────────────────────────────────
export const useFeaturedListings = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: LISTING_KEYS.featured,
    queryFn:  listingService.getFeatured,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  return {
    listings: data || [],
    isLoading,
    isError,
    error:   error?.message || null,
    refetch,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// useRecentListings
// For Home screen "Recently Added" section
// ─────────────────────────────────────────────────────────────────────────────
export const useRecentListings = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: LISTING_KEYS.recent,
    queryFn:  listingService.getRecent,
    staleTime: 1000 * 60,
    retry: 1,
  });

  return {
    listings: data || [],
    isLoading,
    isError,
    error:   error?.message || null,
    refetch,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// useAllListings
// For "All Listings" screen — infinite scroll + optional category filter
// ─────────────────────────────────────────────────────────────────────────────
export const useAllListings = (categorySlug = null) => {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: LISTING_KEYS.all(categorySlug),
    queryFn:  ({ pageParam = 1 }) =>
      listingService.getAll({ page: pageParam, category_slug: categorySlug }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 1000 * 60,
    retry: 1,
  });

  // Flatten all pages into a single array
  const listings = data?.pages?.flatMap((page) => page.listings) || [];

  return {
    listings,
    isLoading,
    isError,
    error:              error?.message || null,
    fetchNextPage,
    hasNextPage:        !!hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// useListingById
// For Listing Detail screen
// ─────────────────────────────────────────────────────────────────────────────
export const useListingById = (id) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: LISTING_KEYS.byId(id),
    queryFn:  () => listingService.getById(id),
    enabled:  !!id,
  });

  return {
    listing: data || null,
    isLoading,
    isError,
    error:   error?.message || null,
  };
};

