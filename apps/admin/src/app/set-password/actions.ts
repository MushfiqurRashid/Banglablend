"use server";

import { redirect } from "next/navigation";
import { getStaffSession, getSupabaseForRequest } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export interface SetPasswordState {
  error?: string;
}

export async function setPasswordAction(_previous: SetPasswordState | undefined, formData: FormData): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 12) return { error: "Use at least 12 characters." };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const session = await getStaffSession();
  if (!session) return { error: "This password link is invalid or has expired. Request a new one." };
  const supabase = await getSupabaseForRequest();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  await recordAudit(supabase, session, {
    action: "staff.password.updated",
    resourceType: "staff_member",
    resourceId: session.id,
    resourceLabel: session.email,
    summary: `${session.email} set a new password.`,
  });
  redirect("/");
}
