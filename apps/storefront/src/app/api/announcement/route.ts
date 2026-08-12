import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@bangla-blend/supabase-client";

export const dynamic = "force-dynamic";

interface AnnouncementRow {
  message: string;
  link: { label?: string; href?: string } | null;
  starts_at: string | null;
  ends_at: string | null;
}

export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market") ?? "bd";
  const allowedMarket = ["bd", "gb", "us"].includes(market) ? market : "bd";
  const { url, anonKey } = getPublicSupabaseEnv();
  const supabase = createClient(url, anonKey, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const { data, error } = await supabase
    .from("announcements")
    .select("message, link, starts_at, ends_at")
    .eq("language", "en")
    .eq("active", true)
    .in("market", ["all", allowedMarket])
    .order("updated_at", { ascending: false })
    .limit(20)
    .returns<AnnouncementRow[]>();
  if (error) return NextResponse.json({ error: "Announcement unavailable." }, { status: 503 });

  const now = new Date().toISOString();
  const current = (data ?? []).find((row) => (!row.starts_at || row.starts_at <= now) && (!row.ends_at || row.ends_at >= now));
  const fallback = allowedMarket === "bd"
    ? "The essence of Bangladeshi taste \u00b7 Crafted in Bangladesh"
    : "Rooted in Bangladesh \u00b7 Made for kitchens everywhere";

  return NextResponse.json(
    { message: current?.message ?? fallback, link: current?.link ?? undefined },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
