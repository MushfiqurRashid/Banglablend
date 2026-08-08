import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { recordAdminAudit } from "../../../../lib/admin/audit";
import {
  createStorefrontCatalogSchema,
  isManagedStorefrontCatalog,
  normalizeStorefrontCatalog,
  storefrontCatalogMetadata,
  type StorefrontCatalogCategory,
} from "../../../../lib/admin/storefront-catalog";

const catalogFields = [
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
];

async function listCategoryRecords(req: AuthenticatedMedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "product_category", fields: catalogFields });
  return data as StorefrontCatalogCategory[];
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const categories = await listCategoryRecords(req);
  const catalogs = categories
    .filter(isManagedStorefrontCatalog)
    .map(normalizeStorefrontCatalog)
    .sort(
      (left, right) =>
        left.section.localeCompare(right.section) || left.name.localeCompare(right.name),
    );

  return res.json({ catalogs, count: catalogs.length });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = createStorefrontCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Review the storefront catalog details.",
      errors: parsed.error.flatten(),
    });
  }

  const input = parsed.data;
  const categories = await listCategoryRecords(req);
  if (categories.some((category) => category.handle === input.handle)) {
    return res.status(409).json({
      message: `The catalog handle “${input.handle}” is already in use.`,
    });
  }

  let parent = categories.find(
    (category) => category.handle === input.section && !category.parent_category_id,
  );

  if (!parent) {
    const { result } = await createProductCategoriesWorkflow(req.scope).run({
      input: {
        product_categories: [
          {
            name: input.section
              .split("-")
              .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
              .join(" "),
            handle: input.section,
            is_active: true,
            is_internal: false,
            metadata: { storefront_section: true },
          },
        ],
      },
    });
    parent = result[0] as StorefrontCatalogCategory | undefined;
  }

  if (!parent?.id) {
    return res
      .status(409)
      .json({ message: "The parent storefront section could not be prepared." });
  }

  const { result } = await createProductCategoriesWorkflow(req.scope).run({
    input: {
      product_categories: [
        {
          name: input.name,
          handle: input.handle,
          description: input.description ?? undefined,
          parent_category_id: parent.id,
          is_active: true,
          is_internal: false,
          metadata: storefrontCatalogMetadata(input),
        },
      ],
    },
  });
  const created = result[0];
  if (!created) throw new Error("Medusa did not return the created storefront catalog.");

  const refreshed = (await listCategoryRecords(req)).find((category) => category.id === created.id);
  if (!refreshed) throw new Error("The storefront catalog was created but could not be reloaded.");

  await recordAdminAudit(req, {
    action: "catalog.category.created",
    resourceType: "product_category",
    resourceId: created.id,
    resourceLabel: input.name,
    summary: `Created ${input.name} under ${input.section} as a ${input.experience.replaceAll("_", " ")} catalog.`,
    after: input,
  });

  return res.status(201).json({ catalog: normalizeStorefrontCatalog(refreshed) });
}
