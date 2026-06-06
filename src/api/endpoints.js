// src/api/endpoints.js

export const ENDPOINTS = {
  // Auth
  LOGIN:      "/api/auth/login",
  REGISTER:   "/api/auth/register",
  SEND_OTP:   "/api/auth/send-otp",
  VERIFY_OTP: "/api/auth/verify-otp",

  // Listings
  LISTINGS:        "/api/listings",
  MY_LISTINGS:     "/api/listings/my/listings",  

  // Categories
  CATEGORIES: "/api/categories",

  // Wishlist
  WISHLIST:   "/api/wishlist",

  // Chat
  CHAT:       "/api/chat",


  SEARCH:            "/api/search/listings",
  SEARCH_HISTORY:    "/api/search/history",
  SEARCH_SUGGESTIONS:"/api/search/suggestions",


  HOME  :  "/api/home",

  PROFILE:    "/api/profile",  
  
  USERS:      "/api/users", 

  NEARBY_LISTINGS: "/api/listings", 



  PAYMENTS:   "/api/payments",



  BIDS: "/api/bids",


NEARBY_SELLERS: "/api/users/nearby-sellers",

STATES: "/api/states",
};
