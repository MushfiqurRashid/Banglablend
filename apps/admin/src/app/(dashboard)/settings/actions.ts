"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

function parseValue(valueType: string, raw: string) {
  if (valueType === "number") {
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error("Enter a valid number.");
    return value;
  }
  if (valueType === "boolean") return raw === "true";
  if (valueType === "json") return JSON.parse(raw);
  return raw;
}

export async function updateSettingAction(settingId: string, formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "settings", "manage")) throw new Error("You do not have permission to manage settings.");
  const supabase = await getSupabaseForRequest();

  const raw = String(formData.get("value") ?? "");
  const { data: before, error: readError } = await supabase
    .from("app_settings")
    .select("key, label, value, value_type, is_public, is_secret")
    .eq("id", settingId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("This setting no longer exists.");
  const valueType = before.value_type;
  const isPublic = before.is_secret ? false : formData.get("isPublic") === "on";
  let value: unknown;
  try {
    value = { data: parseValue(valueType, raw) };
  } catch {
    throw new Error("That value is not valid JSON.");
  }

  const { data: updated, error } = await supabase
    .from("app_settings")
    .update({ value, is_public: isPublic, updated_by: session.id })
    .eq("id", settingId)
    .select("id")
    .maybeSingle();
  if (error || !updated) throw new Error(error?.message ?? "The setting could not be updated.");

  await recordAudit(supabase, session, {
    action: "settings.updated",
    resourceType: "app_setting",
    resourceId: settingId,
    resourceLabel: before.label,
    summary: `Updated ${before.label}.`,
    before: { value: before.value, is_public: before.is_public },
    after: { value, is_public: isPublic },
  });
  revalidatePath("/settings");
}

function optionalField(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

export async function updateInvoiceBusinessDetailsAction(formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "settings", "manage")) throw new Error("You do not have permission to manage settings.");
  const supabase = await getSupabaseForRequest();

  const brandName = String(formData.get("brandName") ?? "").trim();
  if (!brandName) throw new Error("Business name is required.");
  const supportEmail = optionalField(formData, "supportEmail");
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) throw new Error("Enter a valid business email address.");
  const countryCode = optionalField(formData, "countryCode")?.toUpperCase() ?? null;
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new Error("Country code must contain two letters, such as BD.");

  const address = {
    line1: optionalField(formData, "line1"),
    line2: optionalField(formData, "line2"),
    city: optionalField(formData, "city"),
    districtOrState: optionalField(formData, "districtOrState"),
    postalCode: optionalField(formData, "postalCode"),
    countryCode,
  };
  const storedAddress = Object.values(address).some(Boolean) ? address : null;
  const { data: before, error: readError } = await supabase
    .from("site_settings")
    .select("id, brand_name, support_email, support_phone, address")
    .eq("is_singleton", true)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("Site settings could not be found.");

  const after = {
    brand_name: brandName,
    support_email: supportEmail,
    support_phone: optionalField(formData, "supportPhone"),
    address: storedAddress,
  };
  const { error } = await supabase.from("site_settings").update(after).eq("id", before.id);
  if (error) throw new Error(error.message);

  await recordAudit(supabase, session, {
    action: "settings.invoice_business_details_updated",
    resourceType: "site_settings",
    resourceId: before.id,
    resourceLabel: brandName,
    summary: "Updated invoice business details.",
    before,
    after,
  });
  revalidatePath("/settings");
}
