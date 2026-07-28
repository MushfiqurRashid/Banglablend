import { expect } from "vitest";

export const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
export const medusaUrl = process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9000";
export const storefrontUrl = process.env.STOREFRONT_URL || "http://127.0.0.1:3000";
export const publishableKey =
  process.env.MEDUSA_PUBLISHABLE_API_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function storeFetch(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, medusaUrl), {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": publishableKey,
      ...init?.headers,
    },
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
