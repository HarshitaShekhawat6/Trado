// src/navigation/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Keychain from "react-native-keychain";
import messaging from "@react-native-firebase/messaging";
import { setAuthToken } from "../api/client";
import { saveFcmTokenService } from "../modules/chat/services/chatService";
import { getProfileService } from "../modules/profile/services/profileService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn,   setIsLoggedIn]  = useState(false);
  const [token,        setToken]       = useState(null);
  const [user,         setUser]        = useState(null);
  const [userLocation, setUserLocation]= useState(null);
  const [radius,       setRadius]      = useState(20);
  const [isLoading,    setIsLoading]   = useState(true);

  // ── App open hone pe saved session restore karo ───────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Token — Keychain se (encrypted)
        const credentials = await Keychain.getGenericPassword();
        const savedToken  = credentials ? credentials.password : null;

        // User data — AsyncStorage se
        const savedUser = await AsyncStorage.getItem("auth_user");

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setAuthToken(savedToken);
          setToken(savedToken);
          setUser(parsedUser);
          setIsLoggedIn(true);

          if (parsedUser?.latitude && parsedUser?.longitude) {
            setUserLocation({
              latitude:  Number(parsedUser.latitude),
              longitude: Number(parsedUser.longitude),
            });
            if (parsedUser?.radius) setRadius(Number(parsedUser.radius));
          }
        }
      } catch (e) {
        console.log("[AuthContext] Session restore failed:", e.message);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const extractLocation = (raw) => {
    if (!raw) return null;
    const candidate =
      raw?.data?.user    ?? raw?.data?.profile ??
      raw?.data          ?? raw?.user          ??
      raw?.profile       ?? raw;

    const lat = candidate?.latitude  ?? candidate?.lat;
    const lng = candidate?.longitude ?? candidate?.lng;
    const r   = candidate?.radius;

    if (!lat || !lng) return null;
    return {
      latitude:  Number(lat),
      longitude: Number(lng),
      radius:    r ? Number(r) : 20,
    };
  };

  const login = async (receivedToken, userData) => {
    // Token → Keychain (encrypted)
    await Keychain.setGenericPassword("auth_token", receivedToken);
    // User data → AsyncStorage
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));

    setAuthToken(receivedToken);
    setToken(receivedToken);
    setUser(userData);
    setIsLoggedIn(true);

    const fromLogin = extractLocation(userData);
    if (fromLogin) {
      setUserLocation({ latitude: fromLogin.latitude, longitude: fromLogin.longitude });
      setRadius(fromLogin.radius);
    }

    try {
      const profileRes = await getProfileService();
      const loc = extractLocation(profileRes);
      if (loc) {
        setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
        setRadius(loc.radius);
        const updatedUser = {
          ...userData,
          latitude:  String(loc.latitude),
          longitude: String(loc.longitude),
          radius:    loc.radius,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.log("[AuthContext] Profile fetch on login failed:", e.message);
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        const fcmToken = await messaging().getToken();
        if (fcmToken) await saveFcmTokenService(fcmToken);
      }
    } catch (err) {
      console.log("[FCM] Token save failed:", err.message);
    }
  };

  const saveLocation = ({ latitude, longitude, radius: r }) => {
    setUserLocation({ latitude, longitude });
    if (r != null) setRadius(r);
  };

  const updateUser = async (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));

    if (updatedFields?.latitude && updatedFields?.longitude) {
      setUserLocation({
        latitude:  Number(updatedFields.latitude),
        longitude: Number(updatedFields.longitude),
      });
    }
    if (updatedFields?.radius != null) setRadius(Number(updatedFields.radius));
  };

  const logout = async () => {
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem("auth_user");
  await AsyncStorage.removeItem("onboarding_seen");

    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setUserLocation(null);
    setRadius(20);
  };

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  return (
    <AuthContext.Provider value={{
      isLoggedIn, token, user, isLoading,
      userLocation, radius,
      login, logout, updateUser, saveLocation,
      setRadius,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);