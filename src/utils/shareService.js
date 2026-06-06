// shareService.js — without Firebase
import { Share, Platform } from "react-native";

export const shareListing = async (product, priceText, addressText) => {
  const url   = `https://trado.in/listing/${product.id}`;
  const title = product.title || "Check this listing on Trado";
  const desc  = product.description?.slice(0, 80) || "";

  const message = [
    `🛍️ ${title}`,
    priceText   && `💰 ${priceText}`,
    desc        && desc,
    addressText && `📍 ${addressText}`,
    `\nTrado pe dekho: ${url}`,
  ].filter(Boolean).join("\n");

  await Share.share(
    { message, title, url },
    { dialogTitle: title }
  );
};