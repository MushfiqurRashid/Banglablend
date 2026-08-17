import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { createSupabasePublicClient } from "@bangla-blend/supabase-client";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm, type ShippingChoice } from "@/components/checkout/checkout-form";
import { getActiveMarket } from "@/lib/commerce/server";
import "../commerce.css";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

async function getShippingOptions(marketCode: string): Promise<ShippingChoice[]> {
  const supabase = createSupabasePublicClient();
  const { data: region, error: regionError } = await supabase
    .from("regions")
    .select("id")
    .eq("market_code", marketCode)
    .eq("is_active", true)
    .maybeSingle();
  if (regionError || !region) return [];

  const { data, error } = await supabase
    .from("shipping_options")
    .select("id, name, amount, currency_code")
    .eq("region_id", region.id)
    .eq("is_active", true)
    .order("amount", { ascending: true });
  if (error) return [];
  return (data ?? []).map((option) => ({
    id: option.id,
    name: option.name,
    amount: option.amount,
    currencyCode: option.currency_code.toUpperCase(),
  }));
}

export default async function CheckoutPage() {
  const market = await getActiveMarket();
  const shippingOptions = await getShippingOptions(market.code);
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
          <CheckoutForm
            market={market}
            availability={availability}
            shippingOptions={shippingOptions}
          />
        </PageContainer>
      </section>
    </div>
  );
}
