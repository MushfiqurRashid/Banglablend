export function getCanonicalStorefrontUrl(
  requestUrl: string,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
) {
  if (!configuredSiteUrl) return null;

  try {
    const request = new URL(requestUrl);
    const canonical = new URL(configuredSiteUrl);
    const canonicalHost = canonical.hostname.toLowerCase();
    const requestHost = request.hostname.toLowerCase();

    if (canonicalHost.startsWith("www.") || requestHost !== `www.${canonicalHost}`) return null;

    canonical.pathname = request.pathname;
    canonical.search = request.search;
    canonical.hash = "";
    return canonical;
  } catch {
    return null;
  }
}
