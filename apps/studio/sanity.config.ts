import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/schemaTypes";
import { deskStructure } from "./src/structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

if (!projectId) {
  throw new Error("SANITY_STUDIO_PROJECT_ID is required. Add it to apps/studio/.env before starting Sanity Studio.");
}

export default defineConfig({
  name: "default",
  title: "Bangla Blend Content Studio",
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool({ structure: deskStructure }), visionTool()],
  schema: { types: schemaTypes },
  document: {
    productionUrl: async (previousUrl, context) => {
      const origin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN;
      const slug = (context.document.slug as { current?: string } | undefined)?.current;
      if (!origin || !slug) return previousUrl;
      const paths: Record<string, string> = {
        recipe: `/recipes/${slug}`,
        journalArticle: `/journal/${slug}`,
        division: `/explore-bangladesh/${slug}`,
        region: `/explore-bangladesh/region/${slug}`,
        standardPage: `/${slug}`,
        legalPage: `/legal/${slug}`
      };
      return `${origin}${paths[context.document._type] || "/"}`;
    }
  }
});
