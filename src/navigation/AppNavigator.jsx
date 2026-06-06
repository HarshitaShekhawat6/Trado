// src/navigation/AppNavigator.js

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "./AuthContext";

import AuthNavigator from "./AuthNavigator";
import MainTabs from "./MainTabs";
import OnboardingScreen from "../modules/onboarding/screens/OnboardingScreen";
import CategoryListingsScreen from "../modules/listings/screens/CategoryListingsScreen";
import ProductDetailScreen from "../modules/listings/screens/ProductDetailScreen";
import SellScreen from "../modules/sell/screens/SellScreen";
import AllListingsScreen from "../modules/home/screens/AllListingsScreen";
import SearchResultsScreen from "../modules/home/screens/SearchResultsScreen";
import WishlistScreen from "../modules/wishlist/screens/WishlistScreen";
import ChatScreen from "../modules/chat/screens/ChatScreen";
import InboxScreen from "../modules/chat/screens/InboxScreen";
import MyOrdersScreen from "../modules/orders/screens/MyOrdersScreen";
import NearbyProductsScreen from "../modules/nearby/screens/NearbyProductsScreen";
const Stack = createNativeStackNavigator();

// ── Bina login ke screens ─────────────────────────────────────────────────────
const PublicStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Auth"             component={AuthNavigator} />
    <Stack.Screen name="ProductDetail"    component={ProductDetailScreen} />
    <Stack.Screen name="CategoryListings" component={CategoryListingsScreen} />
    <Stack.Screen name="AllListings"      component={AllListingsScreen} />
    <Stack.Screen name="SearchResults"    component={SearchResultsScreen} />
  </Stack.Navigator>
);

// ── Sirf logged-in users ke liye screens ─────────────────────────────────────
const PrivateStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main"             component={MainTabs} />
    <Stack.Screen name="CategoryListings" component={CategoryListingsScreen} />
    <Stack.Screen name="SellScreen"       component={SellScreen} />
    <Stack.Screen name="ProductDetail"    component={ProductDetailScreen} />
    <Stack.Screen name="AllListings"      component={AllListingsScreen} />
    <Stack.Screen name="SearchResults"    component={SearchResultsScreen} />
    <Stack.Screen name="Wishlist"         component={WishlistScreen} />
    <Stack.Screen name="Chat"             component={ChatScreen} />
    <Stack.Screen name="Inbox"            component={InboxScreen} />
    <Stack.Screen name="Orders"           component={MyOrdersScreen} />
    <Stack.Screen name="NearbyProducts"    component={NearbyProductsScreen} />
  </Stack.Navigator>
);

// ── Onboarding stack — sirf pehli baar ───────────────────────────────────────
const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Auth"       component={AuthNavigator} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState(null); // null = still checking

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem("onboarding_seen");
        setOnboardingSeen(seen === "true");
      } catch {
        setOnboardingSeen(true); // error pe skip onboarding
      }
    };
     if (!isLoggedIn) {        // ← sirf logout pe re-check karo
    setOnboardingSeen(null); // reset before checking
    checkOnboarding();
  }
  }, [isLoggedIn]);

  // Session restore + onboarding check dono hone tak spinner
  if (isLoading || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0040e0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn
        ? <PrivateStack />
        : onboardingSeen
          ? <PublicStack />
          : <OnboardingStack />
      }
    </NavigationContainer>
  );
};

export default AppNavigator;