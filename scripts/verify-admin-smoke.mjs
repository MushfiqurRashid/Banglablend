import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.ADMIN_SMOKE_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");
const screenshotDir = process.env.ADMIN_SMOKE_SCREENSHOT_DIR;
let email = process.env.ADMIN_SMOKE_EMAIL;
let password = process.env.ADMIN_SMOKE_PASSWORD;
let temporaryUserId;
let adminClient;

if ((!email || !password) && process.env.ADMIN_SMOKE_CREATE_USER === "true") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase URL and service-role key are required to create a synthetic smoke user.");

  adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  email = `admin-smoke-${Date.now()}@example.invalid`;
  password = `Bb1!${crypto.randomUUID()}Aa`;

  const { data: role, error: roleError } = await adminClient.from("staff_roles").select("id").eq("name", "Super Admin").single();
  if (roleError || !role) throw new Error(roleError?.message ?? "Super Admin role was not found.");

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin smoke test" },
  });
  if (createError || !created.user) throw new Error(createError?.message ?? "Could not create the smoke user.");
  temporaryUserId = created.user.id;

  const { error: staffError } = await adminClient.from("staff_members").insert({
    id: temporaryUserId,
    email,
    full_name: "Admin smoke test",
    role_id: role.id,
    is_active: true,
  });
  if (staffError) {
    await adminClient.auth.admin.deleteUser(temporaryUserId);
    throw new Error(staffError.message);
  }
}

if (!email || !password) {
  throw new Error("Provide smoke credentials or set ADMIN_SMOKE_CREATE_USER=true with server-only Supabase credentials.");
}

const routes = [
  "/",
  "/orders",
  "/products",
  "/catalogs",
  "/inventory",
  "/customers",
  "/inquiries",
  "/homepage",
  "/pages",
  "/content",
  "/content/recipes",
  "/reports",
  "/payment-audits",
  "/audit-log",
  "/staff",
  "/settings",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const browserErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});
page.on("pageerror", (error) => browserErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Work email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.href === baseUrl || url.href === `${baseUrl}/`, { timeout: 20_000 });

  if (screenshotDir) {
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, "admin-desktop.png"), fullPage: true });
  }

  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status() ?? "unknown"}.`);
    if ((await page.locator("h1").count()) === 0) throw new Error(`${route} did not render a page heading.`);
    if (/application error|server error|could not be found/i.test(await page.locator("body").innerText())) throw new Error(`${route} rendered an error state.`);
  }

  await page.goto(`${baseUrl}/content/recipes`, { waitUntil: "networkidle" });
  const firstRecipe = page.locator("table.data-table tbody a").first();
  if (!(await firstRecipe.isVisible())) throw new Error("The recipe CMS did not contain an editable launch draft.");
  await Promise.all([
    page.waitForURL(/\/content\/recipes\/[^/]+$/),
    firstRecipe.click(),
  ]);
  await page.waitForLoadState("networkidle");
  if (!(await page.getByRole("heading", { name: "Ingredients & method" }).isVisible())) {
    throw new Error(`The structured recipe editor did not render at ${page.url()}.`);
  }
  if ((await page.getByRole("option").count()) < 1) {
    throw new Error("The structured recipe editor did not load its ingredient control.");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, "admin-mobile-overview.png"), fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const sidebar = page.getByLabel("Admin navigation");
  await page.waitForTimeout(250);
  if (!(await sidebar.isVisible())) throw new Error("The mobile navigation did not open.");
  const box = await sidebar.boundingBox();
  if (!box || box.x < -1 || box.width < 240) throw new Error("The mobile navigation is outside the viewport.");
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, "admin-mobile-navigation.png"), fullPage: true });

  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
  console.log(`Admin smoke passed: ${routes.length} authenticated routes plus mobile navigation.`);
} finally {
  await browser.close();
  if (temporaryUserId && adminClient) {
    await adminClient.from("staff_members").delete().eq("id", temporaryUserId);
    const { error } = await adminClient.auth.admin.deleteUser(temporaryUserId);
    if (error) console.error(`Could not remove synthetic smoke user: ${error.message}`);
  }
}
