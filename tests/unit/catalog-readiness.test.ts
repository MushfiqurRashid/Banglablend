import { describe, expect, it } from "vitest";
import {
  getCatalogReadiness,
  type CatalogProductRecord,
} from "../../apps/medusa/src/lib/admin/catalog";

function completeProduct(overrides: Partial<CatalogProductRecord> = {}): CatalogProductRecord {
  return {
    id: "prod_ready",
    title: "Ready Product",
    handle: "ready-product",
    description: "A complete product description.",
    status: "published",
    thumbnail: "https://cdn.example/ready-product.jpg",
    metadata: {
      verified: true,
      is_placeholder: false,
      eligible_markets: ["bd"],
    },
    variants: [
      {
        id: "variant_ready",
        title: "80 g",
        sku: "BB-READY-80",
        prices: [{ amount: 320, currency_code: "bdt" }],
      },
    ],
    ...overrides,
  };
}

describe("superadmin catalog publishing readiness", () => {
  it("accepts a fully managed and published product", () => {
    expect(getCatalogReadiness(completeProduct())).toEqual({
      ready: true,
      missing: [],
      checks: {
        description: true,
        media: true,
        variant: true,
        price: true,
        market: true,
        verified: true,
        published: true,
      },
    });
  });

  it("reports every storefront blocker in operator-friendly terms", () => {
    const readiness = getCatalogReadiness(
      completeProduct({
        description: " ",
        status: "draft",
        thumbnail: null,
        images: [],
        metadata: { verified: false, is_placeholder: true, eligible_markets: [] },
        variants: [{ id: "variant_incomplete", title: "80 g", sku: "", prices: [] }],
      }),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.missing).toEqual([
      "description",
      "product image",
      "variant and SKU",
      "positive price",
      "eligible market",
      "catalog verification",
      "published status",
    ]);
  });
});
