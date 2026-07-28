import { createHmac, timingSafeEqual } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("callback signature boundary", () => {
  it("accepts only the exact HMAC body digest", () => {
    const secret = "test-only-secret";
    const body = JSON.stringify({ _id: "drafts.recipe-1" });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const changed = createHmac("sha256", secret).update(`${body}x`).digest("hex");
    expect(timingSafeEqual(Buffer.from(signature), Buffer.from(signature))).toBe(true);
    expect(timingSafeEqual(Buffer.from(signature), Buffer.from(changed))).toBe(false);
  });
});
