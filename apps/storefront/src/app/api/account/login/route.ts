import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";
import { ensureCustomerProfile } from "@/lib/auth/customer-provisioning";

const schema = z.object({ email: z.email(), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const supabase = await getSupabaseForRequest();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return NextResponse.json({ error: "The email or password was not accepted." }, { status: 401 });
  const provisioningError = await ensureCustomerProfile(data.user);
  if (provisioningError) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Your customer profile could not be prepared. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ authenticated: true });
}
