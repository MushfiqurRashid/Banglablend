import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { getSupabaseForRequest } from "@/lib/auth/server";

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(10).max(200),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details. Passwords need at least 10 characters." }, { status: 400 });
  }
  const supabase = await getSupabaseForRequest();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName } },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Registration failed." }, { status: 400 });
  }

  // Link to (or create) the customer profile row. Uses the service role because this is
  // system-managed provisioning, not the user editing their own already-linked row -- a guest
  // checkout under the same email may have left an unlinked customer row to attach to here.
  const admin = createSupabaseServiceRoleClient();
  const { data: existing } = await admin.from("customers").select("id").eq("email", parsed.data.email).is("auth_user_id", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) {
    await admin.from("customers").update({ auth_user_id: data.user.id, first_name: parsed.data.firstName, last_name: parsed.data.lastName }).eq("id", existing.id);
  } else {
    await admin.from("customers").insert({ auth_user_id: data.user.id, email: parsed.data.email, first_name: parsed.data.firstName, last_name: parsed.data.lastName });
  }

  return NextResponse.json({ authenticated: Boolean(data.session) }, { status: 201 });
}
