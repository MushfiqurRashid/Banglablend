import { NextResponse } from "next/server";
import { getActiveMarket } from "@/lib/commerce/server";
import { searchStorefront } from "@/lib/search/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length > 120)
    return NextResponse.json({ error: "Search is too long." }, { status: 400 });
  if (!query) return NextResponse.json({ hits: [], estimatedTotalHits: 0, source: "supabase" });
  const market = await getActiveMarket();
  return NextResponse.json(await searchStorefront(query, market.code));
}
