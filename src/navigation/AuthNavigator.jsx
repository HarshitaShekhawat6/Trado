import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../modules/auth/screens/LoginScreen";
import Signup from "../modules/auth/screens/SignupScreen";
import OtpScreen from "../modules/auth/screens/OtpScreen"

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="OTP" component={OtpScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;