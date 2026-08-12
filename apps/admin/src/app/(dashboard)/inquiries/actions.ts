"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const statuses = ["new", "acknowledged", "in_progress", "closed"] as const;

export async function updateInquiryAction(inquiryId: string, formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "inquiries", "manage")) throw new Error("You do not have permission to manage inquiries.");
  const supabase = await getSupabaseForRequest();

  const status = String(formData.get("status") ?? "");
  const internalNotes = String(formData.get("internalNotes") ?? "");
  if (!statuses.includes(status as (typeof statuses)[number])) throw new Error("Invalid status.");
  if (internalNotes.length > 10000) throw new Error("Internal notes must be 10,000 characters or fewer.");

  const { data: before, error: readError } = await supabase.from("inquiries").select("status, internal_notes, assigned_staff_id").eq("id", inquiryId).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("This inquiry no longer exists.");
  const after = { status, internal_notes: internalNotes || null, assigned_staff_id: session.id };
  const { data: updated, error } = await supabase.from("inquiries").update(after).eq("id", inquiryId).select("id").maybeSingle();
  if (error || !updated) throw new Error(error?.message ?? "The inquiry could not be updated.");

  await recordAudit(supabase, session, {
    action: "inquiry.updated",
    resourceType: "inquiry",
    resourceId: inquiryId,
    summary: `Inquiry marked ${status}.`,
    before,
    after,
  });
  revalidatePath("/inquiries");
  revalidatePath(`/inquiries/${inquiryId}`);
}
