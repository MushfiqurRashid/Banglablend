import { createClient } from "@supabase/supabase-js";
import { getServiceRoleSupabaseEnv } from "./env";

// Service-role client: BYPASSES ROW LEVEL SECURITY entirely. Never import this from client
// components or any code path that could run in the browser -- SUPABASE_SERVICE_ROLE_KEY has no
// NEXT_PUBLIC_ prefix specifically so bundlers refuse to inline it client-side, but the import
// itself must still be kept server-only (route handlers, server actions, cron/edge functions).
//
// This is where guest cart/checkout writes, order-placement, the SSLCOMMERZ IPN handler, and any
// other "no signed-in user, but still a legitimate write" operation belongs -- the same role the
// old storefront's server-only Medusa API proxy played.
//
// Not parameterized with <Database> -- see the comment atop database.ts.
export function createSupabaseServiceRoleClient() {
  const { url, serviceRoleKey } = getServiceRoleSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
