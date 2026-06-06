import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getWishlistService,
  addToWishlistService,
  removeFromWishlistService,
} from "../services/wishlistService";

export const WISHLIST_QUERY_KEY = ["wishlist"];

const useWishlist = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // ─── FETCH 
  const {
    data: wishlist = [],
    isLoading,
  } = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: getWishlistService,
  });

  // ─── MUTATIONS 
  const addMutation = useMutation({
    mutationFn: addToWishlistService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Add failed");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlistService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Remove failed");
    },
  });

  // ─── TOGGLE (OPTIMISTIC + SAFE) 
const toggleWishlist = useCallback(
  (listingOrId, currentlyWishlisted) => {

    const isObject = typeof listingOrId === "object" && listingOrId !== null;
    const listingId = isObject
      ? (listingOrId?.listing_id ?? listingOrId?.id)
      : listingOrId;

    if (!listingId) {
      console.warn("toggleWishlist: no listingId found", listingOrId);
      return;
    }



   queryClient.setQueryData(WISHLIST_QUERY_KEY, (old = []) => {
  if (currentlyWishlisted) {
    return old.filter((w) => String(w.listing_id) !== String(listingId));
  } else {
    return [
      ...old,
      {
        listing_id: listingId,
        title:    isObject ? listingOrId.title    : "",
        price:    isObject ? listingOrId.price    : null,
        location: isObject ? listingOrId.location : "",  // city → location
        image:    isObject ? listingOrId.image    : null,
      },
    ];
  }
});

    if (currentlyWishlisted) {
      removeMutation.mutate(listingId);
    } else {
      addMutation.mutate(listingId);
    }
  },
  [queryClient, addMutation, removeMutation]
);
  // ─── CHECK 
  const isWishlisted = useCallback(
    (listingId) => {
      return wishlist.some(
        (w) => String(w.listing_id) === String(listingId)
      );
    },
    [wishlist]
  );

  return {
    wishlist,
    isLoading,
    toggleWishlist,
    isWishlisted,
    error,
    isToggling: addMutation.isPending || removeMutation.isPending,
  };
};

export default useWishlist;
