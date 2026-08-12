import { describe, expect, it } from "vitest";
import { anonSupabaseClient, runIntegration } from "./helpers";

describe.runIf(runIntegration)("content RLS boundary", () => {
  it("the anon key only ever sees verified editorial rows", async () => {
    const supabase = anonSupabaseClient();
    for (const table of ["recipes", "journal_articles", "geo_regions"] as const) {
      const { data, error } = await supabase.from(table).select("verification_status, verified");
      expect(error).toBeNull();
      const rows = (data ?? []) as Array<{ verification_status: string; verified: boolean }>;
      expect(rows.every((row) => row.verification_status === "verified" && row.verified === true)).toBe(true);
    }
  });
});
