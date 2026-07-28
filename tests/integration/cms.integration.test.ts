import { describe, expect, it } from "vitest";
import { runIntegration } from "./helpers";

describe.runIf(runIntegration)("Sanity content boundary", () => {
  it("public queries return only verified editorial documents", async () => {
    const projectId = process.env.SANITY_PROJECT_ID;
    const dataset = process.env.SANITY_DATASET || "production";
    expect(projectId).toBeTruthy();
    const query = encodeURIComponent(`*[_type in ["recipe","journalArticle","region"]]{"status":verification.status,"verified":verification.verified}`);
    const response = await fetch(`https://${projectId}.api.sanity.io/v2026-01-01/data/query/${dataset}?query=${query}`);
    expect(response.ok).toBe(true);
    const body = await response.json() as { result: Array<{ status: string; verified: boolean }> };
    expect(body.result.filter((record) => record.verified).every((record) => record.status === "verified")).toBe(true);
  });
});
