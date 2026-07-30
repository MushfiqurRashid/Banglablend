import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  deleteProductsWorkflow,
  updateProductsWorkflow
} from "@medusajs/medusa/core-flows";
import { recordAdminAudit } from "../../../../../lib/admin/audit";
import {
  catalogProductFields,
  getCatalogReadiness,
  sanitizeCatalogProduct,
  type CatalogProductRecord
} from "../../../../../lib/admin/catalog";
import { PRODUCT_MARKET_MODULE } from "../../../../../modules/product-market";
import type ProductMarketModuleService from "../../../../../modules/product-market/service";
import { PRODUCT_ORIGIN_MODULE } from "../../../../../modules/product-origin";
import type ProductOriginModuleService from "../../../../../modules/product-origin/service";

const nullableText = (maximum: number) => z.string().trim().max(maximum).nullable().optional();
const productIdSchema = z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/);

const marketSchema = z.object({
  bangladesh_available: z.boolean().optional(),
  international_available: z.boolean().optional(),
  supported_countries: z.array(z.string().trim().toLowerCase().length(2)).max(80).optional(),
  restricted_countries: z.array(z.string().trim().toLowerCase().length(2)).max(80).optional(),
  export_ready: z.boolean().optional(),
  domestic_only: z.boolean().optional(),
  shipping_classification: nullableText(160),
  customs_description: nullableText(500),
  country_of_origin: nullableText(120),
  package_dimensions: z.record(z.string(), z.union([z.string(), z.number()])).nullable().optional(),
  storage_requirements: nullableText(1000),
  temperature_requirements: nullableText(500),
  shelf_life_days: z.number().int().min(0).max(3650).nullable().optional(),
  minimum_shelf_life_at_dispatch_days: z.number().int().min(0).max(3650).nullable().optional(),
  verified: z.boolean().optional()
}).strict().superRefine((profile, context) => {
  if (profile.domestic_only === true && profile.international_available === true) {
    context.addIssue({
      code: "custom",
      path: ["international_available"],
      message: "A product limited to domestic sales cannot be internationally available."
    });
  }
  if (profile.domestic_only === true && profile.export_ready === true) {
    context.addIssue({
      code: "custom",
      path: ["export_ready"],
      message: "A product limited to domestic sales cannot be marked ready for export."
    });
  }
});

const originSchema = z.object({
  division: nullableText(120),
  district: nullableText(120),
  locality: nullableText(160),
  producer_reference: nullableText(200),
  harvest_date: z.string().datetime().nullable().optional(),
  batch_number: nullableText(120),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  verification_status: z.enum(["draft", "in_review", "verified", "rejected"]).optional(),
  evidence_reference: nullableText(500)
}).strict();

const updateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  handle: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  subtitle: nullableText(255),
  description: nullableText(10000),
  status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
  region: nullableText(160),
  ingredients: nullableText(5000),
  storage: nullableText(2000),
  shelf_life: nullableText(1000),
  usage: nullableText(3000),
  eligible_markets: z.array(z.enum(["bd", "gb", "us", "ca", "eu", "au", "me"])).min(1).optional(),
  badges: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  best_seller: z.boolean().optional(),
  gift_type: z.enum(["set", "regional"]).nullable().optional(),
  verified: z.boolean().optional(),
  is_placeholder: z.boolean().optional(),
  storefront_visible: z.boolean().optional(),
  thumbnail_alt: nullableText(300),
  image_alt_texts: z.record(z.string().url(), z.string().trim().min(1).max(300)).optional(),
  market_profile: marketSchema.optional(),
  origin_profile: originSchema.optional()
}).strict();

async function retrieveProduct(req: AuthenticatedMedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: catalogProductFields,
    filters: { id }
  });
  return data[0] as CatalogProductRecord | undefined;
}

async function retrieveProfiles(req: AuthenticatedMedusaRequest, productId: string) {
  const marketService = req.scope.resolve<ProductMarketModuleService>(PRODUCT_MARKET_MODULE);
  const originService = req.scope.resolve<ProductOriginModuleService>(PRODUCT_ORIGIN_MODULE);
  const [[market], [origin]] = await Promise.all([
    marketService.listProductMarkets({ product_id: productId }),
    originService.listProductOrigins({ product_id: productId })
  ]);
  return { market: market ?? null, origin: origin ?? null };
}

