import { NextResponse } from "next/server";
import { CART_COOKIE, MARKET_COOKIE, getMarket, isMarketCode } from "@/config/site";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { market?: string } | null;
  if (!body?.market || !isMarketCode(body.market)) {
    return NextResponse.json({ error: "Invalid market." }, { status: 400 });
  }
  const market = getMarket(body.market);
  if (!market.enabled) return NextResponse.json({ error: "This market is not active." }, { status: 409 });
  const response = NextResponse.json({ market });
  response.cookies.set(MARKET_COOKIE, market.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  response.cookies.delete(CART_COOKIE);
  return response;
}
