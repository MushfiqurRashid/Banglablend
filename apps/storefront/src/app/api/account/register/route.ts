import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";
import { ensureCustomerProfile } from "@/lib/auth/customer-provisioning";
import { siteConfig } from "@/config/site";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
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
    options: {
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/account`,
    },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Registration failed." }, { status: 400 });
  }

  // Supabase intentionally returns an obfuscated user for an already-registered address. Do not
  // attempt to provision that synthetic id; the login path provisions the real user instead.
  const isNewIdentity = (data.user.identities?.length ?? 0) > 0;
  if (isNewIdentity) {
    const provisioningError = await ensureCustomerProfile(data.user);
    if (provisioningError) {
      return NextResponse.json({ error: "Your account was created, but its customer profile could not be prepared. Try signing in." }, { status: 503 });
    }
  }

  return NextResponse.json(
    { authenticated: Boolean(data.session), confirmationRequired: !data.session },
    { status: 201 },
  );
}
