import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/auth/server";
import { ensureCustomerProfile } from "@/lib/auth/customer-provisioning";
import { siteConfig } from "@/config/site";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext === "/account/reset-password" ? requestedNext : "/account";
  const supabase = await getSupabaseForRequest();

  const verification = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing confirmation token") };
  if (verification.error) return NextResponse.redirect(new URL("/account/login?confirmation=failed", siteConfig.url));

  const { data } = await supabase.auth.getUser();
  if (!data.user || (await ensureCustomerProfile(data.user))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/account/login?confirmation=failed", siteConfig.url));
  }
  return NextResponse.redirect(new URL(next, siteConfig.url));
}
