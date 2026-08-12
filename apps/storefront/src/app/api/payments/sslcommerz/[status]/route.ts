import { NextResponse } from "next/server";

const allowed = new Set(["success", "fail", "cancel"]);

// Browser-facing redirect only -- never authoritative. The IPN handler (../ipn/route.ts) is the
// sole source of truth for payment state; this route just sends the customer somewhere sensible.
export async function POST(request: Request, context: { params: Promise<{ status: string }> }) {
  const { status } = await context.params;
  if (!allowed.has(status)) return NextResponse.json({ error: "Invalid callback." }, { status: 404 });
  const body = await request.text();
  const params = new URLSearchParams(body);
  const orderId = params.get("value_a") ?? "";
  const destination = status === "success" ? "/checkout/success" : "/checkout/failed";
  const target = new URL(destination, request.url);
  if (orderId) target.searchParams.set("order", orderId);
  if (status !== "success") target.searchParams.set("reason", status);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request, context: { params: Promise<{ status: string }> }) {
  return POST(request, context);
}
