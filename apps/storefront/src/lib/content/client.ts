import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@bangla-blend/supabase-client";

// Public, read-only content client (anon key). RLS already restricts every content table to
// verified/published rows for this key (see supabase/migrations/..._row_level_security.sql), so
// queries below still repeat that filter explicitly for clarity, not as the real security
// boundary. `next: { revalidate, tags }` on the underlying fetch replaces the old Sanity
// `sanityFetch`'s cache behavior so /api/revalidate/content's tag-based invalidation keeps working.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const contentConfigured = Boolean(url && anonKey);

export const contentClient: SupabaseClient<Database> | null = contentConfigured
  ? createClient<Database>(url!, anonKey!, {
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 120, tags: ["content"] } }),
      },
    })
  : null;

let hasLoggedFetchFailure = false;

export function logContentFetchFailure(error: unknown) {
  if (hasLoggedFetchFailure) return;
  const reason = error instanceof Error ? error.message : "Unknown request error";
  console.warn(`[content] Fetch unavailable; rendering fallback content. ${reason}`);
  hasLoggedFetchFailure = true;
}
