import type { Market, Product } from "@bangla-blend/types";

export const markets: Market[] = [
  {
    code: "bd",
    label: "Bangladesh",
    shortLabel: "Bangladesh",
    currency: "BDT",
    enabled: true,
    domestic: true,
    dutiesMessage: "Domestic delivery options are shown at checkout."
  },
  {
    code: "gb",
    label: "United Kingdom",
    shortLabel: "United Kingdom",
    currency: "GBP",
    enabled: true,
    domestic: false,
    dutiesMessage: "Import duties and taxes may be collected by local authorities."
  },
  {
    code: "us",
    label: "United States",
    shortLabel: "United States",
    currency: "USD",
    enabled: true,
    domestic: false,
    dutiesMessage: "Import duties and taxes may apply to your delivery."
  },
  {
    code: "ca",
    label: "Canada",
    shortLabel: "Canada",
    currency: "CAD",
    enabled: false,
    domestic: false,
    dutiesMessage: "This market will open after delivery and customs approval."
  },
  {
    code: "eu",
    label: "European Union",
    shortLabel: "European Union",
    currency: "EUR",
    enabled: false,
    domestic: false,
    dutiesMessage: "This market will open after delivery and customs approval."
  },
  {
    code: "au",
    label: "Australia & New Zealand",
    shortLabel: "AU & NZ",
    currency: "AUD",
    enabled: false,
    domestic: false,
    dutiesMessage: "This market will open after biosecurity and delivery approval."
  },
  {
    code: "me",
    label: "Middle East",
    shortLabel: "Middle East",
    currency: "AED",
    enabled: false,
    domestic: false,
    dutiesMessage: "This market will open after delivery and customs approval."
  }
];

const prices = (bdt: number, international: number) => ({
  bd: { amount: bdt, currencyCode: "BDT" as const },
  gb: { amount: Math.ceil(international * 0.78), currencyCode: "GBP" as const },
  us: { amount: international, currencyCode: "USD" as const }
});

