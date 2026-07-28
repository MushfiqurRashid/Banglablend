import type { Metadata } from "next";
import { WholesaleInquiryForm } from "@/components/forms/wholesale-inquiry-form";
import { PageContainer } from "@/components/layout/page-container";
import "../(commerce)/commerce.css";

export const metadata: Metadata = { title: "Wholesale", description: "Wholesale Bangla Blend inquiries for Bangladesh and international markets." };

export default function WholesalePage() {
  return <><header className="page-hero"><PageContainer><span className="eyebrow">For trade partners</span><h1>Wholesale</h1><p className="lead">Tell us about your business, markets, product interest and timing. Export availability is confirmed market by market.</p></PageContainer></header><section className="section"><PageContainer><div className="shop-intro-grid"><div><h2>Build a considered assortment</h2><p className="lead" style={{ marginTop: "1.2rem" }}>For restaurants, hotels, specialty retailers, exporters and other approved partners.</p></div><WholesaleInquiryForm /></div></PageContainer></section></>;
}
