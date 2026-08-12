"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { adminAuthCallbackUrl } from "@/lib/auth-callback-url";
import { recordAudit } from "@/lib/audit";

export interface StaffActionState {
  error?: string;
  success?: string;
}

export async function inviteStaffAction(_prevState: StaffActionState | undefined, formData: FormData): Promise<StaffActionState> {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "staff", "manage")) return { error: "You do not have permission to manage staff." };

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roleId) return { error: "Enter a valid work email and choose a role." };

  const supabase = await getSupabaseForRequest();
  const { data: role, error: roleError } = await supabase.from("staff_roles").select("id, name").eq("id", roleId).maybeSingle();
  if (roleError) return { error: roleError.message };
  if (!role) return { error: "That staff role no longer exists." };

  // Creating the Supabase Auth identity requires the Admin API (service role) -- this is the one
  // admin-app write that can't go through the RLS-scoped client, since a not-yet-existing user
  // can't be "the signed-in user" for any policy to authorize against.
  const admin = createSupabaseServiceRoleClient();
  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || undefined },
    redirectTo: adminAuthCallbackUrl("/set-password"),
  });
  if (createError || !created.user) return { error: createError?.message ?? "Could not create the account." };

  const { error: insertError } = await supabase.from("staff_members").insert({ id: created.user.id, email, full_name: fullName || null, role_id: roleId });
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: insertError.message };
  }

  await recordAudit(supabase, session, {
    action: "staff.invited",
    resourceType: "staff_member",
    resourceId: created.user.id,
    resourceLabel: email,
    summary: `Invited ${email} as ${role.name}.`,
    after: { email, full_name: fullName || null, role_id: roleId, role_name: role.name },
  });
  revalidatePath("/staff");
  return { success: `Invitation sent to ${email}.` };
}

export async function updateStaffRoleAction(staffId: string, formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "staff", "manage")) throw new Error("Forbidden");
  const supabase = await getSupabaseForRequest();
  const roleId = String(formData.get("roleId") ?? "");
  const isActive = formData.get("isActive") === "on";
  if (staffId === session.id && !isActive) throw new Error("You cannot disable your own account.");

  const [{ data: target, error: targetError }, { data: newRole, error: roleError }] = await Promise.all([
    supabase.from("staff_members").select("id, email, full_name, role_id, is_active, role:staff_roles ( key, name )").eq("id", staffId).maybeSingle(),
    supabase.from("staff_roles").select("id, key, name").eq("id", roleId).maybeSingle(),
  ]);
  if (targetError || roleError) throw new Error((targetError ?? roleError)?.message);
  if (!target || !newRole) throw new Error("That staff member or role no longer exists.");
  const currentRole = Array.isArray(target.role) ? target.role[0] : target.role;

  if (currentRole?.key === "super_admin" && (!isActive || newRole.key !== "super_admin")) {
    const { data: superAdmins, error } = await supabase
      .from("staff_members")
      .select("id, role:staff_roles!inner(key)")
      .eq("is_active", true)
      .eq("staff_roles.key", "super_admin");
    if (error) throw new Error(error.message);
    if ((superAdmins?.length ?? 0) <= 1) throw new Error("Keep at least one active Super Admin account.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("staff_members")
    .update({ role_id: roleId, is_active: isActive })
    .eq("id", staffId)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) throw new Error(updateError?.message ?? "The staff account could not be updated.");
  await recordAudit(supabase, session, {
    action: "staff.updated",
    resourceType: "staff_member",
    resourceId: staffId,
    resourceLabel: target.email,
    summary: `Updated ${target.email} to ${newRole.name} (${isActive ? "active" : "disabled"}).`,
    before: { role_id: target.role_id, role_name: currentRole?.name, is_active: target.is_active },
    after: { role_id: newRole.id, role_name: newRole.name, is_active: isActive },
  });
  revalidatePath("/staff");
}
