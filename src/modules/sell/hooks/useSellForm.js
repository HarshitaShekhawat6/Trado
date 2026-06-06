// modules/sell/hooks/useSellForm.js

import { useCallback, useMemo, useReducer, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createListingService } from "../services/sell.service";
import { geocodeTypedAddress } from "../../../utils/locationUtils";
import Toast from "react-native-toast-message";

// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_CONDITION = "USED";

const createInitialFormState = () => ({
  title: "",
  price: "",
  description: "",
  condition: INITIAL_CONDITION,

  // Location
  location: "",
  latitude: null,
  longitude: null,
  address: "",
  address1: "",
  address2: "",
  city: "",
  state: "",

  images: [],
  category: null,

  // ── Bidding ───────────────────────────────────────────────────────────────
  // Stored as a boolean in state, sent as "1"/"0" in FormData so the backend
  // can read it from multipart without any JSON parsing step.
  biddingEnabled: false,

  posting: false,
});

const formReducer = (state, action) => {
  switch (action.type) {

    case "SET_FIELD": {
      const next =
        typeof action.value === "function"
          ? action.value(state[action.field])
          : action.value;
      return { ...state, [action.field]: next };
    }

    case "SET_LOCATION_DATA": {
      const p = action.payload;
      return {
        ...state,
        latitude: p.latitude ?? p.lat ?? state.latitude,
        longitude: p.longitude ?? p.lng ?? state.longitude,
        address: p.address ?? state.address,
        address1: p.address1 ?? state.address1,
        address2: p.address2 ?? state.address2,
        city: p.city ?? state.city,
        state: p.state ?? state.state,
        location:
          [p.city, p.state].filter(Boolean).join(", ") ||
          p.address ||
          state.location,
      };
    }

    case "SET_ADDRESS_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_COORDS":
      return { ...state, latitude: action.lat, longitude: action.lng };

    case "CLEAR_LOCATION":
      return {
        ...state,
        latitude: null,
        longitude: null,
        address: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        location: "",
      };

    // ── Bidding toggle ────────────────────────────────────────────────────
    case "SET_BIDDING_ENABLED":
      return { ...state, biddingEnabled: action.value };

    case "SET_POSTING":
      return { ...state, posting: action.value };

    case "RESET_FORM":
      return createInitialFormState();

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const useSellForm = (navigation) => {
  const addressRef = useRef({ address1: "", address2: "", city: "", state: "" });
  const geocodeTimer = useRef(null);

  const queryClient = useQueryClient();
  const [formState, dispatch] = useReducer(
    formReducer,
    undefined,
    createInitialFormState
  );

  const {
    title,
    price,
    description,
    condition,
    location,
    latitude,
    longitude,
    address,
    address1,
    address2,
    city,
    state: locationState,
    images,
    category,
    biddingEnabled,
    posting,
  } = formState;

  // ── Generic setter ──────────────────────────────────────────────────────────
  const setField = useCallback(
    (field) => (value) => dispatch({ type: "SET_FIELD", field, value }),
    []
  );

  const setters = useMemo(
    () => ({
      setTitle: setField("title"),
      setPrice: setField("price"),
      setDescription: setField("description"),
      setCondition: setField("condition"),
      setLocation: setField("location"),
      setImages: setField("images"),
      setCategory: setField("category"),
    }),
    [setField]
  );

  // ── Bidding toggle ──────────────────────────────────────────────────────────
  const setBiddingEnabled = useCallback((value) => {
    dispatch({ type: "SET_BIDDING_ENABLED", value });
  }, []);

  // ── Address field setter ────────────────────────────────────────────────────
  const setAddressField = useCallback((field, value) => {
    dispatch({ type: "SET_ADDRESS_FIELD", field, value });
    addressRef.current = { ...addressRef.current, [field]: value };

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const { address1, address2, city, state } = addressRef.current;
        if (!address1 && !city) return;
        const coords = await geocodeTypedAddress({ address1, address2, city, state });
        if (coords) {
          dispatch({ type: "SET_COORDS", lat: coords.latitude, lng: coords.longitude });
        }
      } catch {
        /* ignore — coordinates are optional */
      }
    }, 800);
  }, []);

  // ── Background geocode on blur ──────────────────────────────────────────────
  const geocodeManualAddress = useCallback(async (a1, a2, ct, st) => {
    const coords = await geocodeTypedAddress({
      address1: a1,
      address2: a2,
      city: ct,
      state: st,
    });
    if (coords) {
      dispatch({ type: "SET_COORDS", lat: coords.latitude, lng: coords.longitude });
    }
  }, []);

  // ── GPS / map confirm ────────────────────────────────────────────────────────
  const setLocationData = useCallback((payload) => {
    dispatch({ type: "SET_LOCATION_DATA", payload });
  }, []);

  const clearLocation = useCallback(() => {
    dispatch({ type: "CLEAR_LOCATION" });
  }, []);

  const resetForm = useCallback(() => dispatch({ type: "RESET_FORM" }), []);

  // ── Validation ──────────────────────────────────────────────────────────────
 const validate = () => {
    if (!title.trim()) {
      Toast.show({ type: "error", text1: "Missing Field", text2: "Please enter a title.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    // ← length validations add
    if (title.trim().length > 100) {
      Toast.show({ type: "error", text1: "Too Long", text2: "Title must be under 100 characters.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    if (!price.trim() || isNaN(Number(price))) {
      Toast.show({ type: "error", text1: "Missing Field", text2: "Please enter a valid price.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    if (!category) {
      Toast.show({ type: "error", text1: "Missing Field", text2: "Please select a category.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    if (images.length === 0) {
      Toast.show({ type: "error", text1: "Missing Field", text2: "Please add at least one image.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    if (description.trim().length > 250) {
      Toast.show({ type: "error", text1: "Too Long", text2: "Description must be under 250 characters.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    if (address1.trim().length > 100) {
      Toast.show({ type: "error", text1: "Too Long", text2: "Address must be under 100 characters.", position: "top", visibilityTime: 3000, topOffset: 60 });
      return false;
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    dispatch({ type: "SET_POSTING", value: true });

    try {
      let submitLatitude = latitude;
      let submitLongitude = longitude;

      if (submitLatitude == null || submitLongitude == null) {
        try {
          const coords = await geocodeTypedAddress({
            address1,
            address2,
            city,
            state: locationState,
          });
          if (coords) {
            submitLatitude = coords.latitude;
            submitLongitude = coords.longitude;
            dispatch({
              type: "SET_COORDS",
              lat: coords.latitude,
              lng: coords.longitude,
            });
          }
        } catch {
          /* offline / API failure — address text still saves */
        }
      }

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("price", price.trim());
      formData.append("description", description.trim());
      formData.append("condition", condition);
      formData.append("category_slug", category.slug || category.id?.toString());

      const displayLocation =
        [city, locationState].filter(Boolean).join(", ") || location;
      formData.append("location", displayLocation.trim());

      if (address1) formData.append("address1", address1.trim());
      if (address2) formData.append("address2", address2.trim());
      if (city) formData.append("city", city.trim());
      if (locationState) formData.append("state", locationState.trim());
      if (address) formData.append("address", address.trim());

      if (submitLatitude != null)
        formData.append("latitude", String(submitLatitude));
      if (submitLongitude != null)
        formData.append("longitude", String(submitLongitude));

      // ── Bidding flag ──────────────────────────────────────────────────────
      // Send as "1"/"0" — backend reads it as TINYINT(1).
      // If your backend already accepts JSON booleans feel free to change this.
      formData.append("bidding_enabled", biddingEnabled ? "1" : "0");

      // Images
      images.forEach((img, i) => {
        if (img.fromUrl && img.uri.startsWith("http")) {
          formData.append("image_urls[]", img.uri);
        } else {
          formData.append("images", {
            uri: img.uri,
            type: img.type || "image/jpeg",
            name: img.fileName || `image_${i}.jpg`,
          });
        }
      });

      await createListingService(formData);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
       Toast.show({
            type:            "success",
            text1:           "Your listing has been posted!",
            text2:           `"${title.trim()}" successfully saved.`,
            position:        "top",
            visibilityTime:  2500,
            topOffset:       60,
          });
setTimeout(() => navigation.navigate("Main"), 2500);
    } catch (err) {
       Toast.show({
            type:           "error",
            text1:          "Posting Failed",
            text2:          err?.response?.data?.message || "Something went wrong.",
            position:       "top",
            visibilityTime: 3000,
            topOffset:      60,
          });
    } finally {
      dispatch({ type: "SET_POSTING", value: false });
    }
  };

  return {
    title,
    setTitle: setters.setTitle,
    price,
    setPrice: setters.setPrice,
    description,
    setDescription: setters.setDescription,
    condition,
    setCondition: setters.setCondition,
    images,
    setImages: setters.setImages,
    category,
    setCategory: setters.setCategory,
    posting,

    // Location
    location,
    address1,
    address2,
    city,
    state: locationState,
    address,
    latitude,
    longitude,

    // Actions
    setLocationData,
    setAddressField,
    geocodeManualAddress,
    clearLocation,
    handleSubmit,
    resetForm,

    // ── Bidding ───────────────────────────────────────────────────────────
    biddingEnabled,
    setBiddingEnabled,
  };
};