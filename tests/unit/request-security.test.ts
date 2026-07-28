import { describe, expect, it } from "vitest";
import { isUnsafeCrossSiteRequest } from "../../apps/storefront/src/lib/security/request";

describe("same-origin mutation boundary", () => {
  it("rejects a cross-site browser mutation", () => {
    const request = new Request("https://banglablend.example/api/cart", { method: "POST", headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" } });
    expect(isUnsafeCrossSiteRequest(request)).toBe(true);
  });

  it("allows same-origin mutations and safe reads", () => {
    const mutation = new Request("https://banglablend.example/api/cart", { method: "POST", headers: { origin: "https://banglablend.example", "sec-fetch-site": "same-origin" } });
    const read = new Request("https://banglablend.example/api/search?q=tea", { method: "GET", headers: { origin: "https://attacker.example" } });
    expect(isUnsafeCrossSiteRequest(mutation)).toBe(false);
    expect(isUnsafeCrossSiteRequest(read)).toBe(false);
  });
});
