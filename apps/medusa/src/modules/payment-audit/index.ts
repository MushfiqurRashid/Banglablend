import { Module } from "@medusajs/framework/utils";
import PaymentAuditModuleService from "./service";

export const PAYMENT_AUDIT_MODULE = "payment_audit";
export default Module(PAYMENT_AUDIT_MODULE, { service: PaymentAuditModuleService });
