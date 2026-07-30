interface SampleCatalogProduct {
  title: string;
  handle: string;
  collection: string;
  description: string;
  subtitle: string;
  region: string;
  variants: {
    title: string;
    sku: string;
    prices: { bdt: number; gbp: number; usd: number };
  }[];
  markets: string[];
  thumbnail: string;
  badges: string[];
  bestSeller?: boolean;
}

export const activeCatalogRevision = "bd-price-list-2026-07-29";

export const sampleCollections = [
  { title: "Originals", handle: "originals" },
  { title: "Reserve", handle: "reserve" },
  { title: "Pantry", handle: "pantry" },
  { title: "Tea & Wellness", handle: "tea-wellness" },
  { title: "Lifestyle Accessories", handle: "lifestyle-accessories" },
  { title: "Gifts", handle: "gifts" },
];

export const retiredSampleProductHandles = [
  "shorisha-ilish",
  "hill-tracts-turmeric",
  "ginger-paste",
  "tea-masala",
  "taste-of-bangladesh-gift",
  "everyday-masala-trio",
  "chai-adda-gift-set",
  "coastal-table-duo",
  "bangla-pantry-refresh",
  "golden-pantry-trio",
  "chattogram-feast-box",
  "hosts-spice-sampler",
  "masala-grind-starter-set",
  "festival-table-collection",
] as const;

export const sampleCatalog: SampleCatalogProduct[] = [
  {
    title: "Mezban Masala",
    handle: "mezban-masala",
    collection: "originals",
    subtitle: "Authentic Chattogram spice blend for rich traditional dishes",
    description:
      "Bangla Blend Mezban Masala is a carefully crafted spice blend inspired by Chattogram’s famous Mezban cuisine. Ideal for beef mezban, beef curry, mutton and other rich traditional dishes, it brings bold, balanced flavour, deep aroma and rich natural colour to home cooking.",
    region: "Chattogram",
    variants: [
      {
        title: "75 g",
        sku: "SAMPLE-MEZ-75",
        prices: { bdt: 200, gbp: 9, usd: 11 },
      },
      {
        title: "100 g",
        sku: "SAMPLE-MEZ-100",
        prices: { bdt: 220, gbp: 10, usd: 12 },
      },
    ],
    markets: ["bd", "gb", "us"],
    thumbnail: "/images/products/mezban-masala-product.png",
    badges: ["Bestseller", "Signature blend"],
    bestSeller: true,
  },
  {
    title: "Black Pepper",
    handle: "black-pepper",
    collection: "reserve",
    subtitle: "Premium whole black pepper with bold flavour and natural aroma",
    description:
      "Bangla Blend Black Pepper is made from carefully selected black peppercorns for bold flavour and a rich natural aroma. Use it in soups, curries, marinades, stir fries, grilled dishes and seasoning blends for a warm, mildly spicy finish.",
    region: "Origin pending verification",
    variants: [
      {
        title: "75 g",
        sku: "SAMPLE-BLK-75",
        prices: { bdt: 250, gbp: 11, usd: 14 },
      },
    ],
    markets: ["bd", "gb", "us"],
    thumbnail: "/images/products/black-pepper-product.png",
    badges: ["Whole spice", "Reserve"],
  },
  {
    title: "White Pepper Powder",
    handle: "white-pepper-powder",
    collection: "reserve",
    subtitle: "Refined pepper warmth for soups, sauces and dishes with delicate colours",
    description:
      "Bangla Blend White Pepper Powder is finely ground for a smooth texture and refined flavour. Its mild heat and earthy aroma suit soups, sauces, marinades, stir fries, pasta, fried rice, seafood, chicken and recipes with delicate colours.",
    region: "Origin pending verification",
    variants: [
      {
        title: "75 g",
        sku: "SAMPLE-WPP-75",
        prices: { bdt: 270, gbp: 10, usd: 13 },
      },
    ],
    markets: ["bd", "gb", "us"],
    thumbnail: "/images/products/white-pepper-powder-product.png",
    badges: ["Fine ground", "Reserve"],
  },
  {
    title: "Cox’s Bazar Fish Masala",
    handle: "coxs-bazar-fish-masala",
    collection: "originals",
    subtitle: "A balanced coastal blend for fish, seafood and marinades",
    description:
      "Bangla Blend Cox’s Bazar Fish Masala is crafted to bring rich coastal flavour to grilled fish, barbecue, fried fish, curries and seafood marinades. Its balanced aromatic spices add savoury depth, inviting aroma and rich natural colour without overpowering the fish.",
    region: "Cox’s Bazar",
    variants: [
      {
        title: "75 g",
        sku: "SAMPLE-FSH-75",
        prices: { bdt: 200, gbp: 9, usd: 11 },
      },
      {
        title: "100 g",
        sku: "SAMPLE-FSH-100",
        prices: { bdt: 220, gbp: 10, usd: 12 },
      },
    ],
    markets: ["bd", "gb", "us"],
    thumbnail: "/images/products/coxs-bazar-fish-masala-product.png",
    badges: ["Bestseller", "Coastal blend"],
    bestSeller: true,
  },
  {
    title: "Hathazari Red Chilli Powder",
    handle: "hathazari-red-chili",
    collection: "reserve",
    subtitle: "Vibrant colour and balanced heat for everyday cooking",
    description:
      "Bangla Blend Hathazari Red Chilli Powder is made from carefully selected red chillies for vibrant colour, rich aroma and balanced heat. The stems and most seeds are removed before grinding for a smoother, cleaner powder suited to curries, stir fries, marinades, barbecue, snacks and traditional Bangladeshi recipes.",
    region: "Hathazari",
    variants: [
      {
        title: "100 g",
        sku: "SAMPLE-HTZ-100",
        prices: { bdt: 200, gbp: 12, usd: 15 },
      },
      {
        title: "125 g",
        sku: "SAMPLE-HTZ-125",
        prices: { bdt: 220, gbp: 13, usd: 16 },
      },
    ],
    markets: ["bd", "gb"],
    thumbnail: "/images/products/hathazari-red-chilli-product.png",
    badges: ["Bestseller", "Reserve"],
    bestSeller: true,
  },
  {
    title: "Shahi Garam Masala",
    handle: "shahi-garam-masala",
    collection: "originals",
    subtitle: "A premium aromatic blend for biryani, korma and curries",
    description:
      "Bangla Blend Shahi Garam Masala combines carefully selected aromatic spices for rich flavour and a warm, royal aroma. Use it in biryani, pulao, korma, roast, rezala, curries and other Bangladeshi and South Asian dishes for balanced depth without overpowering the ingredients.",
    region: "Bangladesh",
    variants: [
      {
        title: "75 g",
        sku: "SAMPLE-SHA-75",
        prices: { bdt: 250, gbp: 8, usd: 10 },
      },
      {
        title: "100 g",
        sku: "SAMPLE-SHA-100",
        prices: { bdt: 300, gbp: 9, usd: 11 },
      },
    ],
    markets: ["bd", "gb", "us"],
    thumbnail: "/images/products/shahi-garam-masala-product.png",
    badges: ["Bestseller", "Aromatic blend"],
    bestSeller: true,
  },
];
