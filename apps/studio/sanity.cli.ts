import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

if (!projectId) {
  throw new Error("SANITY_STUDIO_PROJECT_ID is required. Add it to apps/studio/.env before running Sanity CLI commands.");
}

export default defineCliConfig({
  api: {
    projectId,
    dataset: process.env.SANITY_STUDIO_DATASET || "production"
  },
  vite: {
    cacheDir: ".sanity/vite-cache"
  }
});
