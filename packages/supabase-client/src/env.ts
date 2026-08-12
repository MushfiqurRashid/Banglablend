function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// createClient()/createServerClient() throw synchronously on an empty URL ("supabaseUrl is
// required"), before any caller's try/catch around the actual query gets a chance to run. Read
// paths (commerce-client's fixture fallback, getCustomerSession returning null) are designed to
// degrade gracefully when Supabase is unreachable -- but that only works if client construction
// itself never throws. A syntactically-valid placeholder keeps construction succeeding when
// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY aren't set yet; the resulting network calls fail normally and
// get caught exactly like a real outage would be.
export function getPublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://not-configured.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "not-configured"
  };
}

// Service-role writes (cart, checkout, inquiries, IPN) are not read paths with a fallback -- an
// unconfigured service role key should fail loudly. Every caller already wraps these routes in
// try/catch (see apps/storefront/src/app/api/*), so throwing here still surfaces as a clean error
// response, not a crashed process.
export function getServiceRoleSupabaseEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  };
}
