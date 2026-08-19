import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 15_000 },
  use: {
    baseURL: externalBaseUrl || "http://localhost:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } }
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "node apps/storefront/node_modules/next/dist/bin/next dev apps/storefront --turbopack --port 3010",
        // Wait for a real App Router page, not only the dev server socket, so Turbopack has
        // completed route discovery before the first navigation.
        url: "http://localhost:3010/recipes",
        reuseExistingServer: false,
        timeout: 120_000,
        gracefulShutdown: { signal: "SIGTERM", timeout: 1_000 },
        stdout: "ignore",
        stderr: "ignore",
        env: {
          ...process.env,
          PORT: "3010",
          ENABLE_DEVELOPMENT_FALLBACKS: "true",
          COD_ENABLED: "true",
          SSLCOMMERZ_ENABLED: "true"
        }
      }
});
