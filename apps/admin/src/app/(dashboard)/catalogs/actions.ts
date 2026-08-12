"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const sections = ["originals", "reserve", "pantry", "tea-wellness", "lifestyle-accessories", "gifts"] as const;
const reservedGiftHandles = new Set(["gift-sets", "regional-gifts", "corporate", "all", "regional", "occasion"]);

const catalogSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    handle: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(1000).nullable(),
    navigationImageUrl: z.string().trim().max(2000).nullable(),
    navigationImageAlt: z.string().trim().max(300).nullable(),
    heroImageUrl: z.string().trim().max(2000).nullable(),
    heroImageAlt: z.string().trim().max(300).nullable(),
    section: z.enum(sections),
    experience: z.enum(["listing", "build_a_box"]),
    boxSize: z.coerce.number().int().min(2).max(12).nullable(),
    isActive: z.boolean(),
  })
  .superRefine((input, ctx) => {
    if (input.experience === "build_a_box" && input.boxSize === null) {
      ctx.addIssue({ code: "custom", path: ["boxSize"], message: "Choose how many products complete a box." });
    }
    if (input.section === "gifts" && reservedGiftHandles.has(input.handle)) {
      ctx.addIssue({ code: "custom", path: ["handle"], message: "That URL is reserved by a fixed Gift category. Choose a different handle." });
    }
  });

export interface CatalogActionState {
  error?: string;
}

function parse(formData: FormData) {
  return catalogSchema.safeParse({
    name: formData.get("name"),
    handle: formData.get("handle"),
    description: formData.get("description") || null,
    navigationImageUrl: formData.get("navigationImageUrl") || null,
    navigationImageAlt: formData.get("navigationImageAlt") || null,
    heroImageUrl: formData.get("heroImageUrl") || null,
    heroImageAlt: formData.get("heroImageAlt") || null,
    section: formData.get("section"),
    experience: formData.get("experience"),
    boxSize: formData.get("experience") === "build_a_box" ? formData.get("boxSize") || null : null,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createCatalogAction(_prevState: CatalogActionState | undefined, formData: FormData): Promise<CatalogActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) return { error: "You do not have permission to manage catalogs." };
  const supabase = await getSupabaseForRequest();

  const { data, error } = await supabase
    .from("storefront_catalogs")
    .insert({
      name: parsed.data.name,
      handle: parsed.data.handle,
      description: parsed.data.description,
      navigation_image_url: parsed.data.navigationImageUrl,
      navigation_image_alt: parsed.data.navigationImageAlt,
      hero_image_url: parsed.data.heroImageUrl,
      hero_image_alt: parsed.data.heroImageAlt,
      section: parsed.data.section,
      experience: parsed.data.experience,
      box_size: parsed.data.boxSize,
      is_active: parsed.data.isActive,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create catalog." };

  await recordAudit(supabase, session, {
    action: "catalog.category.created",
    resourceType: "storefront_catalog",
    resourceId: data.id,
    resourceLabel: parsed.data.name,
    summary: `Created storefront catalog ${parsed.data.name} under ${parsed.data.section}.`,
  });
  revalidatePath("/catalogs");
  redirect("/catalogs");
}

export async function updateCatalogAction(catalogId: string, _prevState: CatalogActionState | undefined, formData: FormData): Promise<CatalogActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) return { error: "You do not have permission to manage catalogs." };
  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase.from("storefront_catalogs").select("*").eq("id", catalogId).maybeSingle();
  if (readError) return { error: readError.message };
  if (!before) return { error: "This catalog no longer exists." };

  const { data: updated, error } = await supabase
    .from("storefront_catalogs")
    .update({
      name: parsed.data.name,
      handle: parsed.data.handle,
      description: parsed.data.description,
      navigation_image_url: parsed.data.navigationImageUrl,
      navigation_image_alt: parsed.data.navigationImageAlt,
      hero_image_url: parsed.data.heroImageUrl,
      hero_image_alt: parsed.data.heroImageAlt,
      section: parsed.data.section,
      experience: parsed.data.experience,
      box_size: parsed.data.boxSize,
      is_active: parsed.data.isActive,
    })
    .eq("id", catalogId)
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: error?.message ?? "The catalog could not be updated." };

  await recordAudit(supabase, session, {
    action: "catalog.category.updated",
    resourceType: "storefront_catalog",
    resourceId: catalogId,
    resourceLabel: parsed.data.name,
    summary: `Updated storefront catalog ${parsed.data.name}.`,
    before,
    after: parsed.data,
  });
  revalidatePath("/catalogs");
  revalidatePath(`/catalogs/${catalogId}`);
  return {};
}

export async function addProductToCatalogAction(catalogId: string, formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) throw new Error("Forbidden");
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  const supabase = await getSupabaseForRequest();
  const [{ data: catalog, error: catalogError }, { data: product, error: productError }] = await Promise.all([
    supabase.from("storefront_catalogs").select("name").eq("id", catalogId).maybeSingle(),
    supabase.from("products").select("title").eq("id", productId).is("deleted_at", null).maybeSingle(),
  ]);
  if (catalogError || productError) throw new Error((catalogError ?? productError)?.message);
  if (!catalog || !product) throw new Error("The catalog or product no longer exists.");
  const { error } = await supabase.from("storefront_catalog_products").upsert({ catalog_id: catalogId, product_id: productId });
  if (error) throw new Error(error.message);
  await recordAudit(supabase, session, {
    action: "catalog.product.assigned",
    resourceType: "storefront_catalog",
    resourceId: catalogId,
    resourceLabel: catalog.name,
    summary: `Added ${product.title} to ${catalog.name}.`,
    after: { product_id: productId },
  });
  revalidatePath(`/catalogs/${catalogId}`);
}

export async function removeProductFromCatalogAction(catalogId: string, productId: string) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) throw new Error("Forbidden");
  const supabase = await getSupabaseForRequest();
  const [{ data: catalog }, { data: product }] = await Promise.all([
    supabase.from("storefront_catalogs").select("name").eq("id", catalogId).maybeSingle(),
    supabase.from("products").select("title").eq("id", productId).maybeSingle(),
  ]);
  const { error } = await supabase.from("storefront_catalog_products").delete().eq("catalog_id", catalogId).eq("product_id", productId);
  if (error) throw new Error(error.message);
  await recordAudit(supabase, session, {
    action: "catalog.product.removed",
    resourceType: "storefront_catalog",
    resourceId: catalogId,
    resourceLabel: catalog?.name,
    summary: `Removed ${product?.title ?? "a product"} from ${catalog?.name ?? "a storefront catalog"}.`,
    before: { product_id: productId },
  });
  revalidatePath(`/catalogs/${catalogId}`);
}

export async function deleteCatalogAction(catalogId: string) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) throw new Error("Forbidden");
  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase
    .from("storefront_catalogs")
    .select("*, storefront_catalog_products(product_id)")
    .eq("id", catalogId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("This catalog no longer exists.");
  const { error } = await supabase.from("storefront_catalogs").delete().eq("id", catalogId);
  if (error) throw new Error(error.message);
  await recordAudit(supabase, session, {
    action: "catalog.category.deleted",
    resourceType: "storefront_catalog",
    resourceId: catalogId,
    resourceLabel: before.name,
    summary: `Deleted storefront category ${before.name} and its product assignments.`,
    before,
  });
  revalidatePath("/catalogs");
  redirect("/catalogs");
}
