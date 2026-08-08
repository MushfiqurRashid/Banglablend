import type {
  CurrencyCode,
  MarketCode,
  Product,
  StorefrontCatalog,
  StorefrontSection,
} from "@bangla-blend/types";
import { sampleProducts, withMarketPrices } from "./fixtures";

interface MedusaPrice {
  amount: number;
  currency_code: string;
}

interface MedusaVariant {
  id: string;
  title: string;
  sku?: string | null;
  inventory_quantity?: number;
  calculated_price?: { calculated_amount?: number; currency_code?: string };
  prices?: MedusaPrice[];
}

interface MedusaProduct {
  id: string;
  handle: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{ url: string }>;
  collection?: { handle?: string | null } | null;
  categories?: MedusaProductCategory[];
  tags?: Array<{ value: string }>;
  metadata?: Record<string, unknown> | null;
  variants?: MedusaVariant[];
  created_at?: string;
}

interface MedusaProductCategory {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  is_active?: boolean;
  is_internal?: boolean;
  metadata?: Record<string, unknown> | null;
  parent_category?: { id?: string; handle?: string | null } | null;
}

interface MedusaProductCategoryResponse {
  product_categories: MedusaProductCategory[];
}

interface MedusaProductResponse {
  products: MedusaProduct[];
}

export interface CommerceConfig {
  backendUrl: string;
  publishableKey: string;
  regionId?: string;
  market: MarketCode;
  allowDevelopmentFallback?: boolean;
  allowedProductHandles?: readonly string[];
  requiredCatalogRevision?: string;
}

function isCurrency(value: string): value is CurrencyCode {
  return ["BDT", "USD", "GBP", "EUR", "CAD", "AUD", "AED"].includes(value);
}

function safeMediaUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (!url) return undefined;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function safeAltText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const plainText = Array.from(value.replace(/<[^>]*>/g, " "), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127 ? " " : character;
  }).join("");
  const normalized = plainText.replace(/\s+/g, " ").trim().slice(0, 240);
  return normalized || fallback;
}

