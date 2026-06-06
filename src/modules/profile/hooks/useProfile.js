// src/modules/profile/hooks/useProfile.js

import { useState, useEffect, useCallback ,useRef} from "react";
import { launchCamera, launchImageLibrary }    from "react-native-image-picker";
import {
  getProfileService,
  updateProfileService,
  deleteAccountService,
  resolveImage,
} from "../services/profileService";
import { useAuth }      from "../../../navigation/AuthContext";
import { setAuthToken } from "../../../api/client";
import {
  geocodeTypedAddress,
  getCurrentLocationAddress,
} from "../../../utils/locationUtils";
import Toast from "react-native-toast-message";
import { Alert } from "react-native";




const useProfile = (navigation) => {
  const { token, logout, updateUser} = useAuth();

  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  const [pendingImage,    setPendingImage]     = useState(null);
  const [loadError,       setLoadError]       = useState(null);
  const [saveError,       setSaveError]       = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // ── URL modal state ───────────────────────────────────────────────────────
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput,     setUrlInput]     = useState("");
  const [urlError,     setUrlError]     = useState("");
  const [urlPreviewOk, setUrlPreviewOk] = useState(false);
  const [urlLoading,   setUrlLoading]   = useState(false);




  const addressRef = useRef({ address1: '', address2: '', city: '', state: '' });
const geocodeTimer = useRef(null);



  // Button enabled as soon as URL has enough chars — preview NOT required
  const isUrlButtonEnabled =
    urlInput.trim().length > 10 && urlInput.trim().startsWith("http");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address1: "", address2: "", city: "", state: "",
    image: "", latitude: "", longitude: "",
  });

  // Merged error: save errors take priority over load errors
  const error = saveError || loadError;

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    setAuthToken(token);
    fetchProfile();
  }, [token]);

  // ── fetchProfile returns the fresh data so handleSave can use it ──────────
 const fetchProfile = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);
  setLoadError(null);
  try {
    const data = await getProfileService();
    setUser(data);
    fillForm(data);
    return data;
  } catch (err) {
    if (!silent) {
      setLoadError(err?.response?.data?.message || "Could not load profile");
    }
    return null;
  } finally {
    if (!silent) setLoading(false);
  }
}, []);

  const fillForm = (data) => {
    setForm({
      name:      data.name      || "",
      email:     data.email     || "",
      phone:     data.phone     || "",
      address1:  data.address1  || "",
      address2:  data.address2  || "",
      city:      data.city      || "",
      state:     data.state     || "",
      image:     data.image     || "",
      // Convert numbers to strings for TextInput; empty string if null/undefined
      latitude:  data.latitude  != null ? String(data.latitude)  : "",
      longitude: data.longitude != null ? String(data.longitude) : "",
    });
  };

const handleChange = (field, value) => {
  setForm((prev) => ({ ...prev, [field]: value }));

  // Sirf address fields pe geocode trigger karo
  if (['address1', 'address2', 'city', 'state'].includes(field)) {
    
    // Ref update karo
    addressRef.current = { ...addressRef.current, [field]: value };

    // Debounce — 800ms baad geocode
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const { address1, address2, city, state } = addressRef.current;
        
        // Koi bhi field empty na ho tab geocode karo
        if (!address1 && !city) return;
        
        const coords = await geocodeTypedAddress({ address1, address2, city, state });
        if (coords) {
          setForm((prev) => ({
            ...prev,
            latitude:  String(coords.latitude),
            longitude: String(coords.longitude),
          }));
        }
      } catch { /* ignore */ }
    }, 800);
  }
};

  // ── Save ──────────────────────────────────────────────────────────────────
  // ── fetchProfile: pass silent=true to skip loading spinner (used after save)


