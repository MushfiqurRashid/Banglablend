import "server-only";
import { cookies } from "next/headers";
import { getProduct, listProducts } from "@bangla-blend/commerce-client";
import type { MarketCode } from "@bangla-blend/types";
import { MARKET_COOKIE, getMarket, isMarketCode } from "@/config/site";
import { getCommerceConfig } from "./config";

export async function getActiveMarket() {
  const store = await cookies();
  const value = store.get(MARKET_COOKIE)?.value ?? process.env.NEXT_PUBLIC_DEFAULT_MARKET ?? "bd";
  return getMarket(isMarketCode(value) ? value : "bd");
}

export async function getStoreProducts(query = "", marketCode?: MarketCode) {
  const market = marketCode ? getMarket(marketCode) : await getActiveMarket();
  return listProducts(getCommerceConfig(market.code), query);
}

export async function getStoreProduct(handle: string) {
  const market = await getActiveMarket();
  return getProduct(getCommerceConfig(market.code), handle);
}
