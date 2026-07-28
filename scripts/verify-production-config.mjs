const errors = [];
const warnings = [];

const required = [
  "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_CONTACT_EMAIL", "MEDUSA_BACKEND_URL", "MEDUSA_PUBLISHABLE_API_KEY",
  "NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "SANITY_WEBHOOK_SECRET",
  "MEILISEARCH_HOST", "MEILISEARCH_SEARCH_KEY", "MEILISEARCH_ADMIN_KEY",
  "DATABASE_URL", "REDIS_URL", "JWT_SECRET", "COOKIE_SECRET", "MEDUSA_COD_ENABLED", "SSLCOMMERZ_ENABLED",
  "EMAIL_PROVIDER", "EMAIL_PROVIDER_API_KEY", "EMAIL_FROM_ADDRESS"
];

for (const name of required) if (!process.env[name]?.trim()) errors.push(`${name} is required.`);

if (process.env.NEXT_PUBLIC_CONTACT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.NEXT_PUBLIC_CONTACT_EMAIL)) errors.push("NEXT_PUBLIC_CONTACT_EMAIL must be a valid monitored address.");

for (const name of ["NEXT_PUBLIC_SITE_URL", "MEDUSA_BACKEND_URL", "MEILISEARCH_HOST"]) {
  const value = process.env[name];
  if (!value) continue;
  try {
    if (new URL(value).protocol !== "https:") errors.push(`${name} must use HTTPS.`);
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

for (const name of ["JWT_SECRET", "COOKIE_SECRET", "SANITY_WEBHOOK_SECRET"]) {
  const value = process.env[name] ?? "";
  if (value.length < 32 || /replace|example|development|build-only/i.test(value)) errors.push(`${name} must be an independent production secret of at least 32 characters.`);
}

for (const name of ["PRODUCT_CATALOG_APPROVED", "EDITORIAL_CONTENT_APPROVED", "LEGAL_CONTENT_APPROVED", "OPERATIONS_RELEASE_APPROVED"]) {
  if (process.env[name] !== "true") errors.push(`${name}=true requires recorded human approval before launch.`);
}

if (process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true") errors.push("ENABLE_DEVELOPMENT_FALLBACKS must never be true in production.");
if (process.env.MEDUSA_COD_ENABLED !== "true" && process.env.SSLCOMMERZ_ENABLED !== "true") errors.push("At least one Bangladesh payment method must be explicitly enabled.");
if (/localhost|127\.0\.0\.1|example\.com/i.test(Object.values(process.env).filter((value) => typeof value === "string").join("\n"))) warnings.push("One or more environment values still contain localhost, 127.0.0.1, or example.com; review all deployment variables.");

if (process.env.SSLCOMMERZ_ENABLED === "true") {
  for (const name of ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD", "SSLCOMMERZ_SUCCESS_URL", "SSLCOMMERZ_FAIL_URL", "SSLCOMMERZ_CANCEL_URL", "SSLCOMMERZ_IPN_URL"]) {
    if (!process.env[name]?.trim()) errors.push(`${name} is required when SSLCOMMERZ is enabled.`);
  }
  if (process.env.SSLCOMMERZ_SANDBOX !== "false") errors.push("SSLCOMMERZ_SANDBOX must be false for a production payment release.");
}

if (process.env.ENABLE_INTERNATIONAL_CHECKOUT === "true" && !process.env.MEDUSA_INTERNATIONAL_PROVIDER_ID) errors.push("MEDUSA_INTERNATIONAL_PROVIDER_ID is required when international checkout is enabled.");

for (const warning of warnings) process.stderr.write(`WARNING: ${warning}\n`);
if (errors.length) {
  process.stderr.write(`Production configuration is not ready:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("Production configuration and approval gates passed.\n");
