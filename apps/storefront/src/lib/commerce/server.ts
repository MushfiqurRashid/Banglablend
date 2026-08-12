import "server-only";
import { cookies } from "next/headers";
import { getProduct, listProducts, listStorefrontCatalogs } from "@bangla-blend/commerce-client";
import type { MarketCode, StorefrontSection } from "@bangla-blend/types";
import { MARKET_COOKIE, getMarket, isMarketCode } from "@/config/site";
import { getCommerceConfig } from "./config";

export async function getActiveMarket() {
  const store = await cookies();
  const value = store.get(MARKET_COOKIE)?.value ?? process.env.NEXT_PUBLIC_DEFAULT_MARKET ?? "bd";
  return getMarket(isMarketCode(value) ? value : "bd");
}

export async function getStoreProducts(query = "", marketCode?: MarketCode) {
  const market = marketCode ? getMarket(marketCode) : await getActiveMarket();
  return listProducts(getCommerceConfig(market.code, await cookies()), query);
}

export async function getStoreProduct(handle: string) {
  const market = await getActiveMarket();
  return getProduct(getCommerceConfig(market.code, await cookies()), handle);
}

export async function getStorefrontCatalogs(section?: StorefrontSection) {
  const market = await getActiveMarket();
  return listStorefrontCatalogs(getCommerceConfig(market.code, await cookies()), section);
}
