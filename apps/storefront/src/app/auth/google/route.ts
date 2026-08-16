import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { getSupabaseForRequest } from "@/lib/auth/server";

export async function GET() {
  const supabase = await getSupabaseForRequest();
  const callbackUrl = new URL("/auth/callback", siteConfig.url);
  callbackUrl.searchParams.set("next", "/account");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/account/login?auth=failed", siteConfig.url));
  }

  return NextResponse.redirect(data.url);
}
