import { z } from "@medusajs/framework/zod";
import type { ProductStatus } from "@medusajs/framework/utils";

export const storefrontCollectionHandles = [
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
  "gifts",
] as const;

export const giftTypes = ["corporate", "set", "regional"] as const;

const nullableText = (maximum: number) => z.string().trim().max(maximum).nullable();
const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "Use an HTTP or HTTPS image URL.",
  })
  .nullable();

export const createCatalogProductSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    handle: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    subtitle: nullableText(255),
    description: nullableText(10000),
    thumbnail: httpUrl,
    thumbnail_alt: nullableText(300),
    collection: z.enum(storefrontCollectionHandles),
    gift_type: z.enum(giftTypes).nullable(),
    category_ids: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(160)
          .regex(/^[A-Za-z0-9_-]+$/),
      )
      .max(50),
    region: nullableText(160),
    ingredients: nullableText(5000),
    storage: nullableText(2000),
    shelf_life: nullableText(1000),
    usage: nullableText(3000),
    eligible_markets: z
      .array(z.enum(["bd", "gb", "us", "ca", "eu", "au", "me"]))
      .min(1)
      .max(7),
    badges: z.array(z.string().trim().min(1).max(80)).max(12),
    best_seller: z.boolean(),
    storefront_visible: z.boolean(),
    variants: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(100),
            sku: z
              .string()
              .trim()
              .min(1)
              .max(64)
              .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
            bdt_price: z.number().finite().positive().max(100000000),
            stock_quantity: z.number().int().min(0).max(1000000000),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.collection === "gifts" && !input.gift_type) {
      context.addIssue({
        code: "custom",
        path: ["gift_type"],
        message: "Choose Corporate, Gift set, or Regional for a gift product.",
      });
    }
    if (input.collection !== "gifts" && input.gift_type) {
      context.addIssue({
        code: "custom",
        path: ["gift_type"],
        message: "Gift type is only available for the Gifts destination.",
      });
    }
    if (input.storefront_visible && !input.description) {
      context.addIssue({
        code: "custom",
        path: ["description"],
        message: "A description is required before publishing.",
      });
    }
    if (input.storefront_visible && !input.thumbnail) {
      context.addIssue({
        code: "custom",
        path: ["thumbnail"],
        message: "A product image is required before publishing.",
      });
    }

    const titles = new Set<string>();
    const skus = new Set<string>();
    input.variants.forEach((variant, index) => {
      const title = variant.title.toLocaleLowerCase("en");
      const sku = variant.sku.toLocaleUpperCase("en");
      if (titles.has(title)) {
        context.addIssue({
          code: "custom",
          path: ["variants", index, "title"],
          message: "Variant names must be unique.",
        });
      }
      if (skus.has(sku)) {
        context.addIssue({
          code: "custom",
          path: ["variants", index, "sku"],
          message: "SKUs must be unique.",
        });
      }
      titles.add(title);
      skus.add(sku);
    });
  });

export type CreateCatalogProductInput = z.infer<typeof createCatalogProductSchema>;

type CreatedVariantInventory = {
  sku?: string | null;
  inventory_items?: Array<{ inventory_item_id?: string | null }>;
};

export function buildCatalogProductMetadata(input: CreateCatalogProductInput) {
  return {
    region: input.region,
    ingredients: input.ingredients,
    storage: input.storage,
    shelf_life: input.shelf_life,
    usage: input.usage,
    eligible_markets: input.eligible_markets,
    product_badges: input.badges,
    best_seller: input.best_seller,
    gift_type: input.collection === "gifts" ? input.gift_type : null,
    thumbnail_alt: input.thumbnail_alt,
    is_placeholder: !input.storefront_visible,
    verified: input.storefront_visible,
  };
}

export function buildCatalogWorkflowProduct(
  input: CreateCatalogProductInput,
  context: {
    collectionId: string;
    categoryIds: string[];
    shippingProfileId: string;
    salesChannelId: string;
    publishedStatus: ProductStatus;
    draftStatus: ProductStatus;
  },
) {
  return {
    title: input.title,
    handle: input.handle,
    subtitle: input.subtitle,
    description: input.description,
    thumbnail: input.thumbnail,
    images: input.thumbnail ? [{ url: input.thumbnail }] : [],
    status: input.storefront_visible ? context.publishedStatus : context.draftStatus,
    collection_id: context.collectionId,
    categories: context.categoryIds.map((id) => ({ id })),
    shipping_profile_id: context.shippingProfileId,
    sales_channels: [{ id: context.salesChannelId }],
    metadata: buildCatalogProductMetadata(input),
    options: [{ title: "Size", values: input.variants.map((variant) => variant.title) }],
    variants: input.variants.map((variant) => ({
      title: variant.title,
      sku: variant.sku.toLocaleUpperCase("en"),
      manage_inventory: true,
      options: { Size: variant.title },
      prices: [{ currency_code: "bdt", amount: variant.bdt_price }],
    })),
  };
}

export function buildCatalogInventoryLevels(
  input: CreateCatalogProductInput,
  createdVariants: CreatedVariantInventory[],
  locationId: string,
) {
  const createdBySku = new Map(
    createdVariants.map((variant) => [variant.sku?.toLocaleUpperCase("en"), variant]),
  );

  return input.variants.map((variant) => {
    const sku = variant.sku.toLocaleUpperCase("en");
    const createdVariant = createdBySku.get(sku);
    const inventoryItemIds = (createdVariant?.inventory_items ?? [])
      .map((item) => item.inventory_item_id)
      .filter((id): id is string => Boolean(id));
    const inventoryItemId = inventoryItemIds[0];

    if (!inventoryItemId || inventoryItemIds.length !== 1) {
      throw new Error(`Medusa did not create exactly one inventory item for SKU ${sku}.`);
    }

    return {
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      stocked_quantity: variant.stock_quantity,
    };
  });
}
