
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Home from "../modules/home/screens/HomeScreen";
import Wishlist from "../modules/wishlist/screens/WishlistScreen";
import Sell from "../modules/sell/screens/SellScreen";
import Orders from "../modules/orders/screens/MyOrdersScreen";
import Profile from "../modules/profile/screens/ProfileScreen";
import Inbox from "../modules/chat/screens/InboxScreen";
import TabBar from "./TabBar";

const Tab = createBottomTabNavigator();


const MainTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Wishlist" component={Wishlist} />
      <Tab.Screen name="Sell" component={Sell} />
      <Tab.Screen name="Listings" component={Orders} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default MainTabs;
