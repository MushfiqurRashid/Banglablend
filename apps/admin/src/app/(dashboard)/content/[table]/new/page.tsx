import { notFound } from "next/navigation";
import { getSupabaseForRequest, requireStaffPermission } from "@/lib/auth";
import { getContentType } from "@/lib/content-registry";
import { loadForeignOptions } from "../foreign-options";
import { NewContentClient } from "./new-content-client";

export default async function NewContentPage({ params }: { params: Promise<{ table: string }> }) {
  await requireStaffPermission("content", "manage");
  const { table } = await params;
  const contentType = getContentType(table);
  if (!contentType) notFound();

  const supabase = await getSupabaseForRequest();
  const foreignOptions = await loadForeignOptions(supabase, contentType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>New {contentType.label.replace(/s$/, "")}</h1>
      <NewContentClient contentType={contentType} foreignOptions={foreignOptions} />
    </div>
  );
}
