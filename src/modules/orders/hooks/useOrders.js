import { useState, useEffect, useCallback } from "react";
import { Alert }                             from "react-native";
import Toast                                 from "react-native-toast-message";
import { fetchMyListings, markAsSoldService, repostListingService } from "../services/orderService";

const useOrders = () => {
  const [activeTab,   setActiveTab]   = useState("All Listings");
  const [allListings, setAllListings] = useState([]);
  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(false);

  // ── Repost sheet state ────────────────────────────────────────────────────
  const [repostSheetVisible, setRepostSheetVisible] = useState(false);
  const [repostItem,         setRepostItem]         = useState(null);
  const [reposting,          setReposting]          = useState(false);

  useEffect(() => { loadListings(); }, []);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyListings();
      setAllListings(data);
      applyFilter("All Listings", data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

 const applyFilter = (tab, data = allListings) => {
  switch (tab) {
    case "Pending":
      // active listings = pending/live listings
      setListings(data.filter((l) => l.status === "active" || l.status === "pending"));
      break;
    case "Needs Repost":
      setListings(data.filter((l) => l.status === "expired"));
      break;
    case "Sold":
      setListings(data.filter((l) => l.status === "sold"));
      break;
    default:
      setListings(data);
  }
};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyFilter(tab);
  };

  const handleMarkAsSold = (item) => {
    Alert.alert(
      "Mark as Sold?",
      `"${item.title}" will be marked as sold and removed from home feed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Mark Sold",
          style: "destructive",
          onPress: async () => {
            try {
              await markAsSoldService(item.id);
              const updated = allListings.map((l) =>
                l.id === item.id ? { ...l, status: "sold" } : l
              );
              setAllListings(updated);
              applyFilter(activeTab, updated);
            } catch (err) {
              Toast.show({
                type: "error", text1: "Mark as Sold Failed",
                text2: err?.response?.data?.message || "Something went wrong.",
                position: "top", visibilityTime: 3000, topOffset: 60,
              });
            }
          },
        },
      ]
    );
  };

  // ── Repost: open sheet ────────────────────────────────────────────────────
  const handleRepost = (item) => {
    setRepostItem(item);
    setRepostSheetVisible(true);
  };

  // ── Repost: confirm after payment ─────────────────────────────────────────
  const confirmRepost = async () => {
    if (!repostItem) return;
    try {
      setReposting(true);
      await repostListingService(repostItem.id);

      const updated = allListings.map((l) =>
        l.id === repostItem.id ? { ...l, status: "pending" } : l
      );
      setAllListings(updated);
      applyFilter(activeTab, updated);
      setRepostSheetVisible(false);
      setRepostItem(null);

      Toast.show({
        type: "success", text1: "Listing Reposted!",
        text2: `"${repostItem.title}" is live again.`,
        position: "top", visibilityTime: 2500, topOffset: 60,
      });
    } catch (err) {
      Toast.show({
        type: "error", text1: "Repost Failed",
        text2: err?.response?.data?.message || "Something went wrong.",
        position: "top", visibilityTime: 3000, topOffset: 60,
      });
    } finally {
      setReposting(false);
    }
  };

  const handleBiddingEnabled = (listingId) => {
    const updated = allListings.map((l) =>
      l.id === listingId ? { ...l, bidding_enabled: 1 } : l
    );
    setAllListings(updated);
    applyFilter(activeTab, updated);
  };

  const handleListingEdited = (updatedItem) => {
    const updated = allListings.map((l) =>
      l.id === updatedItem.id ? { ...l, ...updatedItem } : l
    );
    setAllListings(updated);
    applyFilter(activeTab, updated);
  };

 return {
  activeTab, listings, loading,
  allListings, setAllListings,
  handleTabChange, handleMarkAsSold,
  handleBiddingEnabled, handleListingEdited,
  reload: loadListings,
  handleRepost, confirmRepost, reposting,
  repostSheetVisible, setRepostSheetVisible,
  repostItem, setRepostItem,    // ← yeh add karo
  applyFilter,
};
};

export default useOrders;