function imageAltFromMetadata(
  metadata: Record<string, unknown>,
  url: string,
  index: number,
  fallback: string,
) {
  const values = metadata.image_alt_texts;
  if (Array.isArray(values)) return safeAltText(values[index], fallback);
  if (values && typeof values === "object") {
    return safeAltText((values as Record<string, unknown>)[url], fallback);
  }
  return fallback;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
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

function adaptCatalog(category: MedusaProductCategory): StorefrontCatalog | undefined {
  const section = category.parent_category?.handle;
  if (!isStorefrontSection(section) || category.is_internal === true) return undefined;
  const metadata = category.metadata ?? {};
  const experience = metadata.storefront_experience === "build_a_box" ? "build_a_box" : "listing";
  const rawBoxSize = metadata.box_size;
  const boxSize =
    experience === "build_a_box" &&
    typeof rawBoxSize === "number" &&
    Number.isInteger(rawBoxSize) &&
    rawBoxSize >= 2 &&
    rawBoxSize <= 12
      ? rawBoxSize
      : experience === "build_a_box"
        ? 3
        : undefined;

  return {
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description ?? undefined,
    section,
    experience,
    boxSize,
    active: category.is_active !== false,
  };
}

function adaptProduct(product: MedusaProduct): Product {
  const metadata = product.metadata ?? {};
  const eligible = Array.isArray(metadata.eligible_markets)
    ? (metadata.eligible_markets.filter(
        (value): value is MarketCode => typeof value === "string",
      ) as MarketCode[])
    : (["bd"] as MarketCode[]);
  const collection = product.collection?.handle ?? "originals";
  const fallbackAlt = safeAltText(product.title, "Bangla Blend product");
  const thumbnail = safeMediaUrl(product.thumbnail);
  const thumbnailAlt = thumbnail ? safeAltText(metadata.thumbnail_alt, fallbackAlt) : undefined;
  const images = (product.images ?? []).flatMap((image, index) => {
    const url = safeMediaUrl(image.url);
    if (!url) return [];
    const fallback = url === thumbnail ? (thumbnailAlt ?? fallbackAlt) : fallbackAlt;
    return [{ url, alt: imageAltFromMetadata(metadata, url, index, fallback) }];
  });
  const variants = (product.variants ?? [])
    .map((variant) => {
      const calculated = variant.calculated_price;
      const price = variant.prices?.[0];
      const currency = (calculated?.currency_code ?? price?.currency_code ?? "bdt").toUpperCase();
      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku ?? undefined,
        inventoryQuantity: variant.inventory_quantity,
        price: {
          amount: calculated?.calculated_amount ?? price?.amount ?? 0,
          currencyCode: isCurrency(currency) ? currency : "BDT",
        },
      };
    })
    .sort(
      (left, right) =>
        left.price.amount - right.price.amount ||
        left.title.localeCompare(right.title, "en", { numeric: true }),
    );
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    subtitle: product.subtitle ?? undefined,
    description: product.description ?? "",
    collection: [
      "originals",
      "reserve",
      "pantry",
      "tea-wellness",
      "lifestyle-accessories",
      "gifts",
    ].includes(collection)
      ? (collection as Product["collection"])
      : "originals",
    catalogs: (product.categories ?? [])
      .map(adaptCatalog)
      .filter((catalog): catalog is StorefrontCatalog => Boolean(catalog))
      .filter((catalog) => catalog.active),
    region: typeof metadata.region === "string" ? metadata.region : undefined,
    thumbnail,
    thumbnailAlt,
    images,
    badges: Array.from(
      new Set([
        ...(product.tags ?? []).map((tag) => tag.value),
        ...stringList(metadata.product_badges),
      ]),
    ),
    eligibleMarkets: eligible,
    variants,
    ingredients: typeof metadata.ingredients === "string" ? metadata.ingredients : undefined,
    storage: typeof metadata.storage === "string" ? metadata.storage : undefined,
    shelfLife: typeof metadata.shelf_life === "string" ? metadata.shelf_life : undefined,
    usage: typeof metadata.usage === "string" ? metadata.usage : undefined,
    isPlaceholder: metadata.is_placeholder === true,
    verified: metadata.verified === true,
    bestSeller: metadata.best_seller === true,
    giftType:
      metadata.gift_type === "corporate"
        ? "corporate"
        : metadata.gift_type === "regional"
          ? "regional"
          : metadata.gift_type === "set"
            ? "set"
            : undefined,
    createdAt: product.created_at,
  };
}

export async function listStorefrontCatalogs(
  config: CommerceConfig,
  section?: StorefrontSection,
): Promise<StorefrontCatalog[]> {
  if (!config.backendUrl || !config.publishableKey) {
    if (config.allowDevelopmentFallback) return [];
    throw new CommerceUnavailableError();
  }

  const url = new URL("/store/product-categories", config.backendUrl);
  url.searchParams.set("limit", "100");
  url.searchParams.set(
    "fields",
    "id,name,handle,description,is_active,is_internal,metadata,parent_category.id,parent_category.handle",
  );

  try {
    const response = await fetch(url, {
      headers: { "x-publishable-api-key": config.publishableKey },
      cache: "no-store",
    });
    if (!response.ok) throw new CommerceUnavailableError(`Medusa returned ${response.status}.`);
    const payload = (await response.json()) as MedusaProductCategoryResponse;
    return (payload.product_categories ?? [])
      .map(adaptCatalog)
      .filter((catalog): catalog is StorefrontCatalog => Boolean(catalog))
      .filter((catalog) => catalog.active && (!section || catalog.section === section))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    if (config.allowDevelopmentFallback) return [];
    if (error instanceof CommerceUnavailableError) throw error;
    throw new CommerceUnavailableError(
      error instanceof Error
        ? `The commerce catalog service could not be reached: ${error.message}`
        : undefined,
    );
  }
}

