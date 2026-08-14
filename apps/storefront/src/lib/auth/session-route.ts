export function isStorefrontSessionRoute(pathname: string) {
  if (pathname === "/account" || pathname.startsWith("/account/")) return true;
  if (pathname === "/api/account" || pathname.startsWith("/api/account/")) return true;
  if (pathname === "/api/checkout" || pathname.startsWith("/api/checkout/")) return true;
  if (pathname === "/checkout/success" || pathname.startsWith("/checkout/success/")) return true;
  if (pathname.startsWith("/gifts/")) return true;

  // Custom catalog pages load the signed-in customer's saved boxes. The top-level shop and
  // collection pages are public and must not touch auth while rendering catalog data.
  return /^\/shop\/[^/]+\/[^/]+(?:\/|$)/.test(pathname);
}
