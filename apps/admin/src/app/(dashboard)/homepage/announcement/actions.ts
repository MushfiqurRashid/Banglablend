"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { revalidateStorefrontContent } from "@/lib/storefront-revalidation";
import { TOP_ANNOUNCEMENT_TITLE } from "@/lib/top-announcement";

export interface AnnouncementTextState {
  error?: string;
  success?: string;
  warning?: string;
}

export async function saveAnnouncementTextAction(
  _previousState: AnnouncementTextState | undefined,
  formData: FormData,
): Promise<AnnouncementTextState> {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "content", "manage")) {
    return { error: "You do not have permission to edit storefront content." };
  }

  const message = String(formData.get("message") ?? "").trim().replace(/\s+/g, " ");
  if (message.length < 3) return { error: "Enter the announcement text." };
  if (message.length > 180) return { error: "Keep the announcement text within 180 characters." };

  const supabase = await getSupabaseForRequest();
  const { data: existing, error: readError } = await supabase
    .from("announcements")
    .select("*")
    .eq("title", TOP_ANNOUNCEMENT_TITLE)
    .eq("language", "en")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const row = {
    title: TOP_ANNOUNCEMENT_TITLE,
    language: "en",
    message,
    link: null,
    market: "all",
    starts_at: null,
    ends_at: null,
    active: true,
  };
  const write = existing
    ? supabase.from("announcements").update(row).eq("id", existing.id).select("id").maybeSingle()
    : supabase.from("announcements").insert(row).select("id").single();
  const { data: saved, error: writeError } = await write;
  if (writeError || !saved) return { error: writeError?.message ?? "The announcement text could not be saved." };

  const { error: deactivateError } = await supabase
    .from("announcements")
    .update({ active: false })
    .eq("language", "en")
    .eq("active", true)
    .neq("id", saved.id);
  if (deactivateError) return { error: deactivateError.message };

  const revalidationWarning = await revalidateStorefrontContent();
  await recordAudit(supabase, session, {
    action: existing ? "content.announcement_text_updated" : "content.announcement_text_created",
    resourceType: "announcement",
    resourceId: saved.id,
    resourceLabel: TOP_ANNOUNCEMENT_TITLE,
    summary: `${existing ? "Updated" : "Created"} the top storefront announcement text.`,
    before: existing,
    after: row,
  });
  revalidatePath("/homepage");
  revalidatePath("/homepage/announcement");
  revalidatePath("/content/announcements");

  return {
    success: "Announcement text saved.",
    ...(revalidationWarning ? { warning: `${revalidationWarning} The storefront may take up to two minutes to refresh.` } : {}),
  };
}
