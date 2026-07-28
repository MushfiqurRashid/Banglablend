import { NextResponse } from "next/server";
import { z } from "zod";
import { customerStoreRequest } from "@/lib/auth/server";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal(""))
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your name and telephone number." }, { status: 400 });
  const upstream = await customerStoreRequest("/store/customers/me?fields=*addresses", {
    method: "POST",
    body: JSON.stringify({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone || null })
  });
  if (!upstream) return NextResponse.json({ error: "Sign in again to update your profile." }, { status: 401 });
  if (!upstream.ok) return NextResponse.json({ error: "Your profile could not be updated." }, { status: upstream.status >= 500 ? 502 : 400 });
  return NextResponse.json(upstream.data);
}
