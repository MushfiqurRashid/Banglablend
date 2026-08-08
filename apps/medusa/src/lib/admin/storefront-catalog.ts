import { z } from "@medusajs/framework/zod";

export const storefrontSections = [
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
  "gifts",
] as const;

export type StorefrontSection = (typeof storefrontSections)[number];

export const storefrontCatalogExperiences = ["listing", "build_a_box"] as const;
export type StorefrontCatalogExperience = (typeof storefrontCatalogExperiences)[number];

const catalogHandle = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createStorefrontCatalogSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    handle: catalogHandle,
    description: z.string().trim().max(1000).nullable(),
    section: z.enum(storefrontSections),
    experience: z.enum(storefrontCatalogExperiences).default("listing"),
    box_size: z.number().int().min(2).max(12).nullable().default(null),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.experience === "build_a_box" && input.box_size === null) {
      context.addIssue({
        code: "custom",
        path: ["box_size"],
        message: "Choose how many products customers add to a box.",
      });
    }
    if (input.experience === "listing" && input.box_size !== null) {
      context.addIssue({
        code: "custom",
        path: ["box_size"],
        message: "Box size is only available for a Build a Box catalog.",
      });
    }
  });

export const updateStorefrontCatalogSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    is_active: z.boolean().optional(),
    experience: z.enum(storefrontCatalogExperiences).optional(),
    box_size: z.number().int().min(2).max(12).nullable().optional(),
  })
  .strict();

export type StorefrontCatalogCategory = {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  is_active?: boolean;
  is_internal?: boolean;
  parent_category_id?: string | null;
  parent_category?: { id?: string; name?: string; handle?: string } | null;
  metadata?: Record<string, unknown> | null;
  products?: Array<{ id: string }>;
};

export function isStorefrontSection(value: unknown): value is StorefrontSection {
  return typeof value === "string" && storefrontSections.includes(value as StorefrontSection);
}

export function isManagedStorefrontCatalog(category: StorefrontCatalogCategory) {
  return (
    Boolean(category.parent_category_id) &&
    isStorefrontSection(category.parent_category?.handle) &&
    category.is_internal !== true
  );
}

export function normalizeStorefrontCatalog(category: StorefrontCatalogCategory) {
  const metadata = category.metadata ?? {};
  const section = category.parent_category?.handle;
  const experience: StorefrontCatalogExperience =
    metadata.storefront_experience === "build_a_box" ? "build_a_box" : "listing";
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
        : null;

  return {
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description ?? "",
    section: isStorefrontSection(section) ? section : "originals",
    experience,
    box_size: boxSize,
    is_active: category.is_active !== false,
    product_count: category.products?.length ?? 0,
  };
}

export function storefrontCatalogMetadata(input: {
  experience: StorefrontCatalogExperience;
  box_size: number | null;
}) {
  return {
    storefront_catalog: true,
    storefront_experience: input.experience,
    box_size: input.experience === "build_a_box" ? (input.box_size ?? 3) : null,
  };
}
