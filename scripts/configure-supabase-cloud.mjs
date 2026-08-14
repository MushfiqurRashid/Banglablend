/* global fetch, process */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

const projectRef = "fwcwhiprbaqqwiyryhpa";
const projectUrl = `https://${projectRef}.supabase.co`;
const require = createRequire(import.meta.url);
const supabaseCli = path.join(path.dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");

function loadEnvironmentFile(path) {
  const values = new Map();
  if (!existsSync(path)) return values;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values.set(name, value);
    if (!process.env[name]) process.env[name] = value;
  }
  return values;
}

function updateEnvironmentFile(path, updates, removals = []) {
  const original = existsSync(path) ? readFileSync(path, "utf8") : "";
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const pending = new Map(Object.entries(updates));
  const remove = new Set(removals);
  const output = [];
  for (const rawLine of original.split(/\r?\n/)) {
    const match = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match) {
      output.push(rawLine);
      continue;
    }
    const name = match[1];
    if (remove.has(name)) continue;
    if (pending.has(name)) {
      output.push(`${name}=${pending.get(name)}`);
      pending.delete(name);
    } else output.push(rawLine);
  }
  while (output.length && output.at(-1) === "") output.pop();
  if (pending.size) output.push("", ...[...pending].map(([name, value]) => `${name}=${value}`));
  writeFileSync(path, `${output.join(newline)}${newline}`, { mode: 0o600 });
}

function supabase(arguments_) {
  const result = spawnSync(process.execPath, [supabaseCli, ...arguments_], { env: process.env, encoding: "utf8", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout ?? "";
}

function keyValue(key) {
  return key.api_key ?? key.apiKey ?? key.value ?? key.key ?? "";
}

loadEnvironmentFile(".env");

if (process.argv.includes("--scrub-examples")) {
  const secretDefaults = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_ACCESS_TOKEN: "",
    SUPABASE_DB_PASSWORD: "",
    REVALIDATE_SECRET: "",
    SSLCOMMERZ_STORE_ID: "",
    SSLCOMMERZ_STORE_PASSWORD: "",
    EMAIL_PROVIDER_API_KEY: "",
  };
  updateEnvironmentFile(".env.example", secretDefaults, ["SUPABASE_DB_URL"]);
  updateEnvironmentFile(".env.production.example", secretDefaults, ["SUPABASE_DB_URL"]);
  process.stdout.write("Secret-bearing values were removed from tracked environment templates.\n");
  process.exit(0);
}

if (process.argv.includes("--prepare-production-env")) {
  const existingRevalidationSecret = process.env.REVALIDATE_SECRET ?? "";
  const revalidationSecret =
    existingRevalidationSecret.length >= 32 && !/replace|example|development|build-only/i.test(existingRevalidationSecret)
      ? existingRevalidationSecret
      : randomBytes(32).toString("hex");
  updateEnvironmentFile(".env", {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://banglablend.store",
    NEXT_PUBLIC_STOREFRONT_URL: "https://banglablend.store",
    NEXT_PUBLIC_ADMIN_URL: "https://bpanel.banglablend.store",
    NEXT_PUBLIC_CONTACT_EMAIL: "banglablend@gmail.com",
    REVALIDATE_SECRET: revalidationSecret,
    ENABLE_INTERNATIONAL_CHECKOUT: "false",
    COD_ENABLED: "true",
    SSLCOMMERZ_ENABLED: "false",
    SSLCOMMERZ_SANDBOX: "false",
    EMAIL_PROVIDER: "resend",
    EMAIL_FROM_ADDRESS: "orders@banglablend.store",
    ENABLE_DEVELOPMENT_FALLBACKS: "false",
    PRODUCT_CATALOG_APPROVED: process.env.PRODUCT_CATALOG_APPROVED || "false",
    EDITORIAL_CONTENT_APPROVED: process.env.EDITORIAL_CONTENT_APPROVED || "false",
    LEGAL_CONTENT_APPROVED: process.env.LEGAL_CONTENT_APPROVED || "false",
    OPERATIONS_RELEASE_APPROVED: process.env.OPERATIONS_RELEASE_APPROVED || "false",
  });
  process.stdout.write("Production defaults and a private revalidation secret were saved to the ignored root .env.\n");
  process.exit(0);
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
let databasePassword = process.env.SUPABASE_DB_PASSWORD;
if (!accessToken) {
  process.stderr.write("Add SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD to the ignored root .env, then rerun pnpm db:configure.\n");
  process.exit(1);
}

if (!databasePassword && process.argv.includes("--reset-db-password")) {
  databasePassword = `${randomBytes(32).toString("base64url")}Aa1!`;
  process.stdout.write(`Rotating the database password for Supabase Cloud project ${projectRef}...\n`);
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: databasePassword }),
  });
  if (!response.ok) {
    process.stderr.write(`Supabase database password rotation failed with HTTP ${response.status}.\n`);
    process.exit(1);
  }
  process.env.SUPABASE_DB_PASSWORD = databasePassword;
  updateEnvironmentFile(".env", { SUPABASE_DB_PASSWORD: databasePassword });
  process.stdout.write("The new database password was saved to the ignored root .env and was not printed.\n");
}

