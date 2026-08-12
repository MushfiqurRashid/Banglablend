import { describe, expect, it } from "vitest";
import { getCatalogReadiness, type CatalogReadinessProduct } from "../src/lib/catalog";

function product(overrides: Partial<CatalogReadinessProduct> = {}): CatalogReadinessProduct {
  return {
    description: "A reviewed product description.",
    thumbnail_url: "https://example.test/product.webp",
    thumbnail_alt: "A sealed Bangla Blend spice pouch",
    status: "published",
    verified: true,
    is_placeholder: false,
    eligible_markets: ["bd"],
    variants: [{ sku: "BB-100", prices: [{ amount: 450 }], stockQuantity: 10 }],
    ...overrides,
  };
}

describe("catalog publish readiness", () => {
  it("accepts a complete verified product", () => {
    expect(getCatalogReadiness(product())).toEqual(expect.objectContaining({ ready: true, missing: [] }));
  });

  it("requires accessible image text before publish", () => {
    const result = getCatalogReadiness(product({ thumbnail_alt: null }));
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("image alt text");
  });

  it("checks every sellable variant for a positive price", () => {
    const result = getCatalogReadiness(product({ variants: [{ sku: "BB-100", prices: [], stockQuantity: 10 }] }));
    expect(result.missing).toContain("positive price");
  });

  it("warns when every variant is out of stock", () => {
    const result = getCatalogReadiness(product({ variants: [{ sku: "BB-100", prices: [{ amount: 450 }], stockQuantity: 0 }] }));
    expect(result.missing).toContain("available stock");
  });
});
