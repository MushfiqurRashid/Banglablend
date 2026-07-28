import { NextResponse } from "next/server";
import { CUSTOMER_TOKEN_COOKIE } from "@/lib/auth/server";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(CUSTOMER_TOKEN_COOKIE);
  return response;
}
