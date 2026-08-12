import "server-only";

export async function revalidateStorefrontContent(): Promise<string | null> {
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!storefrontUrl || !secret) return "Storefront cache revalidation is not configured.";

  try {
    const response = await fetch(new URL("/api/revalidate/content", storefrontUrl), {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return `Storefront cache revalidation returned HTTP ${response.status}.`;
    return null;
  } catch (error) {
    return error instanceof Error ? `Storefront cache revalidation failed: ${error.message}` : "Storefront cache revalidation failed.";
  }
}