if (!databasePassword) {
  process.stderr.write("Add SUPABASE_DB_PASSWORD to the ignored root .env, or run this script with --reset-db-password.\n");
  process.exit(1);
}

process.stdout.write(`Reading API keys for Supabase Cloud project ${projectRef}...\n`);
const rawKeys = JSON.parse(supabase(["projects", "api-keys", "--project-ref", projectRef, "--reveal", "--output", "json"]));
const apiKeys = Array.isArray(rawKeys) ? rawKeys : rawKeys.apiKeys ?? rawKeys.keys ?? [];
const keyDescriptor = (key) => `${key.name ?? ""} ${key.type ?? ""}`.toLowerCase();
const publicKeyRecord = apiKeys.find((key) => {
  const descriptor = keyDescriptor(key);
  const value = keyValue(key);
  return descriptor.includes("anon") || descriptor.includes("publishable") || value.startsWith("sb_publishable_");
});
const serviceKeyRecord = apiKeys.find((key) => {
  const descriptor = keyDescriptor(key);
  const value = keyValue(key);
  return descriptor.includes("service_role") || descriptor.includes("secret") || value.startsWith("sb_secret_");
});
const publicKey = publicKeyRecord ? keyValue(publicKeyRecord) : "";
const serviceKey = serviceKeyRecord ? keyValue(serviceKeyRecord) : "";
if (!publicKey || !serviceKey) {
  process.stderr.write("Supabase did not return both a publishable/anon key and a service-role/secret key.\n");
  process.exit(1);
}

process.stdout.write(`Linking repository to ${projectRef}...\n`);
supabase(["link", "--project-ref", projectRef, "--password", databasePassword, "--yes"]);

const rootUpdates = {
  SUPABASE_PROJECT_REF: projectRef,
  NEXT_PUBLIC_SUPABASE_URL: projectUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  SUPABASE_ACCESS_TOKEN: accessToken,
  SUPABASE_DB_PASSWORD: databasePassword,
};
updateEnvironmentFile(".env", rootUpdates, ["SUPABASE_DB_URL"]);
updateEnvironmentFile("apps/storefront/.env.local", {
  NEXT_PUBLIC_SUPABASE_URL: projectUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
});
updateEnvironmentFile("apps/admin/.env.local", {
  NEXT_PUBLIC_SUPABASE_URL: projectUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
});

Object.assign(process.env, rootUpdates);
process.stdout.write("Cloud credentials were written to ignored environment files; no key was printed.\n");
const sync = spawnSync(process.execPath, ["scripts/sync-supabase-cloud.mjs"], { env: process.env, stdio: "inherit" });
if (sync.error) throw sync.error;
process.exit(sync.status ?? 1);
