import { NextResponse } from "next/server";
import { searchContent } from "@bangla-blend/search-client";
import { getActiveMarket, getStoreProducts } from "@/lib/commerce/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length > 120)
    return NextResponse.json({ error: "Search is too long." }, { status: 400 });
  const market = await getActiveMarket();
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_SEARCH_KEY;
  if (host && apiKey) {
    const results = await searchContent({ host, apiKey, query, market: market.code });
    const hits = results.hits;
    return NextResponse.json({ hits, estimatedTotalHits: hits.length, source: "meilisearch" });
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true"
  ) {
    const products = await getStoreProducts(query, market.code);
    return NextResponse.json({
      hits: products.map((product) => ({
        id: product.id,
        type: product.collection === "gifts" ? "gift" : "product",
        title: product.title,
        slug: product.handle,
        excerpt: product.description,
        eligibleMarkets: product.eligibleMarkets,
      })),
      estimatedTotalHits: products.length,
      source: "development-preview",
    });
  }
  return NextResponse.json({ error: "Search is not configured." }, { status: 503 });
}