export const sampleProducts: Product[] = [
  {
    id: "prod_sample_mezban",
    handle: "mezban-masala",
    title: "Mezban Masala",
    subtitle: "A bold, slow-cooked Chattogram-inspired blend",
    description: "Deep chilli warmth, roasted spice and a lingering savory finish for celebratory beef curries and hearty vegetable dishes.",
    collection: "originals",
    region: "Chattogram",
    images: [],
    badges: ["Signature blend", "International selection"],
    variants: [
      { id: "variant_sample_mezban_80", title: "80 g", sku: "SAMPLE-MEZ-80", price: prices(320, 9).bd, inventoryQuantity: 30 },
      { id: "variant_sample_mezban_160", title: "160 g", sku: "SAMPLE-MEZ-160", price: prices(570, 15).bd, inventoryQuantity: 20 }
    ],
    eligibleMarkets: ["bd", "gb", "us"],
    ingredients: "Chilli, coriander, cumin and warming spices. Final formulation pending verification.",
    storage: "Store sealed in a cool, dry place.",
    shelfLife: "Draft product specification.",
    flavor: { heat: 4, aroma: 5, sweetness: 1, smokiness: 3, earthiness: 4, intensity: 5 },
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_fish",
    handle: "coxs-bazar-fish-masala",
    title: "Cox’s Bazar Fish Masala",
    subtitle: "Bright spice for fish, prawns and vegetables",
    description: "A citrus-bright, gently warming blend designed for quick weekday curries and coastal-inspired cooking.",
    collection: "originals",
    region: "Cox’s Bazar",
    images: [],
    badges: ["Signature blend"],
    variants: [{ id: "variant_sample_fish_80", title: "80 g", sku: "SAMPLE-FSH-80", price: prices(300, 9).bd, inventoryQuantity: 24 }],
    eligibleMarkets: ["bd", "gb", "us"],
    flavor: { heat: 3, aroma: 4, sweetness: 1, smokiness: 1, earthiness: 2, intensity: 4 },
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_ilish",
    handle: "shorisha-ilish",
    title: "Shorisha Ilish",
    subtitle: "Mustard-led and made for the Bengali table",
    description: "A mustard-forward blend with chilli warmth and aromatic depth, created for fish and vegetable preparations.",
    collection: "originals",
    region: "Bangladesh",
    images: [],
    badges: ["Everyday favorite"],
    variants: [{ id: "variant_sample_ilish_80", title: "80 g", sku: "SAMPLE-ILI-80", price: prices(290, 9).bd, inventoryQuantity: 32 }],
    eligibleMarkets: ["bd", "gb", "us"],
    flavor: { heat: 3, aroma: 4, sweetness: 1, smokiness: 1, earthiness: 3, intensity: 4 },
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_chili",
    handle: "hathazari-red-chili",
    title: "Hathazari Red Chilli",
    subtitle: "A Reserve ingredient awaiting provenance verification",
    description: "A limited-production red chilli draft with a clear, persistent heat and vivid aroma.",
    collection: "reserve",
    region: "Hathazari",
    images: [],
    badges: ["Reserve", "Draft provenance"],
    variants: [{ id: "variant_sample_chili_60", title: "60 g", sku: "SAMPLE-HTZ-60", price: prices(420, 12).bd, inventoryQuantity: 12 }],
    eligibleMarkets: ["bd", "gb"],
    flavor: { heat: 5, aroma: 4, sweetness: 1, smokiness: 2, earthiness: 2, intensity: 5 },
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_turmeric",
    handle: "hill-tracts-turmeric",
    title: "Hill Tracts Turmeric",
    subtitle: "Golden, earthy and aromatic",
    description: "A Reserve turmeric product concept. Origin, harvest and analytical details remain unpublished until verified.",
    collection: "reserve",
    region: "Chittagong Hill Tracts",
    images: [],
    badges: ["Reserve", "Draft provenance"],
    variants: [{ id: "variant_sample_turmeric_70", title: "70 g", sku: "SAMPLE-TUR-70", price: prices(390, 11).bd, inventoryQuantity: 14 }],
    eligibleMarkets: ["bd", "us"],
    flavor: { heat: 1, aroma: 4, sweetness: 2, smokiness: 1, earthiness: 5, intensity: 4 },
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_ginger",
    handle: "ginger-paste",
    title: "Ginger Paste",
    subtitle: "A fresh shortcut for everyday cooking",
    description: "Kitchen-ready ginger paste for supported domestic delivery areas.",
    collection: "pantry",
    region: "Bangladesh",
    images: [],
    badges: ["Bangladesh only", "Chilled"],
    variants: [{ id: "variant_sample_ginger_200", title: "200 g", sku: "SAMPLE-GIN-200", price: prices(180, 6).bd, inventoryQuantity: 40 }],
    eligibleMarkets: ["bd"],
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_tea",
    handle: "tea-masala",
    title: "Tea Masala",
    subtitle: "Warm spice for everyday tea rituals",
    description: "A fragrant tea blend with ginger-led warmth. No medical or therapeutic claims are made.",
    collection: "tea-wellness",
    region: "Bangladesh",
    images: [],
    badges: ["Tea & Wellness"],
    variants: [{ id: "variant_sample_tea_70", title: "70 g", sku: "SAMPLE-TEA-70", price: prices(260, 8).bd, inventoryQuantity: 20 }],
    eligibleMarkets: ["bd", "gb", "us"],
    isPlaceholder: true,
    verified: false
  },
  {
    id: "prod_sample_gift",
    handle: "taste-of-bangladesh-gift",
    title: "Taste of Bangladesh Gift",
    subtitle: "A considered introduction to the collection",
    description: "Four draft spice products in gift-ready packaging with a personal note and optional hidden prices.",
    collection: "gifts",
    region: "Bangladesh",
    images: [],
    badges: ["Gift-ready", "International selection"],
    variants: [{ id: "variant_sample_gift_4", title: "Four-piece set", sku: "SAMPLE-GFT-04", price: prices(1450, 42).bd, inventoryQuantity: 16 }],
    eligibleMarkets: ["bd", "gb", "us"],
    isPlaceholder: true,
    verified: false
  }
];

export function withMarketPrices(products: Product[], marketCode: string): Product[] {
  const market = markets.find((item) => item.code === marketCode) ?? markets[0]!;
  if (market.code === "bd") return products;
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: {
        amount: Math.ceil(
          market.currency === "GBP" ? variant.price.amount / 38 : variant.price.amount / 32
        ),
        currencyCode: market.currency
      }
    }))
  }));
}
