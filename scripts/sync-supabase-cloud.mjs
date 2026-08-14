import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const expectedProjectRef = "fwcwhiprbaqqwiyryhpa";
const require = createRequire(import.meta.url);
const supabaseCli = path.join(path.dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");

function loadEnvironmentFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

function fail(message) {
  process.stderr.write(`Supabase Cloud sync refused: ${message}\n`);
  process.exit(1);
}

function runSupabase(arguments_, { allowPrompt = false } = {}) {
  const result = spawnSync(process.execPath, [supabaseCli, ...arguments_], {
    env: process.env,
    encoding: "utf8",
    stdio: allowPrompt ? "inherit" : ["ignore", "pipe", "pipe"],
    shell: false,
  });
  if (!allowPrompt) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

loadEnvironmentFile(".env");

if (process.env.SUPABASE_PROJECT_REF !== expectedProjectRef) {
  fail(`SUPABASE_PROJECT_REF must equal ${expectedProjectRef}.`);
}

let cloudUrl;
try {
  cloudUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
} catch {
  fail("NEXT_PUBLIC_SUPABASE_URL is missing or invalid.");
}
if (cloudUrl.protocol !== "https:" || cloudUrl.hostname !== `${expectedProjectRef}.supabase.co`) {
  fail(`NEXT_PUBLIC_SUPABASE_URL must be https://${expectedProjectRef}.supabase.co.`);
}
if (!process.env.SUPABASE_ACCESS_TOKEN) {
  fail("SUPABASE_ACCESS_TOKEN is required. Create one in Supabase Account > Access Tokens.");
}

const linkedRefPath = "supabase/.temp/project-ref";
if (!existsSync(linkedRefPath)) fail("the repository is not linked. Run: pnpm db:link");
const linkedRef = readFileSync(linkedRefPath, "utf8").trim();
if (linkedRef !== expectedProjectRef) {
  fail(`the active CLI link targets ${linkedRef || "an unknown project"}, not ${expectedProjectRef}.`);
}

const passwordArguments = process.env.SUPABASE_DB_PASSWORD
  ? ["--password", process.env.SUPABASE_DB_PASSWORD]
  : [];

process.stdout.write("Checking linked Supabase Cloud migration history...\n");
runSupabase(["migration", "list", "--linked", ...passwordArguments]);
process.stdout.write("Previewing pending Supabase Cloud migrations...\n");
runSupabase(["db", "push", "--linked", "--dry-run", ...passwordArguments]);
process.stdout.write("Applying pending Supabase Cloud migrations...\n");
runSupabase(["db", "push", "--linked", ...passwordArguments, "--yes"], {
  allowPrompt: !process.env.SUPABASE_DB_PASSWORD,
});
process.stdout.write("Applying Supabase Cloud Auth and project configuration...\n");
runSupabase(["config", "push", "--project-ref", expectedProjectRef, "--yes"]);
process.stdout.write(`Supabase Cloud project ${expectedProjectRef} is current.\n`);
