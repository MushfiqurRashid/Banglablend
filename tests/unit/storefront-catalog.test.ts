import { describe, expect, it } from "vitest";
import {
  createStorefrontCatalogSchema,
  isManagedStorefrontCatalog,
  normalizeStorefrontCatalog,
  storefrontCatalogMetadata,
} from "../../apps/medusa/src/lib/admin/storefront-catalog";

const buildABoxCategory = {
  id: "pcat_build_box",
  name: "Build a Box",
  handle: "build-a-box",
  description: "Choose products for your own box.",
  is_active: true,
  is_internal: false,
  parent_category_id: "pcat_gifts",
  parent_category: { id: "pcat_gifts", name: "Gifts", handle: "gifts" },
  metadata: { storefront_experience: "build_a_box", box_size: 4 },
  products: [{ id: "prod_one" }, { id: "prod_two" }],
};

describe("managed storefront catalogs", () => {
  it("recognizes a nested category beneath a fixed storefront section", () => {
    expect(isManagedStorefrontCatalog(buildABoxCategory)).toBe(true);
    expect(normalizeStorefrontCatalog(buildABoxCategory)).toEqual({
      id: "pcat_build_box",
      name: "Build a Box",
      handle: "build-a-box",
      description: "Choose products for your own box.",
      section: "gifts",
      experience: "build_a_box",
      box_size: 4,
      is_active: true,
      product_count: 2,
    });
  });

  it("requires a valid box size only for Build a Box experiences", () => {
    expect(
      createStorefrontCatalogSchema.safeParse({
        name: "Build a Box",
        handle: "build-a-box",
        description: null,
        section: "gifts",
        experience: "build_a_box",
        box_size: null,
      }).success,
    ).toBe(false);
    expect(storefrontCatalogMetadata({ experience: "build_a_box", box_size: 5 })).toEqual({
      storefront_catalog: true,
      storefront_experience: "build_a_box",
      box_size: 5,
    });
  });
});
