import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@bangla-blend/validation";
import { customerStoreRequest } from "@/lib/auth/server";

const idSchema = z.string().min(3).max(100).regex(/^[A-Za-z0-9_-]+$/);
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

async function addressPath(context: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? `/store/customers/me/addresses/${parsed.data}` : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const path = await addressPath(context);
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!path || !parsed.success) return NextResponse.json({ error: "Please check the address details." }, { status: 400 });
  const upstream = await customerStoreRequest(path, { method: "POST", body: JSON.stringify(toMedusaAddress(parsed.data)) });
  if (!upstream) return NextResponse.json({ error: "Sign in again to update this address." }, { status: 401 });
  if (!upstream.ok) return NextResponse.json({ error: "The address could not be updated." }, { status: upstream.status >= 500 ? 502 : 400 });
  return NextResponse.json(upstream.data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const path = await addressPath(context);
  if (!path) return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  const upstream = await customerStoreRequest(path, { method: "DELETE" });
  if (!upstream) return NextResponse.json({ error: "Sign in again to remove this address." }, { status: 401 });
  if (!upstream.ok) return NextResponse.json({ error: "The address could not be removed." }, { status: upstream.status >= 500 ? 502 : 400 });
  return NextResponse.json({ deleted: true });
}
