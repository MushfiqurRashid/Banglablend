import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "./env";

// Client-component Supabase client. Governed entirely by RLS (see supabase/migrations) -- it
// never has elevated access, so it is safe to call from any "use client" component.
//
// Not parameterized with <Database> -- see the comment atop database.ts for why threading the
// placeholder type through here does more harm (silently resolves every table to `never`) than
// good.
export function createSupabaseBrowserClient(options: { cookieName?: string } = {}) {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient(url, anonKey, options.cookieName ? { cookieOptions: { name: options.cookieName } } : undefined);
}
