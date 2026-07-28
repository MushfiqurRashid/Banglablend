import { describe, expect, it } from "vitest";
import { markets } from "../../packages/commerce-client/src/fixtures";

describe("market contract", () => {
  it("keeps Bangladesh and international markets explicit", () => {
    expect(markets.find((market) => market.code === "bd")?.currency).toBe("BDT");
    expect(markets.find((market) => market.code === "gb")?.currency).toBe("GBP");
    expect(markets.find((market) => market.code === "us")?.currency).toBe("USD");
  });

  it("does not silently enable international checkout", () => {
    expect(markets.find((market) => market.code === "gb")?.domestic).toBe(false);
    expect(markets.find((market) => market.code === "us")?.domestic).toBe(false);
  });
});
