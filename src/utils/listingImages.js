import apiClient from "../api/client";

const IMAGE_KEYS = [
  "images",
  "image",
  "thumbnail",
  "imageUrl",
  "image_url",
  "imageUrls",
  "image_urls",
  "imagePath",
  "image_path",
  "mainImage",
  "main_image",
  "coverImage",
  "cover_image",
  "photo",
  "photos",
  "photoUrl",
  "photo_url",
  "photoUrls",
  "photo_urls",
  "media",
  "files",
  "listing_image",
  "listingImage",
  "listing_images",
  "listingImages",
];

const URL_KEYS = [
  "url",
  "uri",
  "path",
  "image",
  "image_url",
  "imageUrl",
  "image_path",
  "imagePath",
  "file_path",
  "filePath",
  "thumbnail",
  "thumbnail_url",
  "thumbnailUrl",
];

const getBaseUrl = () => apiClient.defaults.baseURL?.replace(/\/api\/?$/, "") ?? "";

const parseImageList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [trimmed];
      }
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  if (typeof value === "object") return [value];
  return [];
};

const getUrlFromObject = (image) => {
  for (const key of URL_KEYS) {
    if (typeof image?.[key] === "string" && image[key].trim()) {
      return image[key];
    }
  }
  return null;
};

export const resolveImageUrl = (image) => {
  if (!image) return null;

  if (typeof image === "object") {
    return resolveImageUrl(getUrlFromObject(image));
  }

  if (typeof image !== "string") return null;

  const clean = image.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean || clean.includes("undefined")) return null;

  return clean.startsWith("http") || clean.startsWith("file:")
    ? clean
    : `${getBaseUrl()}/${clean}`;
};

const getOrderValue = (image, index) => {
  const value =
    image?.sort_order ??
    image?.sortOrder ??
    image?.display_order ??
    image?.displayOrder ??
    image?.position ??
    image?.order ??
    image?.index ??
    index;

  const number = Number(value);
  return Number.isFinite(number) ? number : index;
};

const isCoverImage = (image) =>
  Boolean(
    image?.is_cover ||
      image?.isCover ||
      image?.is_primary ||
      image?.isPrimary ||
      image?.cover ||
      image?.primary
  );

export const getListingImages = (listing) => {
  if (!listing) return [];

  const candidates = IMAGE_KEYS.flatMap((key) => parseImageList(listing[key]));

  return candidates
    .map((image, index) => ({
      image,
      index,
      url: resolveImageUrl(image),
      cover: typeof image === "object" && isCoverImage(image),
      order: typeof image === "object" ? getOrderValue(image, index) : index,
    }))
    .filter((item) => item.url)
    .sort((a, b) => {
      if (a.cover !== b.cover) return a.cover ? -1 : 1;
      if (a.order !== b.order) return a.order - b.order;
      return a.index - b.index;
    })
    .map((item) => item.url);
};

export const getListingCoverImage = (listing) => getListingImages(listing)[0] ?? null;
