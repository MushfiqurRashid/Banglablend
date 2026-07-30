import "server-only";
import type { MarketCode } from "@bangla-blend/types";
import {
  activeCatalogRevision,
  activeProductHandles,
  type CommerceConfig,
} from "@bangla-blend/commerce-client";
import { getMarket } from "@/config/site";

export function getCommerceConfig(marketCode: MarketCode): CommerceConfig {
  const market = getMarket(marketCode);
  return {
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "",
    publishableKey: process.env.MEDUSA_PUBLISHABLE_API_KEY ?? "",
    regionId: market.regionId,
    market: marketCode,
    allowedProductHandles: activeProductHandles,
    requiredCatalogRevision: activeCatalogRevision,
    allowDevelopmentFallback:
      process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true"
  };
}
