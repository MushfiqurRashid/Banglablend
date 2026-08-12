"use server";

import { getSupabaseForRequest } from "@/lib/auth";
import { adminAuthCallbackUrl } from "@/lib/auth-callback-url";

export interface ForgotPasswordState {
  success?: string;
  error?: string;
}

export async function forgotPasswordAction(_previous: ForgotPasswordState | undefined, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid work email." };

  const supabase = await getSupabaseForRequest();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: adminAuthCallbackUrl("/set-password"),
  });
  return { success: "If that email belongs to an active staff account, a reset link is on its way." };
}
