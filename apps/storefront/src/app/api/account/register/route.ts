import { NextResponse } from "next/server";
import { z } from "zod";
import { CUSTOMER_TOKEN_COOKIE } from "@/lib/auth/server";

const schema = z.object({ firstName: z.string().min(1).max(80), lastName: z.string().min(1).max(80), email: z.email(), password: z.string().min(10).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details. Passwords need at least 10 characters." }, { status: 400 });
  const backend = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.MEDUSA_PUBLISHABLE_API_KEY;
  if (!backend || !publishableKey) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  const auth = await fetch(new URL("/auth/customer/emailpass/register", backend), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }) });
  const authPayload = (await auth.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!auth.ok || !authPayload?.token) return NextResponse.json({ error: authPayload?.message ?? "Registration failed." }, { status: 400 });
  const customer = await fetch(new URL("/store/customers", backend), { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${authPayload.token}`, "x-publishable-api-key": publishableKey }, body: JSON.stringify({ email: parsed.data.email, first_name: parsed.data.firstName, last_name: parsed.data.lastName }) });
  if (!customer.ok) return NextResponse.json({ error: "The customer profile could not be created." }, { status: 400 });
  const response = NextResponse.json({ authenticated: true }, { status: 201 });
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, authPayload.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
