import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@bangla-blend/supabase-client";
import type {
  CurrencyCode,
  MarketCode,
  Product,
  ProductVariant,
  StorefrontCatalog,
  StorefrontSection,
} from "@bangla-blend/types";
import { sampleProducts, withMarketPrices } from "./fixtures";

export interface CommerceConfig {
  supabase: SupabaseClient<Database>;
  market: MarketCode;
  currencyCode: CurrencyCode;
  allowDevelopmentFallback?: boolean;
}

export class CommerceUnavailableError extends Error {
  constructor(message = "The commerce service is not configured or unavailable.") {
    super(message);
    this.name = "CommerceUnavailableError";
  }
}

const PRODUCT_SELECT = `
  id, handle, title, subtitle, description, status, thumbnail_url, thumbnail_alt, region,
  storage, shelf_life, usage_notes, ingredients, eligible_markets, badges, best_seller,
  is_placeholder, verified, gift_type, created_at,
  collection:product_collections!products_collection_id_fkey ( handle ),
  images:product_images ( url, alt_text, sort_order ),
  catalogs:storefront_catalog_products ( catalog:storefront_catalogs ( id, name, handle, description, navigation_image_url, navigation_image_alt, hero_image_url, hero_image_alt, section, experience, box_size, is_active ) ),
  variants:product_variants (
    id, title, sku, sort_order,
    prices:product_prices ( currency_code, amount ),
    inventory_levels ( stocked_quantity, reserved_quantity )
  )
` as const;

interface ProductRow {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: string;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  region: string | null;
  storage: string | null;
  shelf_life: string | null;
  usage_notes: string | null;
  ingredients: string | null;
  eligible_markets: string[];
  badges: string[];
  best_seller: boolean;
  is_placeholder: boolean;
  verified: boolean;
  gift_type: "corporate" | "set" | "regional" | null;
  created_at: string;
  collection: { handle: string } | { handle: string }[] | null;
  images: Array<{ url: string; alt_text: string | null; sort_order: number }> | null;
  catalogs: Array<{
    catalog: {
      id: string;
      name: string;
      handle: string;
      description: string | null;
      navigation_image_url: string | null;
      navigation_image_alt: string | null;
      hero_image_url: string | null;
      hero_image_alt: string | null;
      section: string;
      experience: string;
      box_size: number | null;
      is_active: boolean;
    } | null;
  }> | null;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    sort_order: number;
    prices: Array<{ currency_code: string; amount: number }> | null;
    inventory_levels: Array<{ stocked_quantity: number; reserved_quantity: number }> | null;
  }> | null;
}

const storefrontSections: StorefrontSection[] = [
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
  "gifts",
];

function isStorefrontSection(value: unknown): value is StorefrontSection {
  return typeof value === "string" && storefrontSections.includes(value as StorefrontSection);
}

function adaptCatalog(row: NonNullable<ProductRow["catalogs"]>[number]["catalog"]): StorefrontCatalog | undefined {
  if (!row || !row.is_active || !isStorefrontSection(row.section)) return undefined;
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    description: row.description ?? undefined,
    ...(row.navigation_image_url ? { navigationImage: row.navigation_image_url } : {}),
    ...(row.navigation_image_alt ? { navigationImageAlt: row.navigation_image_alt } : {}),
    ...(row.hero_image_url ? { heroImage: row.hero_image_url } : {}),
    ...(row.hero_image_alt ? { heroImageAlt: row.hero_image_alt } : {}),
    section: row.section,
    experience: row.experience === "build_a_box" ? "build_a_box" : "listing",
    boxSize: row.box_size ?? undefined,
    active: row.is_active,
  };
}

function adaptVariant(variant: NonNullable<ProductRow["variants"]>[number], currencyCode: CurrencyCode): ProductVariant {
  const price = variant.prices?.find((p) => p.currency_code.toUpperCase() === currencyCode);
  const inventoryQuantity = (variant.inventory_levels ?? []).reduce(
    (total, level) => total + Math.max(0, level.stocked_quantity - level.reserved_quantity),
    0,
  );
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? undefined,
    price: { amount: price?.amount ?? 0, currencyCode },
    inventoryQuantity,
  };
}

