/* global fetch, process */

import { existsSync, readFileSync } from "node:fs";

const expectedProjectRef = "fwcwhiprbaqqwiyryhpa";
const storefrontCallback = "https://banglablend.store/auth/callback";

function loadEnvironmentFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    if (!process.env[name]) process.env[name] = value;
  }
}

function fail(message) {
  process.stderr.write(`Google Auth configuration refused: ${message}\n`);
  process.exit(1);
}

loadEnvironmentFile(".env");

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (projectRef !== expectedProjectRef)
  fail(`SUPABASE_PROJECT_REF must equal ${expectedProjectRef}.`);
if (!accessToken) fail("SUPABASE_ACCESS_TOKEN is required in the ignored root .env.");
if (!clientId || !clientSecret)
  fail(
    "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are required in the ignored root .env.",
  );

const endpoint = `https://api.supabase.com/v1/projects/${expectedProjectRef}/config/auth`;
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
const currentResponse = await fetch(endpoint, { headers });
if (!currentResponse.ok)
  fail(`could not read the current Supabase Auth configuration (HTTP ${currentResponse.status}).`);

const current = await currentResponse.json();
const redirects = String(current.uri_allow_list ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (!redirects.includes(storefrontCallback)) redirects.push(storefrontCallback);

const updateResponse = await fetch(endpoint, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
    uri_allow_list: redirects.join(","),
  }),
});
if (!updateResponse.ok)
  fail(`Supabase rejected the Google Auth configuration (HTTP ${updateResponse.status}).`);

const updated = await updateResponse.json();
if (!updated.external_google_enabled)
  fail("Supabase returned successfully but Google Auth is still disabled.");
process.stdout.write(
  `Google Auth is enabled for Supabase project ${expectedProjectRef}; the storefront callback is allowed.\n`,
);
