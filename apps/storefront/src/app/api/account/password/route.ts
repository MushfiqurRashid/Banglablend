import { NextResponse } from "next/server";
import { z } from "zod";
import { siteConfig } from "@/config/site";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: z.email() }),
  z.object({ action: z.literal("update"), token: z.string().min(20).max(4096), password: z.string().min(10).max(200) })
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the password reset details." }, { status: 400 });
  const backend = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (!backend) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  if (parsed.data.action === "request") {
    const response = await fetch(new URL("/auth/customer/emailpass/reset-password", backend), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: parsed.data.email, metadata: { reset_url: `${siteConfig.url}/account/reset-password` } })
    });
    if (!response.ok) return NextResponse.json({ error: "Password instructions could not be requested." }, { status: 503 });
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  const response = await fetch(new URL("/auth/customer/emailpass/update", backend), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${parsed.data.token}` },
    body: JSON.stringify({ password: parsed.data.password })
  });
  if (!response.ok) return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  return NextResponse.json({ updated: true });
}
