import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/auth/server";

export async function POST() {
  const supabase = await getSupabaseForRequest();
  await supabase.auth.signOut();
  return NextResponse.json({ authenticated: false });
}
