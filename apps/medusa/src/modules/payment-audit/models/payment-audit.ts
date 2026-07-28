import { model } from "@medusajs/framework/utils";

const PaymentAudit = model.define("payment_audit", {
  id: model.id().primaryKey(),
  provider: model.text(),
  transaction_id: model.text(),
  order_reference: model.text().nullable(),
  event_type: model.text(),
  status: model.text(),
  amount: model.bigNumber().nullable(),
  currency: model.text().nullable(),
  idempotency_key: model.text().unique(),
  payload_hash: model.text(),
  safe_payload: model.json().nullable(),
  processed_at: model.dateTime().nullable()
});

export default PaymentAudit;
