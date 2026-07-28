import { NextResponse } from "next/server";

const allowed = new Set(["success", "fail", "cancel"]);

export async function POST(request: Request, context: { params: Promise<{ status: string }> }) {
  const { status } = await context.params;
  if (!allowed.has(status)) return NextResponse.json({ error: "Invalid callback." }, { status: 404 });
  const backend = process.env.MEDUSA_BACKEND_URL;
  if (!backend) return NextResponse.redirect(new URL(`/checkout/${status === "success" ? "success" : "failed"}?verification=pending`, request.url));
  const body = await request.text();
  const response = await fetch(new URL(`/webhooks/sslcommerz/${status}`, backend), { method: "POST", headers: { "content-type": request.headers.get("content-type") ?? "application/x-www-form-urlencoded" }, body, redirect: "manual" });
  const location = response.headers.get("location") ?? `/checkout/${status === "success" ? "success" : "failed"}`;
  const target = new URL(location, request.url);
  if (target.origin !== new URL(request.url).origin) target.href = new URL(`/checkout/${status === "success" ? "success" : "failed"}?verification=pending`, request.url).href;
  return NextResponse.redirect(target, 303);
}
