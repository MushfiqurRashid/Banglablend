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

export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  collection:
    "originals" | "reserve" | "pantry" | "tea-wellness" | "lifestyle-accessories" | "gifts";
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
  giftType?: "set" | "regional";
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
  eligibleMarkets?: MarketCode[];
}
