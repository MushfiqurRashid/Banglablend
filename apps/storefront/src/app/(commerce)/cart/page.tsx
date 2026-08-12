import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Gift, MapPin, PackageCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { CartPageContent } from "@/components/commerce/cart-page";
import "../commerce.css";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="cart-page">
      <header className="cart-hero">
        <PageContainer className="cart-hero-inner">
          <div className="cart-hero-copy">
            <Link className="cart-back-link" href="/shop">
              <ArrowLeft size={15} aria-hidden="true" /> Continue shopping
            </Link>
            <span className="eyebrow">Your selection</span>
            <h1>Shopping bag</h1>
            <p className="lead">
              Review your blends, gifts and quantities before moving to secure checkout.
            </p>
          </div>
          <ul className="cart-hero-promises" aria-label="Order benefits">
            <li>
              <PackageCheck size={20} aria-hidden="true" />
              <span>
                <strong>Packed with care</strong>
                <small>Prepared for a beautiful arrival</small>
              </span>
            </li>
            <li>
              <MapPin size={20} aria-hidden="true" />
              <span>
                <strong>Destination aware</strong>
                <small>Delivery confirmed at checkout</small>
              </span>
            </li>
            <li>
              <Gift size={20} aria-hidden="true" />
              <span>
                <strong>Gift ready</strong>
                <small>Add a note and recipient details</small>
              </span>
            </li>
          </ul>
        </PageContainer>
      </header>
      <section className="cart-section">
        <PageContainer>
          <CartPageContent />
        </PageContainer>
      </section>
    </div>
  );
}
