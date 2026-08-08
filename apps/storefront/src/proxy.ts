import { NextResponse, type NextRequest } from "next/server";
import { isUnsafeCrossSiteRequest } from "@/lib/security/request";

export function proxy(request: NextRequest) {
  const externallyAuthenticated = request.nextUrl.pathname.startsWith("/api/payments/sslcommerz/") || request.nextUrl.pathname === "/api/revalidate/sanity";
  if (!externallyAuthenticated && isUnsafeCrossSiteRequest(request)) return NextResponse.json({ error: "Request from another site rejected." }, { status: 403 });
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-storefront-locale", "en");
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next(?:/|$)|favicon.ico|.*\\..*).*)"],
};
