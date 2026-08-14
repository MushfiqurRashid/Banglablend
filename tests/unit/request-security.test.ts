import { describe, expect, it } from "vitest";
import { isStorefrontSessionRoute } from "../../apps/storefront/src/lib/auth/session-route";
import { isUnsafeCrossSiteRequest } from "../../apps/storefront/src/lib/security/request";

describe("same-origin mutation boundary", () => {
  it("rejects a cross-site browser mutation", () => {
    const request = new Request("https://banglablend.example/api/cart", {
      method: "POST",
      headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    });
    expect(isUnsafeCrossSiteRequest(request)).toBe(true);
  });

  it("allows same-origin mutations and safe reads", () => {
    const mutation = new Request("https://banglablend.example/api/cart", {
      method: "POST",
      headers: { origin: "https://banglablend.example", "sec-fetch-site": "same-origin" },
    });
    const read = new Request("https://banglablend.example/api/search?q=tea", {
      method: "GET",
      headers: { origin: "https://attacker.example" },
    });
    expect(isUnsafeCrossSiteRequest(mutation)).toBe(false);
    expect(isUnsafeCrossSiteRequest(read)).toBe(false);
  });
});

describe("storefront session refresh boundary", () => {
  it("does not refresh auth for public product, catalog, or polling requests", () => {
    expect(isStorefrontSessionRoute("/products/mezban-masala")).toBe(false);
    expect(isStorefrontSessionRoute("/shop")).toBe(false);
    expect(isStorefrontSessionRoute("/shop/originals")).toBe(false);
    expect(isStorefrontSessionRoute("/api/announcement")).toBe(false);
  });

  it("refreshes auth before routes that read or mutate a customer session", () => {
    expect(isStorefrontSessionRoute("/account/orders")).toBe(true);
    expect(isStorefrontSessionRoute("/api/account/profile")).toBe(true);
    expect(isStorefrontSessionRoute("/api/checkout")).toBe(true);
    expect(isStorefrontSessionRoute("/checkout/success")).toBe(true);
    expect(isStorefrontSessionRoute("/gifts/regional-box")).toBe(true);
    expect(isStorefrontSessionRoute("/shop/gifts/build-a-box")).toBe(true);
  });
});
