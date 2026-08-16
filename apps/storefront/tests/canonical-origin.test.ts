import { describe, expect, it } from "vitest";
import { getCanonicalStorefrontUrl } from "../src/lib/canonical-origin";

describe("getCanonicalStorefrontUrl", () => {
  it("redirects www to the configured apex while preserving path and query", () => {
    expect(
      getCanonicalStorefrontUrl(
        "https://www.banglablend.store/account/register?source=google",
        "https://banglablend.store",
      )?.toString(),
    ).toBe("https://banglablend.store/account/register?source=google");
  });

  it("leaves the apex and unrelated preview hosts unchanged", () => {
    expect(
      getCanonicalStorefrontUrl(
        "https://banglablend.store/account/register",
        "https://banglablend.store",
      ),
    ).toBeNull();
    expect(
      getCanonicalStorefrontUrl(
        "https://preview.example/account/register",
        "https://banglablend.store",
      ),
    ).toBeNull();
  });
});
