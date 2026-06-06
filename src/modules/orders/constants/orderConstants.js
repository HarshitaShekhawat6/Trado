// orders/constants/orderConstants.js

export const TABS = ["All Listings", "Pending", "Needs Repost", "Sold"];

export const STATUS_MAP = {
  "Pending":      "pending",
  "Sold":         "sold",
  "Needs Repost": "expired",
};

export const BADGE_CONFIG = {
  sold:    { label: "Sold",    bg: "#913983", text: "#ffeef7" },
  pending: { label: "Pending", bg: "#cfcdff", text: "#3c38a1" },
  expired: { label: "Expired", bg: "#f74b6d", text: "#510017" },
  paused:  { label: "Paused",  bg: "#e0e0e0", text: "#555"    }, 
  default: { label: "",        bg: "#e6e7f6", text: "#2c2e38" },
};