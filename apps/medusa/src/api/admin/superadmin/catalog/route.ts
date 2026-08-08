import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { recordAdminAudit } from "../../../../lib/admin/audit";
import {
  catalogProductFields,
  sanitizeCatalogProduct,
  type CatalogProductRecord,
} from "../../../../lib/admin/catalog";
import {
  buildCatalogInventoryLevels,
  buildCatalogWorkflowProduct,
  createCatalogProductSchema,
} from "../../../../lib/admin/product-create";
import { PRODUCT_MARKET_MODULE } from "../../../../modules/product-market";
import type ProductMarketModuleService from "../../../../modules/product-market/service";
import { PRODUCT_ORIGIN_MODULE } from "../../../../modules/product-origin";
import type ProductOriginModuleService from "../../../../modules/product-origin/service";
import {
  isManagedStorefrontCatalog,
  type StorefrontCatalogCategory,
} from "../../../../lib/admin/storefront-catalog";

const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid catalog filters.", errors: parsed.error.flatten() });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const filters: Record<string, unknown> = {};
  if (parsed.data.q) filters.q = parsed.data.q;
  if (parsed.data.status) filters.status = parsed.data.status;

  const { data, metadata } = await query.graph({
    entity: "product",
    fields: catalogProductFields,
    filters,
    pagination: {
      skip: parsed.data.offset,
      take: parsed.data.limit,
      order: { updated_at: "DESC" },
    },
  });

  const products = data as CatalogProductRecord[];
  const productIds = products.map((product) => product.id);
  const marketService = req.scope.resolve<ProductMarketModuleService>(PRODUCT_MARKET_MODULE);
  const originService = req.scope.resolve<ProductOriginModuleService>(PRODUCT_ORIGIN_MODULE);
  const [markets, origins] = productIds.length
    ? await Promise.all([
        marketService.listProductMarkets({ product_id: productIds }),
        originService.listProductOrigins({ product_id: productIds }),
      ])
    : [[], []];

  const marketByProduct = new Map(markets.map((market) => [market.product_id, market]));
  const originByProduct = new Map(origins.map((origin) => [origin.product_id, origin]));

  return res.json({
    products: products.map((product) => ({
      ...sanitizeCatalogProduct(product),
      market_profile: marketByProduct.get(product.id) ?? null,
      origin_profile: originByProduct.get(product.id) ?? null,
    })),
    count: metadata?.count ?? products.length,
    offset: metadata?.skip ?? parsed.data.offset,
    limit: metadata?.take ?? parsed.data.limit,
  });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = createCatalogProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Review the product details and variant pricing.",
      errors: parsed.error.flatten(),
    });
  }

  const input = parsed.data;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const [{ data: collections }, { data: stores }, { data: shippingProfiles }] = await Promise.all([
    query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle: input.collection },
    }),
    query.graph({
      entity: "store",
      fields: ["id", "default_sales_channel_id", "default_location_id"],
    }),
    query.graph({ entity: "shipping_profile", fields: ["id", "type"] }),
  ]);

  const collection = collections[0];
  const store = stores[0];
  const salesChannelId = store?.default_sales_channel_id;
  const shippingProfile =
    shippingProfiles.find((profile) => profile.type === "default") ?? shippingProfiles[0];

  if (!collection?.id) {
    return res.status(409).json({
      message: `The ${input.collection} storefront collection is missing. Run the Bangla Blend catalog seed before creating products.`,
    });
  }
  if (!salesChannelId || !shippingProfile?.id) {
    return res.status(409).json({
      message: "Complete the Medusa store, sales channel, and shipping profile setup first.",
    });
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "sales_channels.id"],
  });
  const linkedStockLocations = stockLocations.filter((location) =>
    location.sales_channels?.some(
      (channel: { id?: string }) => channel.id === salesChannelId,
    ),
  );
  const stockLocation =
    linkedStockLocations.find((location) => location.id === store.default_location_id) ??
    linkedStockLocations[0];

  if (!stockLocation?.id) {
    return res.status(409).json({
      message:
        "Connect the default sales channel to a stock location before creating products.",
    });
  }

  const { data: selectedCategoryRecords } = input.category_ids.length
    ? await query.graph({
        entity: "product_category",
        fields: [
          "id",
          "name",
          "handle",
          "is_active",
          "is_internal",
          "parent_category_id",
          "parent_category.handle",
          "metadata",
        ],
        filters: { id: input.category_ids },
      })
    : { data: [] };
  const selectedCategories = selectedCategoryRecords as StorefrontCatalogCategory[];
  if (
    selectedCategories.length !== input.category_ids.length ||
    selectedCategories.some(
      (category) => !isManagedStorefrontCatalog(category) || category.is_active === false,
    )
  ) {
    return res.status(400).json({
      message: "Choose only active managed storefront catalogs.",
    });
  }

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        buildCatalogWorkflowProduct(input, {
          collectionId: collection.id,
          categoryIds: input.category_ids,
          shippingProfileId: shippingProfile.id,
          salesChannelId,
          publishedStatus: ProductStatus.PUBLISHED,
          draftStatus: ProductStatus.DRAFT,
        }),
      ],
    },
  });
  const created = result[0];
  if (!created) throw new Error("Medusa did not return the created product.");

  const { data: createdProductRecords } = await query.graph({
    entity: "product",
    fields: ["id", "variants.sku", "variants.inventory_items.inventory_item_id"],
    filters: { id: created.id },
  });
  const createdProductRecord = createdProductRecords[0] as
    | {
        variants?: Array<{
          sku?: string | null;
          inventory_items?: Array<{ inventory_item_id?: string | null }>;
        }>;
      }
    | undefined;
  const inventoryLevels = buildCatalogInventoryLevels(
    input,
    createdProductRecord?.variants ?? [],
    stockLocation.id,
  );
  await createInventoryLevelsWorkflow(req.scope).run({
    input: { inventory_levels: inventoryLevels },
  });

  const marketService = req.scope.resolve<ProductMarketModuleService>(PRODUCT_MARKET_MODULE);
  const originService = req.scope.resolve<ProductOriginModuleService>(PRODUCT_ORIGIN_MODULE);
  const internationalAvailable = input.eligible_markets.some((market) => market !== "bd");

  await marketService.createProductMarkets({
    product_id: created.id,
    bangladesh_available: input.eligible_markets.includes("bd"),
    international_available: internationalAvailable,
    supported_countries: input.eligible_markets.includes("bd") ? ["bd"] : [],
    restricted_countries: [],
    export_ready: false,
    domestic_only: !internationalAvailable,
    country_of_origin: "BD",
    verified: input.storefront_visible,
  });
  if (input.region) {
    await originService.createProductOrigins({
      product_id: created.id,
      locality: input.region,
      verification_status: "draft",
    });
  }

  const { data } = await query.graph({
    entity: "product",
    fields: catalogProductFields,
    filters: { id: created.id },
  });
  const product = data[0] as CatalogProductRecord | undefined;
  const [marketProfiles, originProfiles] = await Promise.all([
    marketService.listProductMarkets({ product_id: created.id }),
    originService.listProductOrigins({ product_id: created.id }),
  ]);

  await recordAdminAudit(req, {
    action: "catalog.product.created",
    resourceType: "product",
    resourceId: created.id,
    resourceLabel: input.title,
    summary: `Created ${input.title} in ${input.collection} with ${input.variants.length} priced and stocked variant${input.variants.length === 1 ? "" : "s"}.`,
    after: {
      title: input.title,
      handle: input.handle,
      collection: input.collection,
      category_ids: input.category_ids,
      gift_type: input.gift_type,
      storefront_visible: input.storefront_visible,
      stock_location_id: stockLocation.id,
      variants: input.variants,
    },
  });

  return res.status(201).json({
    product: product
      ? {
          ...sanitizeCatalogProduct(product),
          market_profile: marketProfiles[0] ?? null,
          origin_profile: originProfiles[0] ?? null,
        }
      : null,
  });
}
