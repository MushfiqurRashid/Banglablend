"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { productFormSchema, type ProductFormInput } from "@/lib/catalog";

function parseFormInput(formData: FormData): unknown {
  return {
    title: formData.get("title"),
    handle: formData.get("handle"),
    subtitle: formData.get("subtitle") || null,
    description: formData.get("description") || null,
    thumbnailUrl: formData.get("thumbnailUrl") || null,
    thumbnailAlt: formData.get("thumbnailAlt") || null,
    collection: formData.get("collection"),
    giftType: formData.get("giftType") || null,
    region: formData.get("region") || null,
    ingredients: formData.get("ingredients") || null,
    storage: formData.get("storage") || null,
    shelfLife: formData.get("shelfLife") || null,
    usageNotes: formData.get("usageNotes") || null,
    eligibleMarkets: formData.getAll("eligibleMarkets"),
    badges: String(formData.get("badges") ?? "")
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean),
    bestSeller: formData.get("bestSeller") === "on",
    storefrontVisible: formData.get("storefrontVisible") === "on",
    catalogIds: formData.getAll("catalogIds"),
    seoTitle: formData.get("seoTitle") || null,
    seoDescription: formData.get("seoDescription") || null,
    seoImageUrl: formData.get("seoImageUrl") || null,
    variants: (() => {
      try {
        return JSON.parse(String(formData.get("variantsJson") ?? "[]"));
      } catch {
        return null;
      }
    })(),
  };
}

