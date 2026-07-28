import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  catalogProductFields,
  sanitizeCatalogProduct,
  type CatalogProductRecord
} from "../../../../lib/admin/catalog";
import { PRODUCT_MARKET_MODULE } from "../../../../modules/product-market";
import type ProductMarketModuleService from "../../../../modules/product-market/service";
import { PRODUCT_ORIGIN_MODULE } from "../../../../modules/product-origin";
import type ProductOriginModuleService from "../../../../modules/product-origin/service";

const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0)
});

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid catalog filters.", errors: parsed.error.flatten() });
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
      order: { updated_at: "DESC" }
    }
  });

  const products = data as CatalogProductRecord[];
  const productIds = products.map((product) => product.id);
  const marketService = req.scope.resolve<ProductMarketModuleService>(PRODUCT_MARKET_MODULE);
  const originService = req.scope.resolve<ProductOriginModuleService>(PRODUCT_ORIGIN_MODULE);
  const [markets, origins] = productIds.length
    ? await Promise.all([
        marketService.listProductMarkets({ product_id: productIds }),
        originService.listProductOrigins({ product_id: productIds })
      ])
    : [[], []];

  const marketByProduct = new Map(markets.map((market) => [market.product_id, market]));
  const originByProduct = new Map(origins.map((origin) => [origin.product_id, origin]));

  return res.json({
    products: products.map((product) => ({
      ...sanitizeCatalogProduct(product),
      market_profile: marketByProduct.get(product.id) ?? null,
      origin_profile: originByProduct.get(product.id) ?? null
    })),
    count: metadata?.count ?? products.length,
    offset: metadata?.skip ?? parsed.data.offset,
    limit: metadata?.take ?? parsed.data.limit
  });
}
