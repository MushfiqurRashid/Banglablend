"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import type { MarketCode } from "@bangla-blend/types";
import { MarketProvider } from "./market-provider";
import { CartProvider } from "./cart-provider";

export function AppProviders({
  children,
  initialMarket,
}: {
  children: ReactNode;
  initialMarket: MarketCode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
      <QueryClientProvider client={queryClient}>
        <MarketProvider initialMarket={initialMarket}>
          <CartProvider>{children}</CartProvider>
        </MarketProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
