import { createHash } from "node:crypto";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { PAYMENT_AUDIT_MODULE } from "../../../../modules/payment-audit";
import type PaymentAuditModuleService from "../../../../modules/payment-audit/service";
import { SslCommerzClient } from "../../../../modules/payments/sslcommerz/client";

interface PaymentSessionUpdater {
  updatePaymentSession(input: { id: string; data: Record<string, unknown> }): Promise<unknown>;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as Record<string, string | undefined>;
  const transactionId = body.tran_id;
  const validationId = body.val_id;
  const amount = body.amount;
  const currency = body.currency;
  const sessionId = body.value_a ?? body.session_id;
  if (!transactionId || !validationId || !amount || !currency || !sessionId) return res.status(400).json({ message: "Missing payment notification fields." });
  const service = req.scope.resolve<PaymentAuditModuleService>(PAYMENT_AUDIT_MODULE);
  const idempotencyKey = createHash("sha256").update(`sslcommerz:${transactionId}:${validationId}:${body.status ?? ""}`).digest("hex");
  const [existing] = await service.listPaymentAudits({ idempotency_key: idempotencyKey });
  if (existing?.status === "forwarded") return res.status(200).json({ received: true, duplicate: true });
  if (existing?.status === "rejected") return res.status(400).json({ message: "This notification was already rejected.", duplicate: true });
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: sessions } = await query.graph({ entity: "payment_session", fields: ["id", "amount", "currency_code", "data"], filters: { id: sessionId } });
  const session = sessions[0];
  if (!session) return res.status(404).json({ message: "Unknown payment session." });
  const expectedReference = String(session.data?.order_reference ?? transactionId);
  const client = new SslCommerzClient({ storeId: process.env.SSLCOMMERZ_STORE_ID ?? "", storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "", sandbox: process.env.SSLCOMMERZ_SANDBOX !== "false", successUrl: process.env.SSLCOMMERZ_SUCCESS_URL ?? "", failUrl: process.env.SSLCOMMERZ_FAIL_URL ?? "", cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL ?? "", ipnUrl: process.env.SSLCOMMERZ_IPN_URL ?? "" });
  const validation = await client.validateTransaction(validationId, { amount: String(session.amount), currency: session.currency_code, orderReference: expectedReference });
  const safePayload = { transaction_id: transactionId, validation_id: validationId, amount, currency, status: body.status, bank_transaction_id: body.bank_tran_id, risk_level: body.risk_level };
  const audit = existing ?? await service.createPaymentAudits({ provider: "sslcommerz", transaction_id: transactionId, order_reference: expectedReference, event_type: "ipn", status: validation.valid ? "validated" : "rejected", amount: Number(amount), currency, idempotency_key: idempotencyKey, payload_hash: createHash("sha256").update(JSON.stringify(body)).digest("hex"), safe_payload: safePayload, processed_at: new Date() });
  if (!validation.valid) return res.status(400).json({ message: validation.reason, audit_id: audit.id });
  try {
    const payment = req.scope.resolve<PaymentSessionUpdater>(Modules.PAYMENT);
    await payment.updatePaymentSession({ id: sessionId, data: { ...(session.data ?? {}), status: "authorized", validation_id: validationId, transaction_id: transactionId } });
  } catch {
    await service.updatePaymentAudits({ id: audit.id, status: "forward_failed", processed_at: new Date() });
    return res.status(502).json({ message: "Validated notification could not update the payment session.", audit_id: audit.id });
  }
  const baseUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
  const forwarded = await fetch(new URL("/hooks/payment/sslcommerz_sslcommerz", baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(Object.entries(body).filter((entry): entry is [string, string] => typeof entry[1] === "string")) });
  if (!forwarded.ok) {
    await service.updatePaymentAudits({ id: audit.id, status: "forward_failed", processed_at: new Date() });
    return res.status(502).json({ message: "Validated notification could not update the payment session.", audit_id: audit.id });
  }
  await service.updatePaymentAudits({ id: audit.id, status: "forwarded", processed_at: new Date() });
  return res.status(200).json({ received: true, audit_id: audit.id });
}
