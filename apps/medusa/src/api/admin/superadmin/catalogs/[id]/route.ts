import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  deleteProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";
import { recordAdminAudit } from "../../../../../lib/admin/audit";
import {
  isManagedStorefrontCatalog,
  normalizeStorefrontCatalog,
  storefrontCatalogMetadata,
  updateStorefrontCatalogSchema,
  type StorefrontCatalogCategory,
  type StorefrontCatalogExperience,
} from "../../../../../lib/admin/storefront-catalog";

const catalogIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9_-]+$/);

async function retrieveCatalog(req: AuthenticatedMedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "name",
      "handle",
      "description",
      "is_active",
      "is_internal",
      "parent_category_id",
      "parent_category.id",
      "parent_category.name",
      "parent_category.handle",
      "metadata",
      "products.id",
    ],
    filters: { id },
  });
  return data[0] as StorefrontCatalogCategory | undefined;
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = catalogIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid catalog ID." });

  const parsed = updateStorefrontCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Review the storefront catalog update.",
      errors: parsed.error.flatten(),
    });
  }

  const before = await retrieveCatalog(req, parsedId.data);
  if (!before || !isManagedStorefrontCatalog(before)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Storefront catalog not found.");
  }

  const current = normalizeStorefrontCatalog(before);
  const experience = (parsed.data.experience ?? current.experience) as StorefrontCatalogExperience;
  const boxSize =
    experience === "build_a_box"
      ? parsed.data.box_size === undefined
        ? (current.box_size ?? 3)
        : (parsed.data.box_size ?? 3)
      : null;

  const { result } = await updateProductCategoriesWorkflow(req.scope).run({
    input: {
      selector: { id: before.id },
      update: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description ?? "" }
          : {}),
        ...(parsed.data.is_active !== undefined ? { is_active: parsed.data.is_active } : {}),
        metadata: {
          ...(before.metadata ?? {}),
          ...storefrontCatalogMetadata({ experience, box_size: boxSize }),
        },
      },
    },
  });
  if (!result[0]) throw new Error("Medusa did not return the updated storefront catalog.");

  const after = await retrieveCatalog(req, before.id);
  if (!after) throw new Error("The storefront catalog was updated but could not be reloaded.");

  await recordAdminAudit(req, {
    action: "catalog.category.updated",
    resourceType: "product_category",
    resourceId: before.id,
    resourceLabel: after.name,
    summary: `Updated storefront catalog ${after.name}.`,
    before: normalizeStorefrontCatalog(before),
    after: normalizeStorefrontCatalog(after),
  });

  return res.json({ catalog: normalizeStorefrontCatalog(after) });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = catalogIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid catalog ID." });

  const before = await retrieveCatalog(req, parsedId.data);
  if (!before || !isManagedStorefrontCatalog(before)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Storefront catalog not found.");
  }

  const snapshot = normalizeStorefrontCatalog(before);
  await deleteProductCategoriesWorkflow(req.scope).run({ input: [before.id] });

  await recordAdminAudit(req, {
    action: "catalog.category.deleted",
    resourceType: "product_category",
    resourceId: before.id,
    resourceLabel: before.name,
    summary: `Deleted storefront catalog ${before.name} and removed ${snapshot.product_count} product assignment${snapshot.product_count === 1 ? "" : "s"}.`,
    before: snapshot,
  });

  return res.json({
    id: before.id,
    object: "product_category",
    deleted: true,
    detached_product_count: snapshot.product_count,
  });
}