function adaptProduct(row: ProductRow, currencyCode: CurrencyCode): Product {
  const collectionHandle = Array.isArray(row.collection) ? row.collection[0]?.handle : row.collection?.handle;
  const collection = isStorefrontSection(collectionHandle) ? collectionHandle : "originals";
  const images = (row.images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({ url: image.url, alt: image.alt_text ?? row.title }));
  const variants = (row.variants ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((variant) => adaptVariant(variant, currencyCode));
  const catalogs = (row.catalogs ?? [])
    .map((entry) => adaptCatalog(entry.catalog))
    .filter((catalog): catalog is StorefrontCatalog => Boolean(catalog));

  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description ?? "",
    collection,
    catalogs,
    region: row.region ?? undefined,
    thumbnail: row.thumbnail_url ?? undefined,
    thumbnailAlt: row.thumbnail_alt ?? undefined,
    images,
    badges: row.badges ?? [],
    eligibleMarkets: (row.eligible_markets ?? []) as MarketCode[],
    variants,
    ingredients: row.ingredients ?? undefined,
    storage: row.storage ?? undefined,
    shelfLife: row.shelf_life ?? undefined,
    usage: row.usage_notes ?? undefined,
    isPlaceholder: row.is_placeholder,
    verified: row.verified,
    bestSeller: row.best_seller,
    giftType: row.gift_type ?? undefined,
    createdAt: row.created_at,
  };
}

function fallbackProducts(config: CommerceConfig, query: string) {
  return withMarketPrices(sampleProducts, config.market).filter((product) =>
    matchesProductQuery(product, query),
  );
}

function matchesProductQuery(product: Product, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const catalogTerms = (product.catalogs ?? [])
    .flatMap((catalog) => [catalog.name, catalog.handle, catalog.section])
    .join(" ");
  return [product.title, product.subtitle, product.description, product.region, product.badges.join(" "), catalogTerms]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export async function listProducts(config: CommerceConfig, query = ""): Promise<Product[]> {
  try {
    const { data, error } = await config.supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .eq("verified", true)
      .is("deleted_at", null)
      .contains("eligible_markets", [config.market]);
    if (error) throw new CommerceUnavailableError(`Supabase returned: ${error.message}`);
    const products = ((data ?? []) as unknown as ProductRow[]).map((row) => adaptProduct(row, config.currencyCode));
    const results = products.filter((product) => matchesProductQuery(product, query));
    if (results.length === 0 && config.allowDevelopmentFallback) return fallbackProducts(config, query);
    return results;
  } catch (error) {
    if (config.allowDevelopmentFallback) return fallbackProducts(config, query);
    if (error instanceof CommerceUnavailableError) throw error;
    throw new CommerceUnavailableError(
      error instanceof Error ? `The commerce catalog service could not be reached: ${error.message}` : undefined,
    );
  }
}

export async function getProduct(config: CommerceConfig, handle: string): Promise<Product | undefined> {
  try {
    const { data, error } = await config.supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("handle", handle)
      .eq("status", "published")
      .eq("verified", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new CommerceUnavailableError(`Supabase returned: ${error.message}`);
    if (!data) {
      if (config.allowDevelopmentFallback) return fallbackProducts(config, "").find((p) => p.handle === handle);
      return undefined;
    }
    return adaptProduct(data as unknown as ProductRow, config.currencyCode);
  } catch (error) {
    if (config.allowDevelopmentFallback) return fallbackProducts(config, "").find((p) => p.handle === handle);
    if (error instanceof CommerceUnavailableError) throw error;
    throw new CommerceUnavailableError(
      error instanceof Error ? `The commerce catalog service could not be reached: ${error.message}` : undefined,
    );
  }
}

export async function listStorefrontCatalogs(
  config: CommerceConfig,
  section?: StorefrontSection,
): Promise<StorefrontCatalog[]> {
  try {
    let request = config.supabase
      .from("storefront_catalogs")
      .select("id, name, handle, description, navigation_image_url, navigation_image_alt, hero_image_url, hero_image_alt, section, experience, box_size, is_active")
      .eq("is_active", true);
    if (section) request = request.eq("section", section);
    const { data, error } = await request;
    if (error) throw new CommerceUnavailableError(`Supabase returned: ${error.message}`);
    return (data ?? [])
      .map((row) => adaptCatalog(row as never))
      .filter((catalog): catalog is StorefrontCatalog => Boolean(catalog))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    if (config.allowDevelopmentFallback) return [];
    if (error instanceof CommerceUnavailableError) throw error;
    throw new CommerceUnavailableError(
      error instanceof Error ? `The commerce catalog service could not be reached: ${error.message}` : undefined,
    );
  }
}

export function formatMoney(amount: number, currencyCode: string, locale = "en-BD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "BDT" ? 0 : 2,
  }).format(amount);
}

export { activeCatalogRevision, activeProductHandles } from "./fixtures";
