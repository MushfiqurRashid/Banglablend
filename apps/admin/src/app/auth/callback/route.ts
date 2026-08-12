import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext === "/set-password" ? requestedNext : "/";
  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const supabase = await getSupabaseForRequest();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
