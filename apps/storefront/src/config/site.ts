import type { MarketCode } from "@bangla-blend/types";
import { markets } from "@bangla-blend/commerce-client/fixtures";

function deploymentUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;
  const configuredIsLocal =
    configuredUrl?.startsWith("http://localhost") ||
    configuredUrl?.startsWith("http://127.0.0.1");
  const value =
    vercelHost && (!configuredUrl || configuredIsLocal)
      ? `https://${vercelHost}`
      : configuredUrl || "http://localhost:3000";

  return value.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "Bangla Blend",
  tagline: "The Taste of Bangladesh",
  description: "Regional flavors, pantry essentials, gifts and stories inspired by Bangladesh.",
  url: deploymentUrl(),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@banglablend.local",
  socialLinks: [
    { label: "Facebook", href: "https://www.facebook.com/banglablend.spices" },
    { label: "Instagram", href: "https://www.instagram.com/bangla_blend?igsh=MW1vZzc1MHJ5OGRuMg==" },
    { label: "YouTube", href: "https://www.youtube.com/@bangla-blend" },
  ],
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
