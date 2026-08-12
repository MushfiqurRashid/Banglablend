import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "./env";

// Minimal shape of what Next.js's `cookies()` (from "next/headers") returns, in both its
// read-only (Server Component) and mutable (Route Handler / Server Action) forms.
export interface NextCookieStore {
  getAll(): Array<{ name: string; value: string }>;
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

// @supabase/ssr wants { getAll, setAll }; Next only gives us { getAll, set }. This adapts one to
// the other. Called from a Server Component, `set` throws on every call (Next enforces
// read-only cookies there) -- swallowed here because Supabase only needs to write cookies when
// refreshing a session, which happens in Route Handlers/Server Actions/middleware, not RSC render.
export function nextCookieAdapter(store: NextCookieStore): CookieMethodsServer {
  return {
    getAll: () => store.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) store.set(name, value, options);
      } catch {
        // Called from a Server Component render; middleware/Route Handler owns the real refresh.
      }
    },
  };
}

// Server-side (Server Component / Route Handler / Server Action) Supabase client, still governed
// by RLS -- it authenticates as whichever user's session cookies were passed in, nothing more.
//
// This package is shared by apps/storefront and apps/admin, so the cookie store is a parameter
// rather than an internal `next/headers` import. Example:
//
//   import { cookies } from "next/headers";
//   const supabase = createSupabaseServerClient(await cookies());
//
// Not parameterized with <Database> -- see the comment atop database.ts.
export interface SupabaseAuthCookieOptions {
  cookieName?: string;
}

export function createSupabaseServerClient(cookieStore: NextCookieStore, options: SupabaseAuthCookieOptions = {}) {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: nextCookieAdapter(cookieStore),
    ...(options.cookieName ? { cookieOptions: { name: options.cookieName } } : {}),
  });
}
