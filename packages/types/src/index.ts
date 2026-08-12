export type MarketCode = "bd" | "gb" | "us" | "ca" | "eu" | "au" | "me";

export type CurrencyCode = "BDT" | "USD" | "GBP" | "EUR" | "CAD" | "AUD" | "AED";

export interface Market {
  code: MarketCode;
  label: string;
  shortLabel: string;
  currency: CurrencyCode;
  regionId?: string;
  enabled: boolean;
  domestic: boolean;
  dutiesMessage: string;
}

export interface Money {
  amount: number;
  currencyCode: CurrencyCode;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  inventoryQuantity?: number;
  price: Money;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export type StorefrontSection =
  "originals" | "reserve" | "pantry" | "tea-wellness" | "lifestyle-accessories" | "gifts";

export type StorefrontCatalogExperience = "listing" | "build_a_box";

export interface StorefrontCatalog {
  id: string;
  name: string;
  handle: string;
  description?: string;
  navigationImage?: string;
  navigationImageAlt?: string;
  heroImage?: string;
  heroImageAlt?: string;
  section: StorefrontSection;
  experience: StorefrontCatalogExperience;
  boxSize?: number;
  active: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  collection: StorefrontSection;
  catalogs?: StorefrontCatalog[];
  region?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  images: ProductImage[];
  badges: string[];
  variants: ProductVariant[];
  eligibleMarkets: MarketCode[];
  ingredients?: string;
  storage?: string;
  shelfLife?: string;
  usage?: string;
  flavor?: Record<
    "heat" | "aroma" | "sweetness" | "smokiness" | "earthiness" | "intensity",
    number
  >;
  isPlaceholder?: boolean;
  verified?: boolean;
  bestSeller?: boolean;
  giftType?: "corporate" | "set" | "regional";
  createdAt?: string;
}

export interface CartLine {
  id: string;
  variantId: string;
  title: string;
  variantTitle?: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Cart {
  id: string;
  currencyCode: string;
  items: CartLine[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
}

export interface SearchDocument {
  id: string;
  type: "product" | "gift" | "recipe" | "division" | "region" | "ingredient" | "farmer" | "article";
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  catalogRevision?: string;
  catalogHandles?: string[];
  eligibleMarkets?: MarketCode[];
}
