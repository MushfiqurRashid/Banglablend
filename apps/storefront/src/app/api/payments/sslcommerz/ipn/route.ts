import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backend = process.env.MEDUSA_BACKEND_URL;
  if (!backend) return NextResponse.json({ error: "Payment backend unavailable." }, { status: 503 });
  const body = await request.text();
  const response = await fetch(new URL("/webhooks/sslcommerz/ipn", backend), { method: "POST", headers: { "content-type": request.headers.get("content-type") ?? "application/x-www-form-urlencoded" }, body });
  return new NextResponse(await response.text(), { status: response.status });
}
