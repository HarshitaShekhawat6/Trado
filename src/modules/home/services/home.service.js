import apiClient from "../../../api/client";
import { getHomeUser, getCategories } from "../api/home.api";
import { ENDPOINTS } from "../../../api/endpoints";

export const getHomeUserService = async () => {
  const res = await getHomeUser();
  return res.data;
};

const parseProducts = (raw) => {
  if (Array.isArray(raw))              return raw;
  if (Array.isArray(raw?.results))     return raw.results;
  if (Array.isArray(raw?.rows))        return raw.rows;
  if (Array.isArray(raw?.data))        return raw.data;
  if (Array.isArray(raw?.data?.data))  return raw.data.data;
  if (Array.isArray(raw?.listings))    return raw.listings;
  return [];
};

const getListingId = (listing) =>
  listing?.id ?? listing?._id ?? listing?.listing_id ?? listing?.listingId;

const hasImageData = (listing) =>
  Boolean(
    listing?.images || listing?.image || listing?.thumbnail ||
    listing?.imageUrl || listing?.image_url || listing?.photo ||
    listing?.photos || listing?.media || listing?.files ||
    listing?.listing_image || listing?.listingImage ||
    listing?.listing_images || listing?.listingImages
  );

const parseListingDetail = (raw) => {
  if (raw?.data && !Array.isArray(raw.data)) return raw.data;
  if (raw?.listing) return raw.listing;
  if (raw?.result)  return raw.result;
  return raw;
};

// ✅ Top level mein hai — sahi jagah
const hydrateMissingImages = async (listings) => {
  const hydrated = await Promise.allSettled(
    listings.map(async (listing) => {
      if (hasImageData(listing)) return listing;

      const id = getListingId(listing);
      if (!id) return listing;

      const res    = await apiClient.get(`${ENDPOINTS.LISTINGS}/${id}`); // ← fixed
      const detail = parseListingDetail(res.data);
      console.log(`[hydrate] listing ${id} detail:`, JSON.stringify(detail));

      return {
        ...detail,
        ...listing,
        images:         listing.images         ?? detail?.images,
        image:          listing.image          ?? detail?.image,
        thumbnail:      listing.thumbnail      ?? detail?.thumbnail,
        imageUrl:       listing.imageUrl       ?? detail?.imageUrl,
        image_url:      listing.image_url      ?? detail?.image_url,
        photo:          listing.photo          ?? detail?.photo,
        photos:         listing.photos         ?? detail?.photos,
        media:          listing.media          ?? detail?.media,
        files:          listing.files          ?? detail?.files,
        listing_image:  listing.listing_image  ?? detail?.listing_image,
        listingImage:   listing.listingImage   ?? detail?.listingImage,
        listing_images: listing.listing_images ?? detail?.listing_images,
        listingImages:  listing.listingImages  ?? detail?.listingImages,
      };
    })
  );

  return hydrated.map((result, index) =>
    result.status === "fulfilled" ? result.value : listings[index]
  );
};

const parseHomeContent = (raw) => {
  const data = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  return {
    user:          data?.user          ?? data?.profile  ?? null,
    header:        data?.header        ?? null,
    sectionTitles: data?.sectionTitles ?? data?.section_titles ?? null,
    banners: Array.isArray(data?.banners) ? data.banners : data?.banner ? [data.banner] : [],
    sellCta: data?.sellCta ?? data?.sell_cta ?? data?.sellBanner ?? null,
  };
};

export const getProductsService = async (page = 1) => {
  const res = await apiClient.get(`${ENDPOINTS.LISTINGS}?page=${page}&limit=20`);
  return hydrateMissingImages(parseProducts(res.data));
};

export const getRecentProductsService = async () => {
  const res = await apiClient.get(`${ENDPOINTS.LISTINGS}?filter=recent&limit=10`);
  return hydrateMissingImages(parseProducts(res.data));
};

export const getProductsByCategoryService = async (categorySlug, page = 1) => {
  const res = await apiClient.get(`${ENDPOINTS.LISTINGS}?category=${categorySlug}&page=${page}&limit=20`);
  return hydrateMissingImages(parseProducts(res.data));
};

export const searchProductsService = async (query, page = 1, params = {}) => {
  const res = await apiClient.get(ENDPOINTS.SEARCH, {
    params: {
      q:         query,
      page,
      limit:     params.limit     || 30,
      sortBy:    params.sortBy    || "newest",
      category:  params.category  || undefined,
      city:      params.city      || undefined,
      condition: params.condition || undefined,
      priceMin:  params.priceMin  || undefined,
      priceMax:  params.priceMax  || undefined,
      dateRange: params.dateRange || undefined,
    },
  });

  console.log("RAW search item[0]:", JSON.stringify(res.data?.results?.[0] || res.data?.[0]));

  const results = await hydrateMissingImages(parseProducts(res.data));
  return {
    results,
    totalCount: res.data?.totalCount || 0,
    page:       res.data?.page       || page,
    limit:      res.data?.limit      || params.limit || 30,
    totalPages: res.data?.totalPages || 1,
  };
};

export const getCategoriesService = async () => {
  const res = await getCategories();
  if (Array.isArray(res.data))       return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

export const getHomeContentService = async () => {
  const res = await apiClient.get(ENDPOINTS.HOME);
  return parseHomeContent(res.data);
};

export const toggleWishlistService = async (deviceId, listingId) => {
  const res = await apiClient.post(`${ENDPOINTS.WISHLIST}/toggle`, {
    device_id:  deviceId,
    listing_id: listingId,
  });
  return res.data;
};

export const getWishlistService = async (deviceId) => {
  const res = await apiClient.get(`${ENDPOINTS.WISHLIST}?device_id=${deviceId}`);
  return parseProducts(res.data);
};