import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStorefrontSessionRoute } from "@/lib/auth/session-route";
import { getCanonicalStorefrontUrl } from "@/lib/canonical-origin";
import { isUnsafeCrossSiteRequest } from "@/lib/security/request";

const AUTH_COOKIE_NAME = "banglablend-storefront-auth";
const REFRESH_RESULT_TTL_MS = 10_000;

interface RefreshedCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

interface SessionRefreshResult {
  cookies: RefreshedCookie[];
  headers: Record<string, string>;
}

// Next can run several RSC/API requests at once. Each request has an immutable snapshot of the
// same old cookie, so auth-js's per-client single-flight cannot coordinate them. Cache the cookie
// writes by that snapshot briefly; all concurrent requests then forward the one rotated session.
const refreshesByCookie = new Map<string, Promise<SessionRefreshResult>>();

async function refreshedSessionCookies(request: NextRequest) {
  const authCookies = request.cookies
    .getAll()
    .filter(({ name }) => name === AUTH_COOKIE_NAME || name.startsWith(`${AUTH_COOKIE_NAME}.`))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (authCookies.length === 0) return { cookies: [], headers: {} };

  const cookieKey = authCookies.map(({ name, value }) => `${name}=${value}`).join(";");
  const existing = refreshesByCookie.get(cookieKey);
  if (existing) return existing;

  const refresh = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return { cookies: [], headers: {} };

    let result: SessionRefreshResult = { cookies: [], headers: {} };
    const supabase = createServerClient(url, anonKey, {
      cookieOptions: { name: AUTH_COOKIE_NAME },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (updatedCookies, updatedHeaders) => {
          result = { cookies: updatedCookies, headers: updatedHeaders };
        },
      },
    });
    await supabase.auth.getUser();
    return result;
  })();

  refreshesByCookie.set(cookieKey, refresh);
  setTimeout(() => refreshesByCookie.delete(cookieKey), REFRESH_RESULT_TTL_MS);
  return refresh;
}

export async function proxy(request: NextRequest) {
  const canonicalUrl = getCanonicalStorefrontUrl(request.url);
  if (canonicalUrl) return NextResponse.redirect(canonicalUrl, 308);

  const externallyAuthenticated =
    request.nextUrl.pathname.startsWith("/api/payments/sslcommerz/") ||
    request.nextUrl.pathname === "/api/revalidate/content";
  if (!externallyAuthenticated && isUnsafeCrossSiteRequest(request))
    return NextResponse.json({ error: "Request from another site rejected." }, { status: 403 });
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-storefront-locale", "en");
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isStorefrontSessionRoute(request.nextUrl.pathname)) {
    const { cookies: cookiesToSet, headers: refreshHeaders } =
      await refreshedSessionCookies(request);
    if (cookiesToSet.length > 0) {
      for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
      // Forward the refreshed cookie to this render as well as the browser. Reusing the headers
      // captured before the writes would make the RSC tree rotate the old token again.
      const refreshedHeaders = new Headers(request.headers);
      refreshedHeaders.set("x-request-id", requestId);
      refreshedHeaders.set("x-storefront-locale", "en");
      response = NextResponse.next({ request: { headers: refreshedHeaders } });
      for (const { name, value, options } of cookiesToSet)
        response.cookies.set(name, value, options);
    }
    for (const [name, value] of Object.entries(refreshHeaders)) response.headers.set(name, value);
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next(?:/|$)|favicon.ico|.*\\..*).*)"],
};
