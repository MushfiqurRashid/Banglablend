import "server-only";
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const sanityConfigured = Boolean(projectId);

export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2026-01-01",
      useCdn: process.env.NODE_ENV === "production",
      token: process.env.SANITY_API_READ_TOKEN,
      perspective: "published",
    })
  : null;

let hasLoggedFetchFailure = false;

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}) {
  if (!sanityClient) return null;

  try {
    const result = await sanityClient.fetch<T>(query, params, {
      next: { revalidate: 120, tags: ["sanity"] },
    });
    hasLoggedFetchFailure = false;
    return result;
  } catch (error) {
    if (!hasLoggedFetchFailure) {
      const reason = error instanceof Error ? error.message : "Unknown request error";
      console.warn(`[sanity] Content fetch unavailable; rendering fallback content. ${reason}`);
      hasLoggedFetchFailure = true;
    }
    return null;
  }
}
