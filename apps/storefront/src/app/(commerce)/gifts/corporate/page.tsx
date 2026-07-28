import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { CorporateGiftingForm } from "@/components/forms/corporate-gifting-form";
import "../../commerce.css";

export const metadata: Metadata = { title: "Corporate Gifting", description: "Corporate and community gifting inquiries for Bangladesh and international delivery." };

export default function CorporateGiftingPage() {
  return <><header className="page-hero"><PageContainer><span className="eyebrow">For teams and communities</span><h1>Corporate gifting, handled personally</h1><p className="lead">Tell us about your organization, quantity, budget, date and destinations. A team member will confirm what is operationally possible before anything is promised.</p></PageContainer></header><section className="section"><PageContainer><div className="shop-intro-grid"><div><span className="eyebrow">One thoughtful brief</span><h2>From a meeting room in Dhaka to a community gathering abroad</h2><p className="lead" style={{ marginTop: "1.5rem" }}>Designed for businesses, embassies, cultural organizations, events, hotels, restaurants and celebrations.</p></div><CorporateGiftingForm /></div></PageContainer></section></>;
}
