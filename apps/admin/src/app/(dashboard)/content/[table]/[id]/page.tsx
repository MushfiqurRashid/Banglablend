import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { getContentType } from "@/lib/content-registry";
import { loadForeignOptions } from "../foreign-options";
import { deleteContentAction } from "../actions";
import { EditContentClient } from "./edit-content-client";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function EditContentPage({ params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const contentType = getContentType(table);
  if (!contentType) notFound();

  const supabase = await getSupabaseForRequest();
  const [{ data: row }, foreignOptions] = await Promise.all([supabase.from(table).select("*").eq("id", id).maybeSingle(), loadForeignOptions(supabase, contentType)]);
  if (!row) notFound();

  const label = String((row as Record<string, unknown>)[contentType.titleColumn] ?? "Untitled");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{label}</h1>
        {canManage ? <form action={deleteContentAction.bind(null, table, id, label)}>
          <ConfirmSubmitButton message={`Delete "${label}"? This content will be removed permanently.`}>
            Delete
          </ConfirmSubmitButton>
        </form> : null}
      </div>
      {!canManage ? <div className="notice">Your role has read-only access to this content.</div> : null}
      <EditContentClient contentType={contentType} id={id} initial={row as Record<string, unknown>} foreignOptions={foreignOptions} readOnly={!canManage} />
    </div>
  );
}
