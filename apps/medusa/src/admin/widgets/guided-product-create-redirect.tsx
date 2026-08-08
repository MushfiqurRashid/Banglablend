import { useEffect } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { adminPath } from "../lib/superadmin";

const standardProductCreatePath = adminPath("/products/create");
const guidedProductCreatePath = adminPath("/superadmin/catalog/create");

/**
 * Medusa owns the standard product-create route, so a custom Admin route cannot
 * replace it. This invisible topbar widget is mounted throughout Admin and
 * sends client-side navigation from every standard "Create product" entry
 * point to our guided creator.
 */
const GuidedProductCreateRedirect = () => {
  useEffect(() => {
    const currentPath = window.location.pathname.replace(/\/+$/, "");

    if (currentPath === standardProductCreatePath) {
      window.location.replace(guidedProductCreatePath);
    }
  }, []);

  return null;
};

export const config = defineWidgetConfig({
  zone: "topbar",
  id: "bangla-blend:guided-product-create-redirect",
});

export default GuidedProductCreateRedirect;
