import "server-only";
import type { MarketCode } from "@bangla-blend/types";
import type { CommerceConfig } from "@bangla-blend/commerce-client";
import { createSupabasePublicClient } from "@bangla-blend/supabase-client";
import { getMarket } from "@/config/site";

export function getCommerceConfig(marketCode: MarketCode): CommerceConfig {
  const market = getMarket(marketCode);
  return {
    supabase: createSupabasePublicClient(),
    market: marketCode,
    currencyCode: market.currency,
    allowDevelopmentFallback:
      process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true",
  };
}
