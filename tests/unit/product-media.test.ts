import { describe, expect, it } from "vitest";
import { listProducts, listStorefrontCatalogs, type CommerceConfig } from "../../packages/commerce-client/src";
import { getProductMedia } from "../../apps/storefront/src/lib/product-presentation";

// Minimal fake of the Supabase query-builder chain commerce-client actually calls
// (.from().select().eq()...contains()/maybeSingle()), thenable so `await` resolves it directly.
// Filter arguments are ignored -- these tests exercise the row-adaptation logic (media/alt-text/
// catalog shaping), not Postgres filtering, which is covered by the RLS/schema smoke tests in
// supabase/migrations instead.
function fakeSupabase(table: string, rows: unknown[]) {
  const builder: Record<string, unknown> & PromiseLike<{ data: unknown; error: null }> = {
    eq: () => builder,
    is: () => builder,
    contains: () => builder,
    in: () => builder,
    order: () => builder,
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve: (value: { data: unknown; error: null }) => unknown) => resolve({ data: rows, error: null }),
  };
  return {
    from: (calledTable: string) => {
      if (calledTable !== table) throw new Error(`Unexpected table in test: ${calledTable}`);
      return { select: () => builder };
    },
  };
}

function baseConfig(supabase: ReturnType<typeof fakeSupabase>): CommerceConfig {
  return { supabase: supabase as never, market: "bd", currencyCode: "BDT" };
}

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod_media",
    handle: "media-product",
    title: "Media Product",
    subtitle: null,
    description: "A product with managed media.",
    status: "published",
    thumbnail_url: "https://cdn.example/products/media-front.jpg",
    thumbnail_alt: "Front of the Media Product jar",
    region: null,
    storage: null,
    shelf_life: null,
    usage_notes: "Stir one teaspoon into the dish near the end of cooking.",
    ingredients: null,
    eligible_markets: ["bd"],
    badges: ["Storefront badge", "Gift-ready"],
    best_seller: false,
    is_placeholder: false,
    verified: true,
    gift_type: null,
    created_at: "2026-01-01T00:00:00.000Z",
    collection: { handle: "originals" },
    images: [
      { url: "https://cdn.example/products/media-front.jpg", alt_text: "Front of the Media Product jar", sort_order: 0 },
      { url: "https://cdn.example/products/media-back.jpg", alt_text: "Back label with ingredients", sort_order: 1 },
    ],
    catalogs: [],
    variants: [
      {
        id: "variant_media",
        title: "80 g",
        sku: "MEDIA-80",
        sort_order: 0,
        prices: [{ currency_code: "bdt", amount: 320 }],
      },
    ],
    ...overrides,
  };
}

describe("product media adaptation", () => {
  it("uses managed thumbnail and per-image alt text", async () => {
    const config = baseConfig(fakeSupabase("products", [productRow()]));
    const [product] = await listProducts(config);

    expect(product?.thumbnail).toBe("https://cdn.example/products/media-front.jpg");
    expect(product?.thumbnailAlt).toBe("Front of the Media Product jar");
    expect(product?.badges).toEqual(["Storefront badge", "Gift-ready"]);
    expect(product?.usage).toBe("Stir one teaspoon into the dish near the end of cooking.");
    expect(product?.images).toEqual([
      { url: "https://cdn.example/products/media-front.jpg", alt: "Front of the Media Product jar" },
      { url: "https://cdn.example/products/media-back.jpg", alt: "Back label with ingredients" },
    ]);
  });

  it("falls back to the product title when an image has no alt text", async () => {
    const config = baseConfig(
      fakeSupabase("products", [
        productRow({
          thumbnail_url: null,
          thumbnail_alt: null,
          images: [{ url: "/uploads/media-side.jpg", alt_text: null, sort_order: 0 }],
        }),
      ]),
    );
    const [product] = await listProducts(config);

    expect(product?.thumbnail).toBeUndefined();
    expect(product?.images).toEqual([{ url: "/uploads/media-side.jpg", alt: "Media Product" }]);
  });

  it("deduplicates the thumbnail and gallery while preserving the authoritative thumbnail alt", async () => {
    const config = baseConfig(fakeSupabase("products", [productRow()]));
    const [product] = await listProducts(config);
    expect(product).toBeDefined();

    const media = getProductMedia(product!);
    expect(media).toHaveLength(2);
    expect(media[0]).toEqual({ url: "https://cdn.example/products/media-front.jpg", alt: "Front of the Media Product jar" });
  });

  it("adapts active storefront catalog assignments and drops inactive ones", async () => {
    const config = baseConfig(
      fakeSupabase("products", [
        productRow({
          catalogs: [
            {
              catalog: {
                id: "cat_build_box",
                name: "Build a Box",
                handle: "build-a-box",
                description: null,
                section: "gifts",
                experience: "build_a_box",
                box_size: 4,
                is_active: true,
              },
            },
            {
              catalog: {
                id: "cat_seasonal",
                name: "Seasonal",
                handle: "seasonal",
                description: null,
                section: "gifts",
                experience: "listing",
                box_size: null,
                is_active: false,
              },
            },
          ],
        }),
      ]),
    );
    const [product] = await listProducts(config);

    expect(product?.catalogs).toEqual([
      { id: "cat_build_box", name: "Build a Box", handle: "build-a-box", description: undefined, section: "gifts", experience: "build_a_box", boxSize: 4, active: true },
    ]);
  });

  it("finds products by an assigned catalog name in the storefront search fallback", async () => {
    const config = baseConfig(
      fakeSupabase("products", [
        productRow({
          catalogs: [
            {
              catalog: { id: "cat_build_box", name: "Build a Box", handle: "build-a-box", description: null, section: "gifts", experience: "build_a_box", box_size: 3, is_active: true },
            },
          ],
        }),
      ]),
    );

    await expect(listProducts(config, "Build a Box")).resolves.toHaveLength(1);
    await expect(listProducts(config, "Not this catalog")).resolves.toEqual([]);
  });
});

