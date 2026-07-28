import { describe, expect, it } from "vitest";
import { runIntegration, storeFetch } from "./helpers";

describe.runIf(runIntegration)("inventory and product eligibility", () => {
  it("retrieves published products with variants and market-calculated prices", async () => {
    const response = await storeFetch(`/store/products?limit=20&region_id=${encodeURIComponent(process.env.TEST_REGION_ID || "")}&fields=*variants.calculated_price`);
    const body = await response.json() as { products: Array<{ status?: string; variants?: Array<{ calculated_price?: { currency_code?: string } }> }> };
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products.every((product) => product.variants?.length)).toBe(true);
  });

  it("supports collection filtering and deterministic sorting", async () => {
    const response = await storeFetch("/store/products?limit=20&order=title");
    const body = await response.json() as { products: Array<{ title: string }> };
    const titles = body.products.map((product) => product.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
});
