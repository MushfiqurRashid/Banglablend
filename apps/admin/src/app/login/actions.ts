"use server";

import { redirect } from "next/navigation";
import { getSupabaseForRequest } from "@/lib/auth";

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await getSupabaseForRequest();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "The email or password was not accepted." };

  const { data: staff } = await supabase.from("staff_members").select("id, is_active").eq("id", data.user.id).maybeSingle();
  if (!staff || !staff.is_active) {
    await supabase.auth.signOut();
    return { error: "This account does not have admin access." };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await getSupabaseForRequest();
  await supabase.auth.signOut();
  redirect("/login");
}
