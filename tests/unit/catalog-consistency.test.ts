import { describe, expect, it } from "vitest";
import {
  activeCatalogRevision as storefrontCatalogRevision,
  activeProductHandles,
  sampleProducts,
} from "../../packages/commerce-client/src/fixtures";
import {
  activeCatalogRevision as medusaCatalogRevision,
  sampleCatalog,
} from "../../apps/medusa/src/seeds/catalog";

describe("active product catalog", () => {
  it("keeps storefront fixtures, the storefront allowlist, and Medusa seed handles aligned", () => {
    const fixtureHandles = sampleProducts.map((product) => product.handle).sort();
    const medusaHandles = sampleCatalog.map((product) => product.handle).sort();

    expect([...activeProductHandles].sort()).toEqual(fixtureHandles);
    expect(medusaHandles).toEqual(fixtureHandles);
    expect(new Set(fixtureHandles).size).toBe(fixtureHandles.length);
    expect(medusaCatalogRevision).toBe(storefrontCatalogRevision);
  });
});
