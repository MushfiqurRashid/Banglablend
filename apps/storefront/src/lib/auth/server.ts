import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@bangla-blend/supabase-client";

// Memoized per request. Every call to createSupabaseServerClient builds a fresh GoTrueClient, and
// auth-js only serializes token refreshes *within* one instance -- so a layout and its pages each
// constructing their own raced to refresh the same rotated token and the server rejected them with
// "Too many concurrent token refresh requests on the same session or refresh token".
export const getSupabaseForRequest = cache(async () => {
  return createSupabaseServerClient(await cookies(), { cookieName: "banglablend-storefront-auth" });
});

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

interface CustomerRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  customer_addresses: Array<{
    id: string;
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string | null;
    city: string;
    province: string | null;
    postal_code: string | null;
    country_code: string;
    phone: string;
    is_default_shipping: boolean;
    is_default_billing: boolean;
  }> | null;
}

// Memoized for the same reason as getSupabaseForRequest: the header, the page, and any server
// action on the same request all resolve the customer.
export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, first_name, last_name, phone, metadata, customer_addresses ( id, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone, is_default_shipping, is_default_billing )")
    .eq("auth_user_id", user.id)
    .returns<CustomerRow[]>()
    .maybeSingle();
  if (!customer) return null;

  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name ?? undefined,
    last_name: customer.last_name ?? undefined,
    phone: customer.phone ?? undefined,
    metadata: (customer.metadata as Record<string, unknown>) ?? undefined,
    addresses: (customer.customer_addresses ?? []).map((address) => ({
      id: address.id,
      first_name: address.first_name,
      last_name: address.last_name,
      address_1: address.address_1,
      address_2: address.address_2 ?? undefined,
      city: address.city,
      province: address.province ?? undefined,
      postal_code: address.postal_code ?? undefined,
      country_code: address.country_code,
      phone: address.phone,
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
    })),
  };
});
