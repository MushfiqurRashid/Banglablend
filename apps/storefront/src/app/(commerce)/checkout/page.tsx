import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getActiveMarket } from "@/lib/commerce/server";
import "../commerce.css";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const market = await getActiveMarket();
  const developmentPreview = process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
  const releaseApproved = process.env.NODE_ENV !== "production" || (process.env.PRODUCT_CATALOG_APPROVED === "true" && process.env.LEGAL_CONTENT_APPROVED === "true" && process.env.OPERATIONS_RELEASE_APPROVED === "true");
  const availability = {
    checkoutEnabled: releaseApproved && (market.domestic || process.env.ENABLE_INTERNATIONAL_CHECKOUT === "true"),
    codEnabled: process.env.MEDUSA_COD_ENABLED === "true",
    sslcommerzEnabled: process.env.SSLCOMMERZ_ENABLED === "true" || developmentPreview
  };
  return <><header className="page-hero"><PageContainer><span className="eyebrow">Secure checkout</span><h1>Delivery and payment</h1><p className="lead">Ordering for yourself or sending a gift, near or far—the recipient and billing details can stay separate.</p></PageContainer></header><section className="section"><PageContainer><CheckoutForm market={market} availability={availability} /></PageContainer></section></>;
}
