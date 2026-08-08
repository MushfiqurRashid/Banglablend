export const catalogProductFields = [
  "id",
  "title",
  "handle",
  "subtitle",
  "description",
  "status",
  "thumbnail",
  "images.id",
  "images.url",
  "collection.id",
  "collection.title",
  "collection.handle",
  "categories.id",
  "categories.name",
  "categories.handle",
  "categories.is_active",
  "categories.is_internal",
  "categories.parent_category_id",
  "categories.parent_category.id",
  "categories.parent_category.name",
  "categories.parent_category.handle",
  "categories.metadata",
  "tags.id",
  "tags.value",
  "metadata",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.inventory_quantity",
  "variants.prices.id",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "created_at",
  "updated_at",
];

export interface CatalogImage {
  id?: string;
  url: string;
}

export interface CatalogPrice {
  id?: string;
  amount?: number;
  currency_code?: string;
}

export interface CatalogVariant {
  id: string;
  title?: string;
  sku?: string | null;
  manage_inventory?: boolean;
  inventory_quantity?: number;
  prices?: CatalogPrice[];
}

export interface CatalogProductRecord {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  status?: "draft" | "proposed" | "published" | "rejected";
  thumbnail?: string | null;
  images?: CatalogImage[];
  collection?: { id?: string; title?: string; handle?: string } | null;
  categories?: Array<{
    id: string;
    name: string;
    handle: string;
    is_active?: boolean;
    is_internal?: boolean;
    parent_category_id?: string | null;
    parent_category?: { id?: string; name?: string; handle?: string } | null;
    metadata?: Record<string, unknown> | null;
  }>;
  tags?: Array<{ id?: string; value?: string }>;
  metadata?: Record<string, unknown> | null;
  variants?: CatalogVariant[];
  created_at?: string;
  updated_at?: string;
}

export interface CatalogReadiness {
  ready: boolean;
  checks: {
    description: boolean;
    media: boolean;
    variant: boolean;
    price: boolean;
    market: boolean;
    verified: boolean;
    published: boolean;
  };
  missing: string[];
}

export function getCatalogReadiness(product: CatalogProductRecord): CatalogReadiness {
  const metadata = product.metadata ?? {};
  const markets = Array.isArray(metadata.eligible_markets)
    ? metadata.eligible_markets.filter((market) => typeof market === "string")
    : [];
  const variants = product.variants ?? [];
  const checks = {
    description: Boolean(product.description?.trim()),
    media: Boolean(
      product.thumbnail?.trim() || product.images?.some((image) => Boolean(image.url?.trim())),
    ),
    variant: variants.length > 0 && variants.every((variant) => Boolean(variant.sku?.trim())),
    price:
      variants.length > 0 &&
      variants.every((variant) =>
        variant.prices?.some(
          (price) =>
            typeof price.amount === "number" &&
            Number.isFinite(price.amount) &&
            price.amount > 0 &&
            Boolean(price.currency_code?.trim()),
        ),
      ),
    market: markets.length > 0,
    verified: metadata.verified === true && metadata.is_placeholder !== true,
    published: product.status === "published",
  };

  const labels: Record<keyof typeof checks, string> = {
    description: "description",
    media: "product image",
    variant: "variant and SKU",
    price: "positive price",
    market: "eligible market",
    verified: "catalog verification",
    published: "published status",
  };
  const missing = (Object.keys(checks) as Array<keyof typeof checks>)
    .filter((key) => !checks[key])
    .map((key) => labels[key]);

  return {
    ready: missing.length === 0,
    checks,
    missing,
  };
}

export function sanitizeCatalogProduct(product: CatalogProductRecord) {
  return {
    ...product,
    metadata: product.metadata ?? {},
    images: product.images ?? [],
    categories: product.categories ?? [],
    tags: product.tags ?? [],
    variants: product.variants ?? [],
    readiness: getCatalogReadiness(product),
  };
}
