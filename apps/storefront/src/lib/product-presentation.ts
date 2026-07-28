import type { Product } from "@bangla-blend/types";

export interface ProductMedia {
  url: string;
  alt: string;
}

const localProductImages: Partial<Record<string, string[]>> = {
  "mezban-masala": ["/images/products/mezban-masala-lifestyle.jpg"],
  "coxs-bazar-fish-masala": [
    "/images/products/coxs-bazar-fish-masala-lifestyle.jpg",
    "/images/products/coxs-bazar-fish-masala-coastal.jpg",
  ],
  "shahi-garam-masala": [
    "/images/products/shahi-garam-masala-lifestyle.jpg",
    "/images/products/shahi-garam-masala-detail.jpg",
  ],
  "white-pepper-powder": [
    "/images/products/white-pepper-powder.jpg",
    "/images/products/pepper-pair.jpg",
  ],
  "shorisha-ilish": ["/images/products/shorisha-ilish.png"],
  "hathazari-red-chili": ["/images/products/hathazari-red-chilli-lifestyle.jpg"],
  "hill-tracts-turmeric": ["/images/products/hill-tracts-turmeric.png"],
  "ginger-paste": ["/images/products/ginger-paste.png"],
  "tea-masala": ["/images/products/tea-masala.png"],
  "taste-of-bangladesh-gift": [
    "/images/gifts/signature-keepsake-box.jpg",
    "/images/gifts/presentation-trio.jpg",
  ],
  "everyday-masala-trio": [
    "/images/gifts/presentation-trio.jpg",
    "/images/campaign/shop-signature-lineup.jpg",
  ],
  "chattogram-feast-box": [
    "/images/gifts/presentation-trio.jpg",
    "/images/gifts/signature-keepsake-box.jpg",
  ],
  "masala-grind-starter-set": [
    "/images/gifts/signature-keepsake-box.jpg",
    "/images/gifts/presentation-trio.jpg",
  ],
};

const collectionFallbacks: Record<Product["collection"], string> = {
  originals: "/images/hero-spice-still-life.png",
  reserve: "/images/home-hero-hathajari.jpg",
  pantry: "/images/our-story-craft.png",
  "tea-wellness": "/images/recipe-masala-chai.png",
  "lifestyle-accessories": "/images/our-story-standards.png",
  gifts: "/images/hero-spice-still-life.png",
};

export function getProductMedia(product: Product): ProductMedia[] {
  const local = (localProductImages[product.handle] ?? []).map((url, index) => ({
    url,
    alt: `${product.title} by Bangla Blend${index === 0 ? "" : `, view ${index + 1}`}`,
  }));
  const supplied = [
    ...(product.thumbnail
      ? [{ url: product.thumbnail, alt: product.thumbnailAlt ?? product.title }]
      : []),
    ...product.images,
  ];
  const unique = [...local, ...supplied].filter(
    (item, index, items) =>
      item.url && items.findIndex((candidate) => candidate.url === item.url) === index,
  );

  if (unique.length) {
    return unique.slice(0, 5).map((item, index) => ({
      url: item.url,
      alt: item.alt || `${product.title}${index === 0 ? "" : `, view ${index + 1}`}`,
    }));
  }

  return [
    {
      url: collectionFallbacks[product.collection],
      alt: `${product.title} by Bangla Blend`,
    },
  ];
}

export function getProductUsage(product: Product): string {
  if (product.usage?.trim()) return product.usage.trim();

  switch (product.collection) {
    case "originals":
      return "Bloom a small spoonful in warm oil, then build the dish gradually and adjust to taste.";
    case "reserve":
      return "Start with a small amount, taste as you cook and add more when the dish needs greater intensity.";
    case "pantry":
      return "Spoon into marinades, curries or everyday preparations according to the recipe and your taste.";
    case "tea-wellness":
      return "Add a small pinch while brewing tea, then strain and sweeten to taste.";
    case "gifts":
      return "Open each item as needed and follow the individual product guidance included with the set.";
    default:
      return "Use according to the recipe and adjust gradually to suit your taste.";
  }
}

export function getProductHighlights(product: Product): string[] {
  const highlights = [
    product.subtitle,
    product.region ? `Connected to ${product.region}` : undefined,
    ...product.badges,
    `${product.variants.length} ${product.variants.length === 1 ? "size" : "sizes"} available`,
  ].filter((item): item is string => Boolean(item));

  return Array.from(new Set(highlights)).slice(0, 5);
}

export function formatCollection(collection: Product["collection"]): string {
  return collection
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
