import { z } from "zod";

// Ported from the retired apps/medusa/src/lib/admin/product-create.ts + catalog.ts, adapted to
// the new schema: fields that used to live in Medusa's untyped product.metadata are now typed
// columns, and "storefront_visible" maps directly to status/verified instead of a metadata flag.

export const storefrontCollectionHandles = ["originals", "reserve", "pantry", "tea-wellness", "lifestyle-accessories", "gifts"] as const;
export const giftTypes = ["corporate", "set", "regional"] as const;
export const marketCodes = ["bd", "gb", "us", "ca", "eu", "au", "me"] as const;

const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const productFormSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    handle: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
    subtitle: nullableText(255),
    description: nullableText(10000),
    thumbnailUrl: nullableText(2000),
    thumbnailAlt: nullableText(300),
    collection: z.enum(storefrontCollectionHandles),
    giftType: z.enum(giftTypes).nullable(),
    region: nullableText(160),
    ingredients: nullableText(5000),
    storage: nullableText(2000),
    shelfLife: nullableText(1000),
    usageNotes: nullableText(3000),
    eligibleMarkets: z.array(z.enum(marketCodes)).min(1, "Choose at least one market."),
    badges: z.array(z.string().trim().min(1).max(80)).max(12),
    bestSeller: z.boolean(),
    storefrontVisible: z.boolean(),
    catalogIds: z.array(z.uuid()).max(50),
    seoTitle: nullableText(160),
    seoDescription: nullableText(320),
    seoImageUrl: nullableText(2000),
    variants: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(100),
          sku: z
            .string()
            .trim()
            .min(1)
            .max(64)
            .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "SKU must start with a letter or number."),
          bdtPrice: z.coerce.number().finite().positive().max(100000000),
          stockQuantity: z.coerce.number().int().min(0).max(1000000000),
        }),
      )
      .min(1, "Add at least one variant."),
  })
  .superRefine((input, ctx) => {
    if (input.collection === "gifts" && !input.giftType) {
      ctx.addIssue({ code: "custom", path: ["giftType"], message: "Choose a gift type for a product in the Gifts collection." });
    }
    if (input.collection !== "gifts" && input.giftType) {
      ctx.addIssue({ code: "custom", path: ["giftType"], message: "Gift type is only available for the Gifts collection." });
    }
    if (input.storefrontVisible && !input.description) {
      ctx.addIssue({ code: "custom", path: ["description"], message: "A description is required before publishing." });
    }
    if (input.storefrontVisible && !input.thumbnailUrl) {
      ctx.addIssue({ code: "custom", path: ["thumbnailUrl"], message: "A product image is required before publishing." });
    }
    const skus = new Set<string>();
    input.variants.forEach((variant, index) => {
      const sku = variant.sku.toUpperCase();
      if (skus.has(sku)) ctx.addIssue({ code: "custom", path: ["variants", index, "sku"], message: "SKUs must be unique." });
      skus.add(sku);
    });
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;

export interface CatalogReadinessProduct {
  description: string | null;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  status: string;
  verified: boolean;
  is_placeholder: boolean;
  eligible_markets: string[];
  variants: Array<{ sku: string | null; prices: Array<{ amount: number }>; stockQuantity?: number }>;
}

export function getCatalogReadiness(product: CatalogReadinessProduct) {
  const checks = {
    description: Boolean(product.description?.trim()),
    media: Boolean(product.thumbnail_url?.trim()),
    altText: Boolean(product.thumbnail_alt?.trim()),
    variant: product.variants.length > 0 && product.variants.every((v) => Boolean(v.sku?.trim())),
    price: product.variants.length > 0 && product.variants.every((v) => v.prices.some((p) => p.amount > 0)),
    stock: product.variants.length > 0 && product.variants.some((v) => v.stockQuantity === undefined || v.stockQuantity > 0),
    market: product.eligible_markets.length > 0,
    verified: product.verified === true && product.is_placeholder !== true,
    published: product.status === "published",
  };
  const labels: Record<keyof typeof checks, string> = {
    description: "description",
    media: "product image",
    altText: "image alt text",
    variant: "variant and SKU",
    price: "positive price",
    stock: "available stock",
    market: "eligible market",
    verified: "catalog verification",
    published: "published status",
  };
  const missing = (Object.keys(checks) as Array<keyof typeof checks>).filter((key) => !checks[key]).map((key) => labels[key]);
  return { ready: missing.length === 0, checks, missing };
}
