import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";
import { siteConfig } from "@/config/site";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: z.email() }),
  z.object({ action: z.literal("update"), password: z.string().min(10).max(200) }),
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the password reset details." }, { status: 400 });
  const supabase = await getSupabaseForRequest();

  if (parsed.data.action === "request") {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteConfig.url}/account/reset-password`,
    });
    if (error) return NextResponse.json({ error: "Password instructions could not be requested." }, { status: 503 });
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  // Requires an active recovery session, established client-side when the user follows the
  // emailed reset link (Supabase Auth sets that session from the link's token automatically).
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  return NextResponse.json({ updated: true });
}
