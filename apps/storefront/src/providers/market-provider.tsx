"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MarketCode } from "@bangla-blend/types";
import { getMarket } from "@/config/site";

interface MarketContextValue {
  marketCode: MarketCode;
  market: ReturnType<typeof getMarket>;
  setMarketCode: (code: MarketCode) => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children, initialMarket }: { children: ReactNode; initialMarket: MarketCode }) {
  const [marketCode, setMarketCode] = useState(initialMarket);
  const value = useMemo(
    () => ({ marketCode, market: getMarket(marketCode), setMarketCode }),
    [marketCode]
  );
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error("useMarket must be used inside MarketProvider");
  return context;
}
