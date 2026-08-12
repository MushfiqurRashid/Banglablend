import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getActiveMarket } from "@/lib/commerce/server";
import "../commerce.css";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const market = await getActiveMarket();
  const developmentPreview =
    process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
  const releaseApproved =
    process.env.NODE_ENV !== "production" ||
    (process.env.PRODUCT_CATALOG_APPROVED === "true" &&
      process.env.LEGAL_CONTENT_APPROVED === "true" &&
      process.env.OPERATIONS_RELEASE_APPROVED === "true");
  const availability = {
    checkoutEnabled:
      releaseApproved && (market.domestic || process.env.ENABLE_INTERNATIONAL_CHECKOUT === "true"),
    codEnabled: process.env.COD_ENABLED === "true",
    sslcommerzEnabled: process.env.SSLCOMMERZ_ENABLED === "true" || developmentPreview,
  };
  return (
    <div className="checkout-page">
      <header className="checkout-hero">
        <PageContainer className="checkout-hero-inner">
          <div className="checkout-hero-copy">
            <Link className="checkout-back-link" href="/cart">
              <ArrowLeft size={15} aria-hidden="true" /> Back to shopping bag
            </Link>
            <span className="eyebrow">Secure checkout</span>
            <h1>Complete your order</h1>
            <p className="lead">
              Delivery, gifting and payment details, thoughtfully kept in one place.
            </p>
          </div>
          <div className="checkout-assurance">
            <div className="checkout-assurance-copy">
              <span className="checkout-assurance-icon" aria-hidden="true">
                <ShieldCheck size={21} />
              </span>
              <div>
                <strong>Protected checkout</strong>
                <p>Your details stay private and payment is verified server-side.</p>
              </div>
            </div>
            <ol className="checkout-progress" aria-label="Checkout progress">
              <li className="is-complete">
                <span>
                  <Check size={13} aria-hidden="true" />
                </span>
                Bag
              </li>
              <li className="is-current">
                <span>2</span>
                Details
              </li>
              <li>
                <span>
                  <LockKeyhole size={12} aria-hidden="true" />
                </span>
                Payment
              </li>
            </ol>
          </div>
        </PageContainer>
      </header>
      <section className="checkout-section">
        <PageContainer>
          <CheckoutForm market={market} availability={availability} />
        </PageContainer>
      </section>
    </div>
  );
}
