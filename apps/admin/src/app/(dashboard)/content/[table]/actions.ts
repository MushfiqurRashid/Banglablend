"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { plainTextToPortableText } from "@/lib/content-format";
import { getContentType, type FieldDef } from "@/lib/content-registry";
import { revalidateStorefrontContent } from "@/lib/storefront-revalidation";

export interface ContentActionState {
  error?: string;
  warning?: string;
}

function coerceField(field: FieldDef, raw: FormDataEntryValue | null): unknown {
  if (field.kind === "boolean") return raw === "on";
  if (raw === null || raw === "") {
    if (field.required) throw new Error(`"${field.label}" is required.`);
    return null;
  }
  const value = String(raw);
  if (field.kind === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`"${field.label}" must be a valid number.`);
    return number;
  }
  if (field.kind === "array")
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  if (field.kind === "richtext") return plainTextToPortableText(value);
  if (field.kind === "json") {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`"${field.label}" must contain valid structured data.`);
    }
  }
  if (field.kind === "foreignKey") return value || null;
  return value;
}

function buildRow(table: string, formData: FormData): Record<string, unknown> {
  const contentType = getContentType(table);
  if (!contentType) throw new Error("Unknown content type.");
  const row: Record<string, unknown> = {};
  for (const field of contentType.fields) {
    try {
      row[field.name] = coerceField(field, formData.get(field.name));
    } catch (error) {
      throw error instanceof Error ? error : new Error("Invalid field value.");
    }
  }
  return row;
}

export async function createContentAction(table: string, _prevState: ContentActionState | undefined, formData: FormData): Promise<ContentActionState> {
  const contentType = getContentType(table);
  if (!contentType) return { error: "Unknown content type." };
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "content", "manage")) return { error: "You do not have permission to manage content." };

  let row: Record<string, unknown>;
  try {
    row = buildRow(table, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid form data." };
  }

  const supabase = await getSupabaseForRequest();
  const { data, error } = await supabase.from(table).insert(row).select("id").single();
  if (error || !data) return { error: error?.message ?? "Could not create the record." };
  const revalidationWarning = await revalidateStorefrontContent();

  await recordAudit(supabase, session, {
    action: "content.created",
    resourceType: table,
    resourceId: data.id,
    resourceLabel: String(row[contentType.titleColumn] ?? ""),
    summary: `Created ${contentType.label} record.${revalidationWarning ? " Storefront cache refresh needs attention." : ""}`,
    after: row,
  });
  revalidatePath(`/content/${table}`);
  redirect(`/content/${table}/${data.id}`);
}

export async function updateContentAction(table: string, id: string, _prevState: ContentActionState | undefined, formData: FormData): Promise<ContentActionState> {
  const contentType = getContentType(table);
  if (!contentType) return { error: "Unknown content type." };
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "content", "manage")) return { error: "You do not have permission to manage content." };

  let row: Record<string, unknown>;
  try {
    row = buildRow(table, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid form data." };
  }

  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (readError) return { error: readError.message };
  if (!before) return { error: "This record no longer exists." };
  const { data: updated, error } = await supabase.from(table).update(row).eq("id", id).select("id").maybeSingle();
  if (error || !updated) return { error: error?.message ?? "The record could not be updated." };
  const revalidationWarning = await revalidateStorefrontContent();

  await recordAudit(supabase, session, {
    action: "content.updated",
    resourceType: table,
    resourceId: id,
    resourceLabel: String(row[contentType.titleColumn] ?? ""),
    summary: `Updated ${contentType.label} record.${revalidationWarning ? " Storefront cache refresh needs attention." : ""}`,
    before,
    after: row,
  });
  revalidatePath(`/content/${table}`);
  revalidatePath(`/content/${table}/${id}`);
  return revalidationWarning ? { warning: revalidationWarning } : {};
}

export async function deleteContentAction(table: string, id: string, label: string) {
  const contentType = getContentType(table);
  if (!contentType) throw new Error("Unknown content type.");
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "content", "manage")) throw new Error("Forbidden");

  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("This record no longer exists.");
  const { data: deleted, error } = await supabase.from(table).delete().eq("id", id).select("id").maybeSingle();
  if (error || !deleted) throw new Error(error?.message ?? "The record could not be deleted.");
  const revalidationWarning = await revalidateStorefrontContent();
  await recordAudit(supabase, session, {
    action: "content.deleted",
    resourceType: table,
    resourceId: id,
    resourceLabel: label,
    summary: `Deleted ${contentType.label} record ${label}.${revalidationWarning ? " Storefront cache refresh needs attention." : ""}`,
    before,
  });
  revalidatePath(`/content/${table}`);
  redirect(`/content/${table}`);
}
