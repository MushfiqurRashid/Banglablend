import { Meilisearch } from "meilisearch";
import type { MarketCode, SearchDocument } from "@bangla-blend/types";

export const SEARCH_INDEX = "bangla_blend";

export const synonyms: Record<string, string[]> = {
  mezban: ["mezbani", "মেজবান"],
  chattogram: ["chittagong", "চট্টগ্রাম"],
  hathazari: ["hathajari", "হাটহাজারী"],
  "shorisha ilish": ["mustard hilsa", "সরিষা ইলিশ"]
};

export function createSearchClient(host: string, apiKey: string) {
  return new Meilisearch({ host, apiKey });
}

export async function searchContent(input: {
  host: string;
  apiKey: string;
  query: string;
  market: MarketCode;
  type?: SearchDocument["type"];
  limit?: number;
}) {
  const client = createSearchClient(input.host, input.apiKey);
  const filters = [
    `(eligibleMarkets IS NULL OR eligibleMarkets = ${JSON.stringify(input.market)})`,
    input.type ? `type = ${JSON.stringify(input.type)}` : undefined
  ].filter(Boolean);
  return client.index<SearchDocument>(SEARCH_INDEX).search(input.query, {
    filter: filters.join(" AND "),
    limit: input.limit ?? 24,
    attributesToHighlight: ["title", "excerpt"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>"
  });
}
