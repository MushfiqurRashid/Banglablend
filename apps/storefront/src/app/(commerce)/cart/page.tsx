import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { CartPageContent } from "@/components/commerce/cart-page";
import "../commerce.css";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false, follow: false } };

export default function CartPage() {
  return <><header className="page-hero"><PageContainer><span className="eyebrow">Your selection</span><h1>Shopping bag</h1><p className="lead">Prices and availability are revalidated against your delivery destination before checkout.</p></PageContainer></header><section className="section"><PageContainer><CartPageContent /></PageContainer></section></>;
}
