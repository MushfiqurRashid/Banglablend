import { describe, expect, it } from "vitest";
import { medusaUrl, runIntegration } from "./helpers";

describe.runIf(runIntegration)("payment callback boundary", () => {
  it("rejects an incomplete SSLCOMMERZ notification", async () => {
    const response = await fetch(new URL("/webhooks/sslcommerz/ipn", medusaUrl), { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(response.status).toBe(400);
  });

  it.skip("validates a sandbox callback and treats its replay as a duplicate", async () => {
    // Supply a fresh SSLCOMMERZ sandbox payload via the provider's test console.
    // The first request must validate remotely; the replay must return duplicate:true.
  });
});
