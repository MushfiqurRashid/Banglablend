import { getStaffSession, getSupabaseForRequest, hasPermission, requireStaffPermission } from "@/lib/auth";
import { DEFAULT_TOP_ANNOUNCEMENT_TEXT, TOP_ANNOUNCEMENT_TITLE } from "@/lib/top-announcement";
import { AnnouncementTextForm } from "./announcement-text-form";

export default async function AnnouncementTextPage() {
  await requireStaffPermission("content", "view");
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const supabase = await getSupabaseForRequest();
  const [{ data: managedAnnouncement }, { data: currentAnnouncement }] = await Promise.all([
    supabase
      .from("announcements")
      .select("message")
      .eq("title", TOP_ANNOUNCEMENT_TITLE)
      .eq("language", "en")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("message")
      .eq("language", "en")
      .eq("active", true)
      .in("market", ["all", "bd"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const initialText = managedAnnouncement?.message ?? currentAnnouncement?.message ?? DEFAULT_TOP_ANNOUNCEMENT_TEXT;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Top announcement text</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
          Edit only the sentence shown above the storefront header.
        </p>
      </div>
      <AnnouncementTextForm initialText={initialText} readOnly={!canManage} />
    </div>
  );
}
