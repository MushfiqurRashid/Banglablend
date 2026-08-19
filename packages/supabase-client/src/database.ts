// Placeholder for the generated Supabase database types.
//
// Regenerate this file once the project is reachable (either via the Supabase MCP tools or the
// CLI with SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN set):
//
//   pnpm --filter @bangla-blend/supabase-client db:types
//
// which runs `supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" --schema public`
// against the schema defined in supabase/migrations.
//
// This Database type is exported for that future swap-in but is intentionally NOT passed as the
// generic to createClient/createServerClient/createBrowserClient in browser.ts/server.ts/
// service-role.ts: postgrest-js resolves Database['public']['Tables'][Table] to `never` whenever
// Table is a generic parameter (i.e. inside supabase-js's own .from/.insert/.update/.select
// internals) rather than a literal, for ANY Tables shape keyed by `Record<string, ...>` -- not
// just this placeholder. (Functions doesn't have that problem below because it's typed with
// explicit named keys instead of an index signature; doing the same for all ~68 tables is what
// real codegen will produce.) Until then, clients are constructed untyped and call sites that want
// real safety add `.returns<T>()` (reads) or an explicit row interface (writes) themselves.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }>;
    Views: Record<string, { Row: Record<string, Json> }>;
    // Named explicitly (rather than Record<string, ...>) because callers pass a typed args object
    // to supabase.rpc(name, args) -- an index-signature Functions type resolves each call's Args
    // to `undefined` instead of `Record<string, Json>`, which then rejects every real argument
    // object. Regenerate alongside Tables once `db:types` can reach the live project; keep this
    // list in sync with supabase/migrations/20260808000014_commerce_functions.sql until then.
    Functions: {
      cart_add_line_item: { Args: { p_cart_id: string; p_variant_id: string; p_quantity: number }; Returns: Record<string, Json> };
      cart_set_line_item_quantity: { Args: { p_cart_id: string; p_line_id: string; p_quantity: number }; Returns: void };
      cart_remove_line_item: { Args: { p_cart_id: string; p_line_id: string }; Returns: void };
      complete_cart: { Args: { p_cart_id: string }; Returns: Record<string, Json> };
      replace_recipe_structure: {
        Args: { target_recipe_id: string; ingredient_rows: Json; step_rows: Json };
        Returns: void;
      };
    };
    Enums: Record<string, string>;
  };
}
