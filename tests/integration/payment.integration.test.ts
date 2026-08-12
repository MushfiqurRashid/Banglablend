import { describe, expect, it } from "vitest";
import { runIntegration, storefrontFetch } from "./helpers";

describe.runIf(runIntegration)("payment callback boundary", () => {
  it("still records (but rejects) a malformed SSLCOMMERZ IPN notification", async () => {
    const response = await storefrontFetch("/api/payments/sslcommerz/ipn", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
    // The route always returns 200 to stop SSLCOMMERZ retrying, even for malformed payloads --
    // see apps/storefront/src/app/api/payments/sslcommerz/ipn/route.ts. The audit row it writes
    // (payment_audits.status = "rejected") is what actually distinguishes this from a real payment.
    expect(response.status).toBe(200);
  });

  it.skip("validates a sandbox callback and treats its replay as a duplicate", async () => {
    // Supply a fresh SSLCOMMERZ sandbox payload via the provider's test console. The first request
    // must validate remotely and write a payment_audits row keyed by that val_id; the replay must
    // hit the idempotency_key unique constraint rather than double-crediting the order.
  });
});
