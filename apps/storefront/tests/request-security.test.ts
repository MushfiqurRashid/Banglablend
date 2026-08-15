import { describe, expect, it } from "vitest";
import { isUnsafeCrossSiteRequest } from "../src/lib/security/request";

function request({
  method = "POST",
  origin,
  url = "http://internal-container:3000/api/cart",
  forwardedHost,
  forwardedProto,
}: {
  method?: string;
  origin?: string;
  url?: string;
  forwardedHost?: string;
  forwardedProto?: string;
}) {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (forwardedHost) headers.set("x-forwarded-host", forwardedHost);
  if (forwardedProto) headers.set("x-forwarded-proto", forwardedProto);
  return { method, headers, url };
}

describe("isUnsafeCrossSiteRequest", () => {
  it("allows a same-origin POST behind a reverse proxy", () => {
    expect(
      isUnsafeCrossSiteRequest(
        request({
          origin: "https://banglablend.store",
          forwardedHost: "banglablend.store",
          forwardedProto: "https",
        }),
      ),
    ).toBe(false);
  });

  it("supports the www storefront domain independently", () => {
    expect(
      isUnsafeCrossSiteRequest(
        request({
          origin: "https://www.banglablend.store",
          forwardedHost: "www.banglablend.store",
          forwardedProto: "https",
        }),
      ),
    ).toBe(false);
  });

  it("rejects a different origin", () => {
    expect(
      isUnsafeCrossSiteRequest(
        request({
          origin: "https://malicious.example",
          forwardedHost: "banglablend.store",
          forwardedProto: "https",
        }),
      ),
    ).toBe(true);
  });
});
