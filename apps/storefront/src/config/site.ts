import type { MarketCode } from "@bangla-blend/types";
import { markets } from "@bangla-blend/commerce-client/fixtures";

export const siteConfig = {
  name: "Bangla Blend",
  tagline: "The Taste of Bangladesh",
  description: "Regional flavors, pantry essentials, gifts and stories inspired by Bangladesh.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@banglablend.local"
};

export const MARKET_COOKIE = "bb_market";
export const CART_COOKIE = "bb_cart";

export function getMarket(code?: string) {
  return markets.find((market) => market.code === code) ?? markets[0]!;
}

export function isMarketCode(value: string): value is MarketCode {
  return markets.some((market) => market.code === value);
}

export { markets };
