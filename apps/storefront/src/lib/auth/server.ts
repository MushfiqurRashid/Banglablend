import "server-only";
import { cookies } from "next/headers";

export const CUSTOMER_TOKEN_COOKIE = "bb_customer_token";

export interface CustomerAddress {
  id: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface CustomerSession {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  addresses?: CustomerAddress[];
}

export async function customerStoreRequest<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | null } | null> {
  if (!path.startsWith("/store/")) throw new Error("Customer Store API paths must remain inside /store/.");
  const token = (await cookies()).get(CUSTOMER_TOKEN_COOKIE)?.value;
  const backend = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.MEDUSA_PUBLISHABLE_API_KEY;
  if (!token || !backend || !publishableKey) return null;
  const target = new URL(path, backend);
  const backendOrigin = new URL(backend).origin;
  if (target.origin !== backendOrigin || !target.pathname.startsWith("/store/")) throw new Error("Customer Store API target was rejected.");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("x-publishable-api-key", publishableKey);
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(target, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null) as T | null;
  return { ok: response.ok, status: response.status, data };
}

export async function customerStoreFetch<T>(path: string): Promise<T | null> {
  const response = await customerStoreRequest<T>(path);
  return response?.ok ? response.data : null;
}

export async function getCustomerSession() {
  const payload = await customerStoreFetch<{ customer: CustomerSession }>("/store/customers/me?fields=*addresses");
  return payload?.customer ?? null;
}
