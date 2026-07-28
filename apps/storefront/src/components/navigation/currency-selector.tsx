"use client";

import { useMarket } from "@/providers/market-provider";

export function CurrencySelector() {
  const { market } = useMarket();
  return <span className="currency-indicator" aria-label={`Currency ${market.currency}`}>{market.currency}</span>;
}
