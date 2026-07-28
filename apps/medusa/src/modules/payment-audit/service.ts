import { MedusaService } from "@medusajs/framework/utils";
import PaymentAudit from "./models/payment-audit";

class PaymentAuditModuleService extends MedusaService({ PaymentAudit }) {}
export default PaymentAuditModuleService;
