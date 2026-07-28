import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@bangla-blend/validation";
import { customerStoreRequest } from "@/lib/auth/server";

const mutationSchema = addressSchema.extend({ isDefaultShipping: z.boolean().optional(), isDefaultBilling: z.boolean().optional() });

function toMedusaAddress(address: z.infer<typeof mutationSchema>) {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    address_1: address.address1,
    address_2: address.address2 || undefined,
    city: address.city,
    province: address.province || undefined,
    postal_code: address.postalCode || undefined,
    country_code: address.countryCode.toLowerCase(),
    phone: address.phone,
    is_default_shipping: address.isDefaultShipping,
    is_default_billing: address.isDefaultBilling
  };
}

export async function POST(request: Request) {
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check every required address field." }, { status: 400 });

  const upstream = await customerStoreRequest("/store/customers/me/addresses", {
    method: "POST",
    body: JSON.stringify(toMedusaAddress(parsed.data))
  });
  if (!upstream) return NextResponse.json({ error: "Sign in again to save an address." }, { status: 401 });
  if (!upstream.ok) return NextResponse.json({ error: "The address could not be saved." }, { status: upstream.status >= 500 ? 502 : 400 });
  return NextResponse.json(upstream.data, { status: 201 });
}
