import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "./env";

// Stateless anonymous client for public server-side reads. Public catalog/content queries do not
// need a user's cookie-backed session; attaching one makes parallel RSC queries compete to rotate
// the same refresh token when it expires.
export function createSupabasePublicClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
