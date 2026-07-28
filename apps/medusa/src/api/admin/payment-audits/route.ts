import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PAYMENT_AUDIT_MODULE } from "../../../modules/payment-audit";
import type PaymentAuditModuleService from "../../../modules/payment-audit/service";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<PaymentAuditModuleService>(PAYMENT_AUDIT_MODULE);
  const [audits, count] = await service.listAndCountPaymentAudits({}, { order: { created_at: "DESC" }, take: 100 });
  return res.json({ payment_audits: audits, count });
}