export interface ProductActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function writeProduct(productId: string | null, input: ProductFormInput) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) return { error: "You do not have permission to manage the catalog." };
  const supabase = await getSupabaseForRequest();

  const { data: collection, error: collectionError } = await supabase.from("product_collections").select("id").eq("handle", input.collection).maybeSingle();
  if (collectionError) return { error: collectionError.message };
  if (!collection) return { error: "Unknown collection." };

  const { data: primaryLocation, error: locationError } = await supabase.from("stock_locations").select("id").eq("is_primary", true).maybeSingle();
  if (locationError) return { error: locationError.message };
  if (!primaryLocation) return { error: "Configure a primary stock location before saving products." };

  const catalogIds = [...new Set(input.catalogIds)];
  if (catalogIds.length) {
    const { data: catalogs, error } = await supabase.from("storefront_catalogs").select("id").in("id", catalogIds);
    if (error) return { error: error.message };
    if ((catalogs?.length ?? 0) !== catalogIds.length) return { error: "One or more storefront catalogs no longer exist." };
  }

  const requestedSkus = input.variants.map((variant) => variant.sku.toUpperCase());
  const { data: skuMatches, error: skuError } = await supabase
    .from("product_variants")
    .select("sku, product_id")
    .in("sku", requestedSkus)
    .is("deleted_at", null);
  if (skuError) return { error: skuError.message };
  const conflictingSku = skuMatches?.find((variant) => variant.product_id !== productId);
  if (conflictingSku) return { error: `SKU ${conflictingSku.sku} is already assigned to another product.` };

  // Merge into existing metadata rather than overwriting it, so the SEO tab doesn't clobber other
  // keys that might be set outside this form.
  let existingMetadata: Record<string, unknown> = {};
  let beforeProduct: Record<string, unknown> | null = null;
  if (productId) {
    const { data: existing, error } = await supabase.from("products").select("*").eq("id", productId).is("deleted_at", null).maybeSingle();
    if (error) return { error: error.message };
    if (!existing) return { error: "This product no longer exists." };
    beforeProduct = existing;
    existingMetadata = (existing?.metadata as Record<string, unknown>) ?? {};
  }
  const metadata = {
    ...existingMetadata,
    seo: { title: input.seoTitle, description: input.seoDescription, image: input.seoImageUrl },
  };

  const productRow = {
    title: input.title,
    handle: input.handle,
    subtitle: input.subtitle,
    description: input.description,
    status: input.storefrontVisible ? "published" : "draft",
    thumbnail_url: input.thumbnailUrl,
    thumbnail_alt: input.thumbnailAlt,
    collection_id: collection.id,
    gift_type: input.giftType,
    region: input.region,
    ingredients: input.ingredients,
    storage: input.storage,
    shelf_life: input.shelfLife,
    usage_notes: input.usageNotes,
    eligible_markets: input.eligibleMarkets,
    badges: input.badges,
    best_seller: input.bestSeller,
    is_placeholder: !input.storefrontVisible,
    verified: input.storefrontVisible,
    metadata,
  };

  let id = productId;
  if (id) {
    const { data, error } = await supabase.from("products").update(productRow).eq("id", id).is("deleted_at", null).select("id").maybeSingle();
    if (error || !data) return { error: error?.message ?? "This product could not be updated." };
  } else {
    const { data, error } = await supabase.from("products").insert(productRow).select("id").single();
    if (error || !data) return { error: error?.message ?? "Could not create product." };
    id = data.id;
  }

  const { data: existingVariants, error: variantsReadError } = await supabase
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", id)
    .is("deleted_at", null);
  if (variantsReadError) return { error: variantsReadError.message };
  const variantsBySku = new Map((existingVariants ?? []).map((variant) => [variant.sku.toUpperCase(), variant]));
  const retainedVariantIds: string[] = [];

  for (const [index, variant] of input.variants.entries()) {
    const sku = variant.sku.toUpperCase();
    const existing = variantsBySku.get(sku);
    const variantMutation = existing
      ? supabase
          .from("product_variants")
          .update({ title: variant.title, option_values: { Size: variant.title }, sort_order: index })
          .eq("id", existing.id)
          .select("id")
          .single()
      : supabase
          .from("product_variants")
          .insert({ product_id: id, title: variant.title, sku, option_values: { Size: variant.title }, sort_order: index })
          .select("id")
          .single();
    const { data: variantRow, error: variantError } = await variantMutation;
    if (variantError || !variantRow) return { error: variantError?.message ?? "Could not create variant." };
    retainedVariantIds.push(variantRow.id);

    const { error: priceError } = await supabase
      .from("product_prices")
      .upsert({ variant_id: variantRow.id, currency_code: "bdt", amount: variant.bdtPrice }, { onConflict: "variant_id,currency_code" });
    if (priceError) return { error: priceError.message };
    const { error: inventoryError } = await supabase.from("inventory_levels").upsert(
      { variant_id: variantRow.id, location_id: primaryLocation.id, stocked_quantity: variant.stockQuantity },
      { onConflict: "variant_id,location_id" },
    );
    if (inventoryError) return { error: inventoryError.message };
  }

  const removedVariantIds = (existingVariants ?? []).filter((variant) => !retainedVariantIds.includes(variant.id)).map((variant) => variant.id);
  if (removedVariantIds.length) {
    const { error } = await supabase.from("product_variants").update({ deleted_at: new Date().toISOString() }).in("id", removedVariantIds);
    if (error) return { error: error.message };
  }

  const { data: existingAssignments, error: assignmentReadError } = await supabase
    .from("storefront_catalog_products")
    .select("catalog_id")
    .eq("product_id", id);
  if (assignmentReadError) return { error: assignmentReadError.message };
  const existingCatalogIds = new Set((existingAssignments ?? []).map((assignment) => assignment.catalog_id));
  const assignmentsToAdd = catalogIds.filter((catalogId) => !existingCatalogIds.has(catalogId));
  const assignmentsToRemove = [...existingCatalogIds].filter((catalogId) => !catalogIds.includes(catalogId));
  if (assignmentsToAdd.length) {
    const { error } = await supabase.from("storefront_catalog_products").insert(assignmentsToAdd.map((catalogId) => ({ catalog_id: catalogId, product_id: id })));
    if (error) return { error: error.message };
  }
  if (assignmentsToRemove.length) {
    const { error } = await supabase.from("storefront_catalog_products").delete().eq("product_id", id).in("catalog_id", assignmentsToRemove);
    if (error) return { error: error.message };
  }

  await recordAudit(supabase, session, {
    action: productId ? "catalog.product.updated" : "catalog.product.created",
    resourceType: "product",
    resourceId: id ?? undefined,
    resourceLabel: input.title,
    summary: `${productId ? "Updated" : "Created"} product ${input.title}.`,
    before: beforeProduct,
    after: productRow,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { id };
}

export async function createProductAction(_prevState: ProductActionState | undefined, formData: FormData): Promise<ProductActionState> {
  const parsed = productFormSchema.safeParse(parseFormInput(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  const result = await writeProduct(null, parsed.data);
  if (result.error) return { error: result.error };
  redirect(`/products/${result.id}`);
}

export async function updateProductAction(productId: string, _prevState: ProductActionState | undefined, formData: FormData): Promise<ProductActionState> {
  const parsed = productFormSchema.safeParse(parseFormInput(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  const result = await writeProduct(productId, parsed.data);
  if (result.error) return { error: result.error };
  return {};
}

async function archiveProduct(productId: string, title: string) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) throw new Error("Forbidden");
  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase.from("products").select("*").eq("id", productId).is("deleted_at", null).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!before) throw new Error("This product no longer exists.");
  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "draft", verified: false })
    .eq("id", productId)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "The product could not be archived.");
  await recordAudit(supabase, session, {
    action: "catalog.product.archived",
    resourceType: "product",
    resourceId: productId,
    resourceLabel: title,
    summary: `Archived product ${title}.`,
    before,
    after: { status: "draft", verified: false, archived: true },
  });
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/inventory/update");
  revalidatePath("/reports");
}

// Used from the product edit page, which navigates to a different URL after archiving.
export async function archiveProductAction(productId: string, title: string) {
  await archiveProduct(productId, title);
  redirect("/products");
}

// Used from the products list itself. redirect("/products") while already on /products doesn't
// reliably force a refetch of the (now-stale) list, so this relies on the automatic refresh that
// Next.js performs after a server action completes when it doesn't redirect.
export async function archiveProductFromListAction(productId: string, title: string) {
  await archiveProduct(productId, title);
}

function flattenErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
