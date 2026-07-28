import { NextResponse } from "next/server";
import { contactSchema, inquirySchema, newsletterSchema } from "@bangla-blend/validation";

const requestLog = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > 8;
}

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(key)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const parsed =
    body.type === "newsletter"
      ? newsletterSchema.safeParse(body)
      : body.type === "contact"
        ? contactSchema.safeParse(body)
        : inquirySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please check the form.", issues: parsed.error.issues },
      { status: 400 },
    );

  const backend = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const keyHeader = process.env.MEDUSA_PUBLISHABLE_API_KEY;
  if (backend && keyHeader) {
    const response = await fetch(new URL("/store/inquiries", backend), {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": keyHeader },
      body: JSON.stringify({ type: body.type, ...parsed.data, user_agent: undefined }),
    });
    if (!response.ok)
      return NextResponse.json({ error: "The inquiry service is unavailable." }, { status: 503 });
    return NextResponse.json({ accepted: true }, { status: 202 });
  }
  if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true")
    return NextResponse.json({ accepted: true, preview: true }, { status: 202 });
  return NextResponse.json({ error: "Inquiry service is not configured." }, { status: 503 });
}
