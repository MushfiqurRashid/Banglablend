import { describe, expect, it } from "vitest";
import { pageRange, parsePage, sanitizeSearchTerm } from "../src/lib/list-query";

describe("admin list query helpers", () => {
  it("falls back to the first page for invalid input", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("not-a-page")).toBe(1);
  });

  it("builds non-overlapping database ranges", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 24 });
    expect(pageRange(2)).toEqual({ from: 25, to: 49 });
  });

  it("removes PostgREST filter punctuation from search input", () => {
    expect(sanitizeSearchTerm("  masala%),email.eq.secret  ")).toBe("masala email.eq.secret");
  });
});
