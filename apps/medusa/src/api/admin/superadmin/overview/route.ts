import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { QueryGraphFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ADMIN_CONTROL_MODULE } from "../../../../modules/admin-control";
import type AdminControlModuleService from "../../../../modules/admin-control/service";
import { INQUIRY_MODULE } from "../../../../modules/inquiry";
import type InquiryModuleService from "../../../../modules/inquiry/service";
import { PAYMENT_AUDIT_MODULE } from "../../../../modules/payment-audit";
import type PaymentAuditModuleService from "../../../../modules/payment-audit/service";
import {
  getCatalogReadiness,
  type CatalogProductRecord
} from "../../../../lib/admin/catalog";

async function countEntity(
  queryGraph: QueryGraphFunction,
  entity: string,
  filters?: Record<string, unknown>
) {
  const result = await queryGraph({
    entity,
    fields: ["id"],
    ...(filters ? { filters } : {}),
    pagination: { take: 1, skip: 0 }
  });
  return result.metadata?.count ?? result.data.length;
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve<{ graph: QueryGraphFunction }>(
    ContainerRegistrationKeys.QUERY
  );
  const inquiryService = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const paymentAuditService = req.scope.resolve<PaymentAuditModuleService>(PAYMENT_AUDIT_MODULE);
  const adminControlService = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);

  const [
    productsResult,
    orderCount,
    customerCount,
    promotionCount,
    regionCount,
    userCount,
    inquiries,
    paymentAudits,
    auditLogs,
    settings
  ] = await Promise.all([
    query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "thumbnail",
        "images.url",
        "metadata",
        "variants.id",
        "variants.sku",
        "variants.prices.amount",
        "variants.prices.currency_code"
      ],
      pagination: { take: 500, skip: 0, order: { updated_at: "DESC" } }
    }),
    countEntity(query.graph, "order"),
    countEntity(query.graph, "customer"),
    countEntity(query.graph, "promotion"),
    countEntity(query.graph, "region"),
    countEntity(query.graph, "user"),
    inquiryService.listInquiries({}, { order: { created_at: "DESC" }, take: 100 }),
    paymentAuditService.listPaymentAudits({}, { order: { created_at: "DESC" }, take: 20 }),
    adminControlService.listAdminAuditLogs({}, { order: { created_at: "DESC" }, take: 8 }),
    adminControlService.listAppSettings({}, { take: 500 })
  ]);

  const products = productsResult.data as CatalogProductRecord[];
  const readyProducts = products.filter((product) => getCatalogReadiness(product).ready);
  const newInquiries = inquiries.filter((inquiry) => inquiry.status === "new");
  const failedPayments = paymentAudits.filter((audit) =>
    ["rejected", "forward_failed"].includes(audit.status)
  );

  return res.json({
    role: {
      id: "role_super_admin",
      label: "Super Admin",
      authorized: Array.isArray(req.auth_context.app_metadata?.roles)
        && req.auth_context.app_metadata.roles.includes("role_super_admin")
    },
    metrics: {
      products: productsResult.metadata?.count ?? products.length,
      storefront_ready_products: readyProducts.length,
      orders: orderCount,
      customers: customerCount,
      promotions: promotionCount,
      regions: regionCount,
      admin_users: userCount,
      new_inquiries: newInquiries.length,
      payment_exceptions: failedPayments.length,
      settings: settings.length
    },
    attention: {
      catalog: products
        .filter((product) => !getCatalogReadiness(product).ready)
        .slice(0, 8)
        .map((product) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          missing: getCatalogReadiness(product).missing
        })),
      inquiries: newInquiries.slice(0, 8),
      payment_exceptions: failedPayments.slice(0, 8)
    },
    recent_activity: auditLogs,
    integrations: {
      storefront: {
        configured: Boolean(process.env.STOREFRONT_URL),
        url: process.env.STOREFRONT_URL ?? "http://localhost:3000"
      },
      sanity_studio: {
        configured: Boolean(process.env.SANITY_PROJECT_ID),
        url: process.env.SANITY_STUDIO_URL ?? "http://localhost:3333"
      },
      search: {
        configured: Boolean(process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_ADMIN_KEY)
      },
      payments: {
        sslcommerz_enabled: process.env.SSLCOMMERZ_ENABLED === "true",
        sandbox: process.env.SSLCOMMERZ_SANDBOX !== "false"
      }
    }
  });
}
