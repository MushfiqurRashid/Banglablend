import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@bangla-blend/validation";
import { getSupabaseForRequest } from "@/lib/auth/server";

const idSchema = z.uuid();
const mutationSchema = addressSchema.extend({ isDefaultShipping: z.boolean().optional(), isDefaultBilling: z.boolean().optional() });

function toRow(address: z.infer<typeof mutationSchema>) {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    address_1: address.address1,
    address_2: address.address2 || null,
    city: address.city,
    province: address.province || null,
    postal_code: address.postalCode || null,
    country_code: address.countryCode.toLowerCase(),
    phone: address.phone,
    is_default_shipping: address.isDefaultShipping ?? false,
    is_default_billing: address.isDefaultBilling ?? false,
  };
}

async function requireCustomer() {
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  return customer ? { supabase, customerId: customer.id } : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const idParsed = idSchema.safeParse((await context.params).id);
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!idParsed.success || !parsed.success) return NextResponse.json({ error: "Please check the address details." }, { status: 400 });

  const auth = await requireCustomer();
  if (!auth) return NextResponse.json({ error: "Sign in again to update this address." }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("customer_addresses")
    .update(toRow(parsed.data))
    .eq("id", idParsed.data)
    .eq("customer_id", auth.customerId)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ error: "The address could not be updated." }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const idParsed = idSchema.safeParse((await context.params).id);
  if (!idParsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

  const auth = await requireCustomer();
  if (!auth) return NextResponse.json({ error: "Sign in again to remove this address." }, { status: 401 });

  const { error } = await auth.supabase.from("customer_addresses").delete().eq("id", idParsed.data).eq("customer_id", auth.customerId);
  if (error) return NextResponse.json({ error: "The address could not be removed." }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
