import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messaging from "@react-native-firebase/messaging";
import { AuthProvider } from "./src/navigation/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        await messaging().requestPermission();
      } catch (err) {
        console.log("[FCM] Permission error:", err.message);
      }
    };

    setupFCM();

    const unsubscribe = messaging().onMessage(async (msg) => {});
    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <AppNavigator />
          <Toast />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

messaging().setBackgroundMessageHandler(async (msg) => {});

export default App;