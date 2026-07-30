import { afterEach, describe, expect, it, vi } from "vitest";
import { listProducts } from "../../packages/commerce-client/src";
import {
  activeCatalogRevision,
} from "../../packages/commerce-client/src/fixtures";
import { getProductMedia } from "../../apps/storefront/src/lib/product-presentation";

const config = {
  backendUrl: "https://commerce.example",
  publishableKey: "pk_test",
  market: "bd" as const,
};

function medusaProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod_media",
    handle: "media-product",
    title: "Media Product",
    description: "A product with managed media.",
    thumbnail: "https://cdn.example/products/media-front.jpg",
    images: [
      { url: "https://cdn.example/products/media-front.jpg" },
      { url: "https://cdn.example/products/media-back.jpg" },
    ],
    collection: { handle: "originals" },
    tags: [],
    variants: [
      {
        id: "variant_media",
        title: "80 g",
        inventory_quantity: 10,
        calculated_price: { calculated_amount: 320, currency_code: "bdt" },
      },
    ],
    metadata: {
      verified: true,
      eligible_markets: ["bd"],
      product_badges: ["Storefront badge", "Gift-ready"],
      usage: "Stir one teaspoon into the dish near the end of cooking.",
      thumbnail_alt: "Front of the Media Product jar",
      image_alt_texts: {
        "https://cdn.example/products/media-back.jpg":
          "  Back label <strong>with ingredients</strong>\u0000  ",
      },
    },
    ...overrides,
  };
}

function mockProducts(products: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ products }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("product media adaptation", () => {
  it("uses managed thumbnail and per-image alt text while normalizing it to plain text", async () => {
    mockProducts([medusaProduct()]);

    const [product] = await listProducts(config);

    expect(product?.thumbnail).toBe("https://cdn.example/products/media-front.jpg");
    expect(product?.thumbnailAlt).toBe("Front of the Media Product jar");
    expect(product?.badges).toEqual(["Storefront badge", "Gift-ready"]);
    expect(product?.usage).toBe("Stir one teaspoon into the dish near the end of cooking.");
    expect(product?.images).toEqual([
      {
        url: "https://cdn.example/products/media-front.jpg",
        alt: "Front of the Media Product jar",
      },
      {
        url: "https://cdn.example/products/media-back.jpg",
        alt: "Back label with ingredients",
      },
    ]);
  });

  it("falls back to the product title and rejects unusable media URLs", async () => {
    mockProducts([
      medusaProduct({
        thumbnail: "javascript:alert(1)",
        images: [{ url: "" }, { url: "/uploads/media-side.jpg" }],
        metadata: {
          verified: true,
          eligible_markets: ["bd"],
          image_alt_texts: {
            "/uploads/media-side.jpg": 42,
          },
        },
      }),
    ]);

    const [product] = await listProducts(config);

    expect(product?.thumbnail).toBeUndefined();
    expect(product?.thumbnailAlt).toBeUndefined();
    expect(product?.images).toEqual([{ url: "/uploads/media-side.jpg", alt: "Media Product" }]);
  });

  it("deduplicates the thumbnail and gallery while preserving the authoritative thumbnail alt", async () => {
    mockProducts([medusaProduct()]);

    const [product] = await listProducts(config);
    expect(product).toBeDefined();

    const media = getProductMedia(product!);

    expect(media).toHaveLength(2);
    expect(media[0]).toEqual({
      url: "https://cdn.example/products/media-front.jpg",
      alt: "Front of the Media Product jar",
    });
  });
});

describe("product publishing visibility", () => {
  it("uses the current fixture when an allowed backend product has a stale revision", async () => {
    mockProducts([
      medusaProduct({
        id: "prod_stale_mezban",
        handle: "mezban-masala",
        title: "Old Mezban Masala",
      }),
    ]);

    const products = await listProducts({
      ...config,
      allowDevelopmentFallback: true,
      allowedProductHandles: ["mezban-masala"],
      requiredCatalogRevision: activeCatalogRevision,
    });

    expect(products).toHaveLength(1);
    expect(products[0]?.title).toBe("Mezban Masala");
    expect(products[0]?.variants.map((variant) => variant.title)).toEqual([
      "75 g",
      "100 g",
    ]);
  });

  it("hides stale backend products outside the storefront catalog allowlist", async () => {
    mockProducts([
      medusaProduct({
        id: "prod_current",
        handle: "mezban-masala",
        title: "Mezban Masala",
      }),
      medusaProduct({
        id: "prod_retired",
        handle: "hill-tracts-turmeric",
        title: "Hill Tracts Turmeric",
      }),
    ]);

    const products = await listProducts({
      ...config,
      allowedProductHandles: ["mezban-masala"],
    });

    expect(products.map((product) => product.handle)).toEqual(["mezban-masala"]);
  });

  it("shows clearly marked placeholder products only when development fallbacks are enabled", async () => {
    mockProducts([
      medusaProduct({
        id: "prod_preview",
        handle: "preview-product",
        metadata: {
          verified: false,
          is_placeholder: true,
          eligible_markets: ["bd"],
        },
      }),
    ]);

    const products = await listProducts({
      ...config,
      allowDevelopmentFallback: true,
    });

    expect(products.map((product) => product.handle)).toEqual(["preview-product"]);
    expect(products[0]?.isPlaceholder).toBe(true);
    expect(products[0]?.verified).toBe(false);
  });

  it("keeps placeholder products hidden when development fallbacks are disabled", async () => {
    mockProducts([
      medusaProduct({
        id: "prod_preview",
        handle: "preview-product",
        metadata: {
          verified: false,
          is_placeholder: true,
          eligible_markets: ["bd"],
        },
      }),
    ]);

    await expect(listProducts(config)).resolves.toEqual([]);
  });
});
