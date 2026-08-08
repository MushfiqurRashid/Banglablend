import { describe, expect, it } from "vitest";
import {
  buildCatalogInventoryLevels,
  buildCatalogProductMetadata,
  buildCatalogWorkflowProduct,
  createCatalogProductSchema,
} from "../../apps/medusa/src/lib/admin/product-create";

const baseInput = {
  title: "Mezbani Masala",
  handle: "mezbani-masala",
  subtitle: "A Chattogram classic",
  description: "A complete spice blend for a traditional mezbani curry.",
  thumbnail: "https://example.com/mezbani-masala.webp",
  thumbnail_alt: "A pouch of Bangla Blend Mezbani Masala",
  collection: "originals" as const,
  gift_type: null,
  category_ids: ["pcat_build_a_box"],
  region: "Chattogram",
  ingredients: "Coriander, chilli, cumin",
  storage: "Keep sealed in a cool, dry place.",
  shelf_life: "Best before 12 months.",
  usage: "Use with beef and slow cook.",
  eligible_markets: ["bd" as const],
  badges: ["Signature"],
  best_seller: false,
  storefront_visible: true,
  variants: [
    { title: "100 g", sku: "MEZBANI-100-G", bdt_price: 180, stock_quantity: 24 },
    { title: "150 g", sku: "MEZBANI-150-G", bdt_price: 250, stock_quantity: 12 },
  ],
};

describe("Bangla Blend guided product creation", () => {
  it("maps weight options to independently priced Medusa variants", () => {
    const input = createCatalogProductSchema.parse(baseInput);
    const product = buildCatalogWorkflowProduct(input, {
      collectionId: "pcol_originals",
      categoryIds: ["pcat_build_a_box"],
      shippingProfileId: "sp_default",
      salesChannelId: "sc_web",
      publishedStatus: "published" as never,
      draftStatus: "draft" as never,
    });

    expect(product.collection_id).toBe("pcol_originals");
    expect(product.categories).toEqual([{ id: "pcat_build_a_box" }]);
    expect(product.thumbnail).toBe("https://example.com/mezbani-masala.webp");
    expect(product.images).toEqual([{ url: "https://example.com/mezbani-masala.webp" }]);
    expect(product.options).toEqual([{ title: "Size", values: ["100 g", "150 g"] }]);
    expect(product.variants).toEqual([
      {
        title: "100 g",
        sku: "MEZBANI-100-G",
        manage_inventory: true,
        options: { Size: "100 g" },
        prices: [{ currency_code: "bdt", amount: 180 }],
      },
      {
        title: "150 g",
        sku: "MEZBANI-150-G",
        manage_inventory: true,
        options: { Size: "150 g" },
        prices: [{ currency_code: "bdt", amount: 250 }],
      },
    ]);
  });

  it("initializes each created inventory item at the primary stock location", () => {
    const input = createCatalogProductSchema.parse(baseInput);
    const levels = buildCatalogInventoryLevels(
      input,
      [
        {
          sku: "MEZBANI-150-G",
          inventory_items: [{ inventory_item_id: "iitem_150" }],
        },
        {
          sku: "MEZBANI-100-G",
          inventory_items: [{ inventory_item_id: "iitem_100" }],
        },
      ],
      "sloc_primary",
    );

    expect(levels).toEqual([
      {
        inventory_item_id: "iitem_100",
        location_id: "sloc_primary",
        stocked_quantity: 24,
      },
      {
        inventory_item_id: "iitem_150",
        location_id: "sloc_primary",
        stocked_quantity: 12,
      },
    ]);
  });

  it("records Corporate Gifting as a distinct gift destination subtype", () => {
    const input = createCatalogProductSchema.parse({
      ...baseInput,
      collection: "gifts",
      gift_type: "corporate",
    });

    expect(buildCatalogProductMetadata(input)).toMatchObject({
      gift_type: "corporate",
      eligible_markets: ["bd"],
      verified: true,
      is_placeholder: false,
    });
  });

  it("rejects duplicate variant names or SKUs and incomplete published products", () => {
    const result = createCatalogProductSchema.safeParse({
      ...baseInput,
      description: null,
      thumbnail: null,
      variants: [
        { title: "100 g", sku: "DUPLICATE", bdt_price: 180, stock_quantity: 10 },
        { title: "100 G", sku: "duplicate", bdt_price: 250, stock_quantity: 10 },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("A description is required before publishing.");
    expect(messages).toContain("A product image is required before publishing.");
    expect(messages).toContain("Variant names must be unique.");
    expect(messages).toContain("SKUs must be unique.");
  });
});
