import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your name and telephone number." }, { status: 400 });
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again to update your profile." }, { status: 401 });

  const { data, error } = await supabase
    .from("customers")
    .update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone || null })
    .eq("auth_user_id", user.id)
    .select("id, email, first_name, last_name, phone")
    .single();
  if (error || !data) return NextResponse.json({ error: "Your profile could not be updated." }, { status: 400 });
  return NextResponse.json(data);
}