describe("storefront catalog discovery", () => {
  it("lists active catalogs and filters by section", async () => {
    const config = baseConfig(
      fakeSupabase("storefront_catalogs", [
        { id: "cat_build_box", name: "Build a Box", handle: "build-a-box", description: "Choose four products.", section: "gifts", experience: "build_a_box", box_size: 4, is_active: true },
      ]),
    );

    await expect(listStorefrontCatalogs(config, "gifts")).resolves.toEqual([
      { id: "cat_build_box", name: "Build a Box", handle: "build-a-box", description: "Choose four products.", section: "gifts", experience: "build_a_box", boxSize: 4, active: true },
    ]);
  });

  it("adapts separate navigation and page-header catalog images", async () => {
    const config = baseConfig(
      fakeSupabase("storefront_catalogs", [
        {
          id: "cat_media",
          name: "New one",
          handle: "new-one",
          description: "A gift catalog.",
          navigation_image_url: "https://cdn.example/catalog-navigation.jpg",
          navigation_image_alt: "A wrapped gift",
          hero_image_url: "https://cdn.example/catalog-hero.jpg",
          hero_image_alt: "A collection of Bangla Blend gifts",
          section: "gifts",
          experience: "listing",
          box_size: null,
          is_active: true,
        },
      ]),
    );

    await expect(listStorefrontCatalogs(config, "gifts")).resolves.toEqual([
      expect.objectContaining({
        navigationImage: "https://cdn.example/catalog-navigation.jpg",
        navigationImageAlt: "A wrapped gift",
        heroImage: "https://cdn.example/catalog-hero.jpg",
        heroImageAlt: "A collection of Bangla Blend gifts",
      }),
    ]);
  });
});

describe("product publishing visibility", () => {
  it("removes soft-deleted variants from every storefront product", async () => {
    const config = baseConfig(
      fakeSupabase("products", [
        productRow({
          variants: [
            {
              id: "variant_deleted",
              title: "60 g",
              sku: "MEDIA-60",
              sort_order: 0,
              deleted_at: "2026-08-16T07:58:24.091Z",
              prices: [{ currency_code: "bdt", amount: 420 }],
            },
            {
              id: "variant_active",
              title: "100 g",
              sku: "MEDIA-100",
              sort_order: 1,
              deleted_at: null,
              prices: [{ currency_code: "bdt", amount: 200 }],
            },
          ],
        }),
      ]),
    );

    const [product] = await listProducts(config);

    expect(product?.variants).toEqual([
      expect.objectContaining({ id: "variant_active", title: "100 g", price: { amount: 200, currencyCode: "BDT" } }),
    ]);
  });

  it("shows placeholder products only when development fallbacks are enabled and Supabase returns none", async () => {
    const config: CommerceConfig = { ...baseConfig(fakeSupabase("products", [])), allowDevelopmentFallback: true };
    const products = await listProducts(config);
    // Falls back to packages/commerce-client/src/fixtures.ts sample data.
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.isPlaceholder)).toBe(true);
  });

  it("returns an empty list when Supabase has no verified products and fallbacks are disabled", async () => {
    const config = baseConfig(fakeSupabase("products", []));
    await expect(listProducts(config)).resolves.toEqual([]);
  });
});
