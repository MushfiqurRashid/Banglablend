import { createClient } from "@sanity/client";
import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Meilisearch } from "meilisearch";

const synonyms = {
  mezban: ["mezbani", "মেজবান"],
  chattogram: ["chittagong", "চট্টগ্রাম"],
  hathazari: ["hathajari", "হাটহাজারী"],
  "shorisha ilish": ["mustard hilsa", "সরিষা ইলিশ"],
};

type SanitySearchRecord = {
  _id: string;
  _type: "recipe" | "journalArticle" | "region";
  title: string;
  slug: string;
  summary?: string;
  language?: "en" | "bn";
};

export default async function indexSearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_ADMIN_KEY;
  if (!host || !apiKey) throw new Error("MEILISEARCH_HOST and MEILISEARCH_ADMIN_KEY are required.");

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "collection.handle",
      "categories.name",
      "categories.handle",
      "categories.parent_category.handle",
      "categories.metadata",
      "metadata",
    ],
    filters: { status: "published" },
  });
  const verifiedProducts = products.filter(
    (product) => product.metadata?.verified === true && product.metadata?.is_placeholder !== true,
  );
  const productDocuments = verifiedProducts.map((product) => {
    const catalogs = (product.categories ?? []).filter(
      (category: { name: string; handle: string; parent_category?: { handle?: string } }) =>
        [
          "originals",
          "reserve",
          "pantry",
          "tea-wellness",
          "lifestyle-accessories",
          "gifts",
        ].includes(category.parent_category?.handle ?? ""),
    );
    return {
      id: `product_${product.id}`,
      source: "medusa",
      type: product.collection?.handle === "gifts" ? "gift" : "product",
      title: product.title,
      slug: product.handle,
      excerpt: product.description,
      image: product.thumbnail,
      keywords: catalogs.map((catalog: { name: string }) => catalog.name).join(" "),
      catalogHandles: catalogs.map((catalog: { handle: string }) => catalog.handle),
      catalogRevision:
        typeof product.metadata?.catalog_revision === "string"
          ? product.metadata.catalog_revision
          : undefined,
      language: "en",
      eligibleMarkets: product.metadata?.eligible_markets ?? ["bd"],
    };
  });

  let editorialDocuments: Array<Record<string, unknown>> = [];
  if (process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET) {
    const sanity = createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      apiVersion: "2026-01-01",
      useCdn: false,
      token: process.env.SANITY_READ_TOKEN,
    });
    const records = await sanity.fetch<SanitySearchRecord[]>(
      `*[_type in ["recipe", "journalArticle", "region"] && verification.status == "verified" && verification.verified == true]{_id,_type,title,"slug":slug.current,summary,language}`,
    );
    editorialDocuments = records.map((record) => ({
      id: `sanity_${record._id}`,
      source: "sanity",
      type: record._type === "journalArticle" ? "article" : record._type,
      title: record.title,
      slug: record.slug,
      excerpt: record.summary,
      language: record.language ?? "en",
      eligibleMarkets: ["bd", "gb", "us"],
    }));
  } else {
    logger.warn("Sanity search sync skipped: SANITY_PROJECT_ID or SANITY_DATASET is missing.");
  }

  const client = new Meilisearch({ host, apiKey });
  const index = client.index("bangla_blend");
  await index.updateSettings({
    searchableAttributes: ["title", "excerpt", "keywords"],
    filterableAttributes: ["source", "type", "language", "eligibleMarkets", "catalogHandles"],
    sortableAttributes: ["title"],
    synonyms,
  });
  const documents = [...productDocuments, ...editorialDocuments];
  const clearTask = await index.deleteAllDocuments();
  await client.tasks.waitForTask(clearTask.taskUid);
  if (documents.length) {
    const task = await index.addDocuments(documents, { primaryKey: "id" });
    await client.tasks.waitForTask(task.taskUid);
  }
  logger.info(
    `Indexed ${productDocuments.length} commerce records and ${editorialDocuments.length} verified editorial records.`,
  );
}
