"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MarketCode } from "@bangla-blend/types";
import { markets } from "@/config/site";
import { useMarket } from "@/providers/market-provider";

export function DestinationSelector() {
  const router = useRouter();
  const { marketCode, setMarketCode } = useMarket();
  const [pending, startTransition] = useTransition();

  return (
    <div className="destination-control">
      <select
        id="destination"
        aria-label="Delivery destination"
        value={marketCode}
        disabled={pending}
        onChange={(event) => {
          const code = event.target.value as MarketCode;
          startTransition(async () => {
            const response = await fetch("/api/market", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ market: code })
            });
            if (response.ok) {
              setMarketCode(code);
              router.refresh();
            }
          });
        }}
      >
        {markets.map((market) => (
          <option key={market.code} value={market.code} disabled={!market.enabled}>
            {market.shortLabel} · {market.currency}{market.enabled ? "" : " · Soon"}
          </option>
        ))}
      </select>
    </div>
  );
}
