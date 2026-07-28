import { NextResponse } from "next/server";
import { z } from "zod";
import { CUSTOMER_TOKEN_COOKIE } from "@/lib/auth/server";

const schema = z.object({ email: z.email(), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const backend = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (!backend) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  const auth = await fetch(new URL("/auth/customer/emailpass", backend), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
  const payload = (await auth.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!auth.ok || !payload?.token) return NextResponse.json({ error: "The email or password was not accepted." }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, payload.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
