import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@bangla-blend/validation";
import { getSupabaseForRequest } from "@/lib/auth/server";

const mutationSchema = addressSchema.extend({ isDefaultShipping: z.boolean().optional(), isDefaultBilling: z.boolean().optional() });

function toRow(address: z.infer<typeof mutationSchema>, customerId: string) {
  return {
    customer_id: customerId,
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

export async function POST(request: Request) {
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check every required address field." }, { status: 400 });

  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again to save an address." }, { status: 401 });
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) return NextResponse.json({ error: "Sign in again to save an address." }, { status: 401 });

  const { data, error } = await supabase.from("customer_addresses").insert(toRow(parsed.data, customer.id)).select("*").single();
  if (error || !data) return NextResponse.json({ error: "The address could not be saved." }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
