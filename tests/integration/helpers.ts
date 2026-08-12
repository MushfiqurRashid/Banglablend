import { createClient } from "@supabase/supabase-js";
import { expect } from "vitest";

export const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
export const storefrontUrl = process.env.STOREFRONT_URL || "http://127.0.0.1:3000";
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// The storefront's own API routes are the surface under test now -- there's no separate backend
// to call into a REST API on, so this hits apps/storefront/src/app/api/* directly.
export async function storefrontFetch(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, storefrontUrl), {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  expect(
    response.status,
    await response
      .clone()
      .text()
      .catch(() => ""),
  ).toBeLessThan(500);
  return response;
}

// Anon-key client: exercises the same RLS policies a browser would be governed by (see
// supabase/migrations/..._row_level_security.sql), not a service-role bypass.
export function anonSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
