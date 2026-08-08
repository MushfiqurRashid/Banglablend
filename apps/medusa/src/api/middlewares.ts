import { authenticate, defineMiddlewares } from "@medusajs/framework/http";
import { PolicyOperation } from "@medusajs/framework/utils";

const adminAuthentication = authenticate("user", ["session", "bearer", "api-key"]);

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/superadmin*",
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/inquiries*",
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/gift-orders*",
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/payment-audits*",
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/content*",
      middlewares: [adminAuthentication],
    },
    {
      method: ["GET"],
      matcher: "/admin/superadmin*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.read }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin",
      policies: [{ resource: "superadmin", operation: PolicyOperation.create }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin/catalog",
      policies: [{ resource: "superadmin", operation: PolicyOperation.create }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin/catalog/*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.update }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin/catalogs",
      policies: [{ resource: "superadmin", operation: PolicyOperation.create }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin/catalogs/*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.update }],
    },
    {
      method: ["POST"],
      matcher: "/admin/superadmin/settings*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.update }],
    },
    {
      method: ["PUT", "PATCH"],
      matcher: "/admin/superadmin/*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.update }],
    },
    {
      method: ["DELETE"],
      matcher: "/admin/superadmin/*",
      policies: [{ resource: "superadmin", operation: PolicyOperation.delete }],
    },
    {
      method: ["GET"],
      matcher: "/admin/inquiries*",
      policies: [{ resource: "inquiry", operation: PolicyOperation.read }],
    },
    {
      method: ["POST"],
      matcher: "/admin/inquiries",
      policies: [{ resource: "inquiry", operation: PolicyOperation.create }],
    },
    {
      method: ["POST", "PUT", "PATCH"],
      matcher: "/admin/inquiries/*",
      policies: [{ resource: "inquiry", operation: PolicyOperation.update }],
    },
    {
      method: ["DELETE"],
      matcher: "/admin/inquiries/*",
      policies: [{ resource: "inquiry", operation: PolicyOperation.delete }],
    },
    {
      method: ["GET"],
      matcher: "/admin/gift-orders*",
      policies: [{ resource: "gift_order", operation: PolicyOperation.read }],
    },
    {
      method: ["POST"],
      matcher: "/admin/gift-orders",
      policies: [{ resource: "gift_order", operation: PolicyOperation.create }],
    },
    {
      method: ["POST", "PUT", "PATCH"],
      matcher: "/admin/gift-orders/*",
      policies: [{ resource: "gift_order", operation: PolicyOperation.update }],
    },
    {
      method: ["DELETE"],
      matcher: "/admin/gift-orders/*",
      policies: [{ resource: "gift_order", operation: PolicyOperation.delete }],
    },
    {
      method: ["GET"],
      matcher: "/admin/payment-audits*",
      policies: [{ resource: "payment_audit", operation: PolicyOperation.read }],
    },
    {
      method: ["POST"],
      matcher: "/admin/payment-audits",
      policies: [{ resource: "payment_audit", operation: PolicyOperation.create }],
    },
    {
      method: ["POST", "PUT", "PATCH"],
      matcher: "/admin/payment-audits/*",
      policies: [{ resource: "payment_audit", operation: PolicyOperation.update }],
    },
    {
      method: ["DELETE"],
      matcher: "/admin/payment-audits/*",
      policies: [{ resource: "payment_audit", operation: PolicyOperation.delete }],
    },
  ],
});