const handleSave = async () => {
  setSaveError(null);
  if (form.email && !isValidEmail(form.email)) { setSaveError("Please enter a valid email address"); return; }
  if (form.name && form.name.length < 2)        { setSaveError("Name must be at least 2 characters");  return; }

  setSaving(true);
  try {
    let nextForm = { ...form };

    // Location logic: if address was typed manually and no coordinates exist,
    // geocode quietly before saving so lat/lng stay hidden from the UI.
    if (!nextForm.latitude || !nextForm.longitude) {
      try {
        const coords = await geocodeTypedAddress(nextForm);
        if (coords) {
          nextForm = {
            ...nextForm,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
          };
          setForm(nextForm);
        }
      } catch {
        // Offline/API failures should not block profile text updates.
      }
    }

    await updateProfileService(nextForm, pendingImage);

    // Optimistic update — name/details change instantly on screen
    const optimisticUser = { ...user, ...nextForm };
    setUser(optimisticUser);
    updateUser(optimisticUser);

    // Silent re-fetch to sync with server — won't show skeleton or error banner
    const freshData = await fetchProfile(true);
    if (freshData) updateUser(freshData);

    setPendingImage(null);
    setIsEditing(false);
    setSaveError(null);
  } catch (err) {
    setSaveError(err?.response?.data?.message || "Update failed. Please try again.");
    setIsEditing(false);
  } finally {
    setSaving(false);
  }
};

  const handleCancelEdit = () => {
    if (user) fillForm(user);
    setPendingImage(null);
    setIsEditing(false);
    setSaveError(null);
  };

  const setLocationData = useCallback((locationData) => {
    setForm((prev) => ({
      ...prev,
      address1: locationData.address1 || prev.address1,
      address2: locationData.address2 || prev.address2,
      city: locationData.city || prev.city,
      state: locationData.state || prev.state,
      latitude: locationData.latitude != null ? String(locationData.latitude) : prev.latitude,
      longitude: locationData.longitude != null ? String(locationData.longitude) : prev.longitude,
    }));
  }, []);

 const fetchCurrentLocation = async () => {
  setLocationLoading(true);
  setSaveError(null);
  try {
    const locationData = await getCurrentLocationAddress();
    setForm((prev) => ({
      ...prev,
      address1:  locationData.address1  || prev.address1,
      address2:  locationData.address2  || prev.address2,
      city:      locationData.city      || prev.city,
      state:     locationData.state     || prev.state,
      latitude:  locationData.latitude  != null ? String(locationData.latitude)  : prev.latitude,
      longitude: locationData.longitude != null ? String(locationData.longitude) : prev.longitude,
    }));
  } catch (err) {
    setSaveError(err?.message || "Could not get your location.");
  } finally {
    setLocationLoading(false);
  }
};

  // ── Image pick ────────────────────────────────────────────────────────────
  const handleImagePick = () => {
    if (!isEditing) return;
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        {
          text: "📷 Camera",
          onPress: async () => {
            try {
              const res = await launchCamera({ mediaType: "photo", quality: 0.8 });
              if (!res.didCancel && res.assets?.[0]?.uri)
                setPendingImage(res.assets[0].uri);
            } catch { /* ignore */ }
          },
        },
        {
          text: "🖼️ Gallery",
          onPress: async () => {
            try {
              const res = await launchImageLibrary({ mediaType: "photo", quality: 0.8 });
              if (!res.didCancel && res.assets?.[0]?.uri)
                setPendingImage(res.assets[0].uri);
            } catch { /* ignore */ }
          },
        },
        {
          text: "🔗 Paste Image URL",
          onPress: () => {
            setUrlInput("");
            setUrlError("");
            setUrlPreviewOk(false);
            setUrlLoading(false);
            setShowUrlModal(true);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // ── URL modal handlers ────────────────────────────────────────────────────
  const handleUrlChange = (text) => {
    setUrlInput(text);
    setUrlError("");
    setUrlPreviewOk(false);
    setUrlLoading(false);
  };

  const handleUrlConfirm = () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith("http")) {
      setUrlError("Please enter a valid URL (must start with http)");
      return;
    }
    setPendingImage(trimmed);
    setShowUrlModal(false);
    setUrlInput("");
    setUrlError("");
    setUrlPreviewOk(false);
    setUrlLoading(false);
  };

  const handleUrlClose = () => {
    setShowUrlModal(false);
    setUrlInput("");
    setUrlError("");
    setUrlPreviewOk(false);
    setUrlLoading(false);
  };

  // ── Logout / Delete ───────────────────────────────────────────────────────
  const handleLogout        = () => setShowLogoutModal(true);
  const handleDeleteAccount = () => setShowDeleteModal(true);

const confirmLogout = () => {
  setShowLogoutModal(false);
  setAuthToken(null);
  logout();
  Toast.show({
    type: "success",
    text1: "Logged out successfully",
  });
};

 const confirmDelete = async () => {
  setShowDeleteModal(false);
  try {
    await deleteAccountService();
    setAuthToken(null);
    logout();
    Toast.show({
      type: "success",
      text1: "Account deleted successfully",
    });
  } catch (err) {
    setSaveError(err?.response?.data?.message || "Could not delete account");
    Toast.show({
      type: "error",
      text1: "Could not delete account",
      text2: err?.response?.data?.message || "Please try again",
    });
  }
};

  const avatarUri =
    pendingImage ||
    resolveImage(user?.image) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "U"
    )}&background=2e5bff&color=fff&size=200`;

  return {
    user, form, loading, saving,
    error,            // ← merged: saveError || loadError
    isEditing, setIsEditing,
    avatarUri,
    locationLoading,
    fetchCurrentLocation,
    setLocationData,
    handleChange, handleSave, handleCancelEdit,
    handleImagePick, handleLogout, handleDeleteAccount,
    showLogoutModal, setShowLogoutModal, confirmLogout,
    showDeleteModal, setShowDeleteModal, confirmDelete,
    retryFetch: fetchProfile,
    // URL modal
    showUrlModal,
    urlInput,         handleUrlChange,
    urlError,         setUrlError,
    urlPreviewOk,     setUrlPreviewOk,
    urlLoading,       setUrlLoading,
    isUrlButtonEnabled,
    handleUrlConfirm,
    handleUrlClose,
  };
};

export default useProfile;
