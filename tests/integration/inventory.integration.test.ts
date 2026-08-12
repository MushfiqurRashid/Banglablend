import { describe, expect, it } from "vitest";
import { anonSupabaseClient, runIntegration } from "./helpers";

describe.runIf(runIntegration)("product catalog eligibility", () => {
  it("only returns published, verified products with priced variants", async () => {
    const supabase = anonSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("status, verified, deleted_at, product_variants ( id, product_prices ( amount ) )")
      .limit(20);
    expect(error).toBeNull();
    const products = (data ?? []) as Array<{ status: string; verified: boolean; product_variants: unknown[] }>;
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.status === "published" && product.verified && product.product_variants.length > 0)).toBe(true);
  });

  it("supports deterministic sorting by title", async () => {
    const supabase = anonSupabaseClient();
    const { data } = await supabase.from("products").select("title").order("title").limit(20);
    const titles = (data ?? []).map((row) => (row as { title: string }).title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
});
