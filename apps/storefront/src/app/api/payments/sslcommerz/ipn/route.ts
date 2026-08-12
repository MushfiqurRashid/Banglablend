import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { validateSslCommerzTransaction } from "@/lib/payments/sslcommerz";

// SSLCOMMERZ's IPN callback is the sole source of truth for payment state (the success/fail/cancel
// browser redirects in [status]/route.ts are informational only). Every call is written to the
// append-only payment_audits ledger, validated is not, so reconciliation evidence always exists
// even for rejected/forged callbacks.
export async function POST(request: Request) {
  const body = await request.text();
  const params = new URLSearchParams(body);
  const valId = params.get("val_id");
  const tranId = params.get("tran_id");
  const amount = params.get("amount");
  const currency = params.get("currency") ?? "BDT";

  const supabase = createSupabaseServiceRoleClient();
  const payloadHash = createHash("sha256").update(body).digest("hex");

  if (!valId || !tranId || !amount) {
    await supabase.from("payment_audits").insert({
      provider: "sslcommerz",
      transaction_id: tranId ?? "unknown",
      event_type: "ipn",
      status: "rejected",
      idempotency_key: `malformed_${payloadHash}`,
      payload_hash: payloadHash,
      safe_payload: { reason: "missing val_id, tran_id, or amount" },
      processed_at: new Date().toISOString(),
    });
    return NextResponse.json({ received: true });
  }

  const { data: session } = await supabase
    .from("payment_sessions")
    .select("id, payment_collection_id, payment_collections ( id, order_id )")
    .eq("provider", "sslcommerz")
    .contains("data", { transaction_id: tranId })
    .maybeSingle();

  const validation = await validateSslCommerzTransaction(valId, {
    amount: Number(amount),
    currency,
    transactionId: tranId,
  }).catch((error: unknown) => ({
    valid: false,
    reason: error instanceof Error ? error.message : "Validation request failed.",
    safeData: {},
  }));

  await supabase.from("payment_audits").insert({
    provider: "sslcommerz",
    transaction_id: tranId,
    order_reference: session?.payment_collections
      ? ((Array.isArray(session.payment_collections) ? session.payment_collections[0] : session.payment_collections)?.order_id ?? null)
      : null,
    event_type: "ipn",
    status: validation.valid ? "captured" : "failed",
    amount: Number(amount),
    currency,
    idempotency_key: valId,
    payload_hash: payloadHash,
    safe_payload: validation.safeData,
    processed_at: new Date().toISOString(),
  });

  if (!session) return NextResponse.json({ received: true });

  const collection = Array.isArray(session.payment_collections) ? session.payment_collections[0] : session.payment_collections;
  const status = validation.valid ? "captured" : "failed";

  await supabase.from("payment_sessions").update({ status }).eq("id", session.id);
  await supabase.from("payments").update({ status, captured_amount: validation.valid ? Number(amount) : 0, captured_at: validation.valid ? new Date().toISOString() : null }).eq("payment_session_id", session.id);
  if (collection?.id) {
    await supabase.from("payment_collections").update({ status: validation.valid ? "completed" : "failed" }).eq("id", collection.id);
  }
  if (collection?.order_id) {
    await supabase.from("orders").update({ payment_status: validation.valid ? "captured" : "canceled" }).eq("id", collection.order_id);
  }

  return NextResponse.json({ received: true });
}