function mapStatus(status: "draft" | "proposed" | "published" | "rejected") {
  return ProductStatus[status.toUpperCase() as keyof typeof ProductStatus];
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = productIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid product ID." });
  const id = parsedId.data;
  const product = await retrieveProduct(req, id);
  if (!product) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.");
  const profiles = await retrieveProfiles(req, product.id);
  return res.json({
    product: {
      ...sanitizeCatalogProduct(product),
      market_profile: profiles.market,
      origin_profile: profiles.origin
    }
  });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid catalog update.", errors: parsed.error.flatten() });
  }

  const parsedId = productIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid product ID." });
  const id = parsedId.data;
  const before = await retrieveProduct(req, id);
  if (!before) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.");

  const {
    market_profile: marketProfile,
    origin_profile: originProfile,
    storefront_visible: storefrontVisible,
    region,
    ingredients,
    storage,
    shelf_life: shelfLife,
    usage,
    eligible_markets: eligibleMarkets,
    badges,
    best_seller: bestSeller,
    gift_type: giftType,
    verified,
    is_placeholder: isPlaceholder,
    thumbnail_alt: thumbnailAlt,
    image_alt_texts: imageAltTexts,
    status,
    ...coreFields
  } = parsed.data;

  const metadata = {
    ...(before.metadata ?? {}),
    ...(region !== undefined ? { region } : {}),
    ...(ingredients !== undefined ? { ingredients } : {}),
    ...(storage !== undefined ? { storage } : {}),
    ...(shelfLife !== undefined ? { shelf_life: shelfLife } : {}),
    ...(usage !== undefined ? { usage } : {}),
    ...(eligibleMarkets !== undefined ? { eligible_markets: eligibleMarkets } : {}),
    ...(badges !== undefined ? { product_badges: badges } : {}),
    ...(bestSeller !== undefined ? { best_seller: bestSeller } : {}),
    ...(giftType !== undefined ? { gift_type: giftType } : {}),
    ...(verified !== undefined ? { verified } : {}),
    ...(isPlaceholder !== undefined ? { is_placeholder: isPlaceholder } : {}),
    ...(thumbnailAlt !== undefined ? { thumbnail_alt: thumbnailAlt } : {}),
    ...(imageAltTexts !== undefined ? { image_alt_texts: imageAltTexts } : {})
  };

  if (storefrontVisible !== undefined) {
    metadata.verified = storefrontVisible;
    metadata.is_placeholder = !storefrontVisible;
  }

  const nextStatus = storefrontVisible === true
    ? ProductStatus.PUBLISHED
    : storefrontVisible === false && (status === undefined || status === "published")
      ? ProductStatus.DRAFT
      : status !== undefined
        ? mapStatus(status)
        : before.status
          ? mapStatus(before.status)
          : ProductStatus.DRAFT;
  const update = {
    ...coreFields,
    ...(status !== undefined || storefrontVisible !== undefined ? { status: nextStatus } : {}),
    metadata
  };

  if (nextStatus === ProductStatus.PUBLISHED) {
    const candidate = {
      ...before,
      ...coreFields,
      status: "published",
      metadata
    } as CatalogProductRecord;
    const readiness = getCatalogReadiness(candidate);
    if (!readiness.ready) {
      return res.status(409).json({
        message: `Product cannot be shown in the storefront until these items are complete: ${readiness.missing.join(", ")}.`,
        readiness
      });
    }
  }

  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: before.id },
      update
    }
  });

  const marketService = req.scope.resolve<ProductMarketModuleService>(PRODUCT_MARKET_MODULE);
  if (marketProfile) {
    const [existing] = await marketService.listProductMarkets({ product_id: before.id });
    if (existing) await marketService.updateProductMarkets({ id: existing.id, ...marketProfile });
    else await marketService.createProductMarkets({ product_id: before.id, ...marketProfile });
  }

  const originService = req.scope.resolve<ProductOriginModuleService>(PRODUCT_ORIGIN_MODULE);
  if (originProfile) {
    const [existing] = await originService.listProductOrigins({ product_id: before.id });
    const { harvest_date: harvestDate, ...originFields } = originProfile;
    const normalizedOrigin = {
      ...originFields,
      ...(harvestDate !== undefined
        ? { harvest_date: harvestDate === null ? null : new Date(harvestDate) }
        : {})
    };
    if (existing) await originService.updateProductOrigins({ id: existing.id, ...normalizedOrigin });
    else await originService.createProductOrigins({ product_id: before.id, ...normalizedOrigin });
  }

  const after = await retrieveProduct(req, before.id);
  await recordAdminAudit(req, {
    action: "catalog.product.updated",
    resourceType: "product",
    resourceId: before.id,
    resourceLabel: after?.title ?? before.title,
    summary: `Updated product ${after?.title ?? before.title}.`,
    before: {
      title: before.title,
      handle: before.handle,
      status: before.status,
      metadata: before.metadata
    },
    after: after
      ? {
          title: after.title,
          handle: after.handle,
          status: after.status,
          metadata: after.metadata
        }
      : null
  });

  const profiles = await retrieveProfiles(req, before.id);
  return res.json({
    product: after
      ? {
          ...sanitizeCatalogProduct(after),
          market_profile: profiles.market,
          origin_profile: profiles.origin
        }
      : null
  });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = productIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid product ID." });
  const id = parsedId.data;
  const before = await retrieveProduct(req, id);
  if (!before) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.");

  await deleteProductsWorkflow(req.scope).run({ input: { ids: [before.id] } });
  await recordAdminAudit(req, {
    action: "catalog.product.deleted",
    resourceType: "product",
    resourceId: before.id,
    resourceLabel: before.title,
    summary: `Deleted product ${before.title}.`,
    before: {
      title: before.title,
      handle: before.handle,
      status: before.status,
      metadata: before.metadata
    }
  });

  return res.json({ id: before.id, object: "product", deleted: true });
}