export class CommerceUnavailableError extends Error {
  constructor(message = "The commerce service is not configured or unavailable.") {
    super(message);
    this.name = "CommerceUnavailableError";
  }
}

function fallbackProducts(config: CommerceConfig, query: string) {
  const allowedHandles = config.allowedProductHandles
    ? new Set(config.allowedProductHandles)
    : undefined;
  return withMarketPrices(sampleProducts, config.market)
    .filter((product) => !allowedHandles || allowedHandles.has(product.handle))
    .filter((product) => matchesProductQuery(product, query));
}

function matchesProductQuery(product: Product, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const catalogTerms = (product.catalogs ?? [])
    .flatMap((catalog) => [catalog.name, catalog.handle, catalog.section])
    .join(" ");
  return [
    product.title,
    product.subtitle,
    product.description,
    product.region,
    product.badges.join(" "),
    catalogTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export async function listProducts(config: CommerceConfig, query = ""): Promise<Product[]> {
  if (!config.backendUrl || !config.publishableKey) {
    if (config.allowDevelopmentFallback) {
      return fallbackProducts(config, query);
    }
    throw new CommerceUnavailableError();
  }

  const url = new URL("/store/products", config.backendUrl);
  url.searchParams.set("limit", "100");
  url.searchParams.set(
    "fields",
    "+variants.calculated_price,+metadata,+tags,+categories.id,+categories.name,+categories.handle,+categories.description,+categories.is_active,+categories.is_internal,+categories.metadata,+categories.parent_category.id,+categories.parent_category.handle",
  );
  if (config.regionId) url.searchParams.set("region_id", config.regionId);

  try {
    const response = await fetch(url, {
      headers: { "x-publishable-api-key": config.publishableKey },
      cache: "no-store",
    });
    if (!response.ok) throw new CommerceUnavailableError(`Medusa returned ${response.status}.`);
    const payload = (await response.json()) as MedusaProductResponse;
    const allowedHandles = config.allowedProductHandles
      ? new Set(config.allowedProductHandles)
      : undefined;
    const allowedProducts = payload.products.filter(
      (product) => !allowedHandles || allowedHandles.has(product.handle),
    );
    const hasStaleRevision =
      Boolean(config.requiredCatalogRevision) &&
      allowedProducts.some(
        (product) => product.metadata?.catalog_revision !== config.requiredCatalogRevision,
      );
    const currentProducts = allowedProducts.filter(
      (product) =>
        !config.requiredCatalogRevision ||
        product.metadata?.catalog_revision === config.requiredCatalogRevision,
    );
    const hasIncompleteCatalog =
      !query &&
      Boolean(config.allowedProductHandles?.length) &&
      new Set(currentProducts.map((product) => product.handle)).size <
        config.allowedProductHandles!.length;
    if (config.allowDevelopmentFallback && (hasStaleRevision || hasIncompleteCatalog)) {
      return fallbackProducts(config, query);
    }
    return currentProducts
      .map(adaptProduct)
      .filter((product) => product.eligibleMarkets.includes(config.market))
      .filter(
        (product) =>
          (product.verified === true && product.isPlaceholder !== true) ||
          (config.allowDevelopmentFallback === true && product.isPlaceholder === true),
      )
      .filter((product) => matchesProductQuery(product, query));
  } catch (error) {
    if (config.allowDevelopmentFallback) return fallbackProducts(config, query);
    if (error instanceof CommerceUnavailableError) throw error;
    throw new CommerceUnavailableError(
      error instanceof Error
        ? `The commerce service could not be reached: ${error.message}`
        : undefined,
    );
  }
}

export async function getProduct(
  config: CommerceConfig,
  handle: string,
): Promise<Product | undefined> {
  const products = await listProducts(config);
  return products.find((product) => product.handle === handle);
}

export function formatMoney(amount: number, currencyCode: string, locale = "en-BD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "BDT" ? 0 : 2,
  }).format(amount);
}

export { activeCatalogRevision, activeProductHandles } from "./fixtures";
