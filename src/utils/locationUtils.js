import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";
import CommunityGeolocation from "@react-native-community/geolocation";

export const GOOGLE_API_KEY = "AIzaSyBatDpMkpoEyBosYHqgRJI_HiyjzoXMXJg";

const GOOGLE_BASE_URL = "https://maps.googleapis.com/maps/api";

const jsonFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Location service is unavailable.");
  return res.json();
};

export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      const locationPermissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ].filter(Boolean);

      const result = await PermissionsAndroid.requestMultiple(locationPermissions);

      return (
        result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const status = await Geolocation.requestAuthorization("whenInUse");
    return status === "granted";
  } catch {
    return false;
  }
};

const readPosition = (provider, options) =>
  new Promise((resolve, reject) => {
    provider.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords || {};
        if (latitude == null || longitude == null) {
          reject(new Error("Could not get your current location."));
          return;
        }
        resolve({ latitude, longitude });
      },
      (error) => reject(new Error(error?.message || "Could not get your current location.")),
      options
    );
  });

export const getGpsCoordinates = async () => {
  const permitted = await requestLocationPermission();
  if (!permitted) {
    throw new Error("Location permission was denied.");
  }

  const options = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 10000,
  };

  if (Platform.OS === "android") {
    try {
      return await readPosition(CommunityGeolocation, options);
    } catch (communityError) {
      try {
        return await readPosition(Geolocation, {
          ...options,
          forceLocationManager: true,
          forceRequestLocation: false,
          showLocationDialog: false,
        });
      } catch {
        throw communityError;
      }
    }
  }

  return readPosition(Geolocation, {
    ...options,
    forceRequestLocation: true,
    showLocationDialog: true,
  });
};

export const parseGoogleAddress = (result = {}) => {
  const components = result.address_components || [];
  
  const find = (...types) => {
    const item = components.find((component) =>
      types.some((type) => component.types?.includes(type))
    );
    return item?.long_name || "";
  };

  const streetNumber = find("street_number");
  const route = find("route");
  const sublocality = find(
    "sublocality_level_2",
    "sublocality_level_1", 
    "sublocality",
    "neighborhood"
  );
  const city = find(
    "locality",
    "administrative_area_level_2",
    "postal_town",
    "administrative_area_level_3"
  );
  const state = find("administrative_area_level_1");
  const pincode = find("postal_code");

  // Plus Code fix — agar street address nahi mila to sublocality use karo
  const address1 =
    [streetNumber, route].filter(Boolean).join(", ") ||
    sublocality ||
    find("sublocality_level_1") ||
    find("administrative_area_level_2") ||
    result.formatted_address?.split(",")?.[0] ||
    "";

  const address2 = sublocality && address1 !== sublocality 
    ? sublocality 
    : find("sublocality_level_2") || "";

  return {
    address1,
    address2,
    city,
    state,
    pincode,
    address: result.formatted_address || "",
  };
};

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const url =
    `${GOOGLE_BASE_URL}/geocode/json?latlng=${latitude},${longitude}` +
    `&key=${GOOGLE_API_KEY}`;
  const json = await jsonFetch(url);

  if (json.status !== "OK" || !json.results?.length) {
    throw new Error("Address could not be found for this location.");
  }

  return {
    ...parseGoogleAddress(json.results[0]),
    latitude,
    longitude,
  };
};

export const getCurrentLocationAddress = async () => {
  const coords = await getGpsCoordinates();
  return reverseGeocodeCoordinates(coords.latitude, coords.longitude);
};

export const searchPlaces = async (query) => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url =
    `${GOOGLE_BASE_URL}/place/autocomplete/json?input=${encodeURIComponent(trimmed)}` +
    `&key=${GOOGLE_API_KEY}&components=country:in`;
  const json = await jsonFetch(url);

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error("Could not search locations right now.");
  }

  return json.predictions || [];
};

export const getPlaceDetails = async (placeId) => {
  const url =
    `${GOOGLE_BASE_URL}/place/details/json?place_id=${encodeURIComponent(placeId)}` +
    `&fields=formatted_address,address_components,geometry,name&key=${GOOGLE_API_KEY}`;
  const json = await jsonFetch(url);

  if (json.status !== "OK" || !json.result?.geometry?.location) {
    throw new Error("Could not load this location.");
  }

  const { lat, lng } = json.result.geometry.location;
  return {
    ...parseGoogleAddress(json.result),
    latitude: lat,
    longitude: lng,
  };
};

export const geocodeTypedAddress = async ({ address1, address2, city, state }) => {
  const query = [address1, address2, city, state].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const url =
    `${GOOGLE_BASE_URL}/geocode/json?address=${encodeURIComponent(query)}` +
    `&key=${GOOGLE_API_KEY}`;
  const json = await jsonFetch(url);

  if (json.status !== "OK" || !json.results?.length) return null;
  const { lat, lng } = json.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
};

export const formatLocationAddress = (source = {}) =>
  [
    source.address1,
    source.address2,
    source.city,
    source.state,
  ].filter(Boolean).join(", ");

export const getStaticMapUrl = ({ latitude, longitude, width = 640, height = 260 }) => {
  if (latitude == null || longitude == null) return null;
  return (
    `${GOOGLE_BASE_URL}/staticmap?center=${latitude},${longitude}` +
    `&zoom=15&size=${width}x${height}&scale=2&markers=color:red%7C${latitude},${longitude}` +
    `&key=${GOOGLE_API_KEY}`
  );
};
