import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function firstForwardedValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function publicRequestOrigin(request: NextRequest) {
  const configuredAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (configuredAdminUrl) {
    try {
      return new URL(configuredAdminUrl).origin;
    } catch {
      // Fall through to the proxy headers so a malformed optional value does not break every request.
    }
  }

  const host = firstForwardedValue(request.headers.get("x-forwarded-host")) ?? request.headers.get("host");
  const protocol = firstForwardedValue(request.headers.get("x-forwarded-proto")) ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

function isUnsafeCrossSiteRequest(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin !== publicRequestOrigin(request);
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  if (isUnsafeCrossSiteRequest(request)) {
    return NextResponse.json({ error: "Request from another site rejected." }, { status: 403 });
  }

  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookieOptions: {
        name: "banglablend-admin-auth",
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          // Rebuild from request.headers *after* the writes above. `requestHeaders` was snapshotted
          // before the refresh, so reusing it here forwarded the pre-refresh cookie to the render,
          // which then tried to refresh again with an already-rotated token.
          const refreshedHeaders = new Headers(request.headers);
          refreshedHeaders.set("x-request-id", requestId);
          response = NextResponse.next({ request: { headers: refreshedHeaders } });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getUser();
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next(?:/|$)|favicon.ico|.*\\..*).*)"],
};
