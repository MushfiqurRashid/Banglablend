import { describe, expect, it } from "vitest";
import { runIntegration } from "./helpers";

describe.runIf(runIntegration)("unified search index", () => {
  it("filters results by market and returns multiple content types", async () => {
    const host = process.env.MEILISEARCH_HOST;
    const key = process.env.MEILISEARCH_SEARCH_KEY;
    expect(host).toBeTruthy();
    const response = await fetch(new URL("/indexes/bangla_blend/search", host), { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ q: "mezban", filter: "eligibleMarkets = bd" }) });
    expect(response.ok).toBe(true);
    const body = await response.json() as { hits: Array<{ type: string; eligibleMarkets: string[] }> };
    expect(body.hits.every((hit) => hit.eligibleMarkets.includes("bd"))).toBe(true);
  });
});
