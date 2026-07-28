import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Gift, Globe2, MapPin } from "lucide-react";
import { getStoreProducts } from "@/lib/commerce/server";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import "../commerce.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gifts", description: "Send regional and occasion gifts within Bangladesh or to approved international destinations." };

export default async function GiftsPage() {
  const products = (await getStoreProducts()).filter((product) => product.collection === "gifts");
  return <><header className="page-hero"><PageContainer><span className="eyebrow">Give with meaning</span><h1>Give the Taste of Bangladesh</h1><p className="lead">Thoughtful regional collections for family, friends, celebrations and organizations—with separate buyer and recipient details.</p></PageContainer></header><Section><PageContainer><div className="shop-categories"><Link className="shop-category" href="/gifts/gift-sets"><Gift /><div><h3>Gift sets</h3><p>Ready-to-share selections for celebrations, hosts and thoughtful everyday gestures.</p><span className="text-link">Explore <ArrowUpRight size={14} /></span></div></Link><Link className="shop-category" href="/gifts/regional-gifts"><MapPin /><div><h3>Regional gifts</h3><p>Collections that connect products with carefully verified stories of place.</p><span className="text-link">Explore <ArrowUpRight size={14} /></span></div></Link><Link className="shop-category" href="/gifts/corporate"><Building2 /><div><h3>Corporate gifting</h3><p>Flexible gifting for businesses, organizations, missions and events.</p><span className="text-link">Make an inquiry <ArrowUpRight size={14} /></span></div></Link></div></PageContainer></Section><section className="market-section"><PageContainer><div className="market-heading"><div><span className="eyebrow">Send near or far</span><h2>Two journeys. Equal care.</h2></div><Globe2 size={38} /></div><div className="market-cards"><div className="market-card"><div className="market-index">Bangladesh</div><div><h3>Deliver within Bangladesh</h3><p>The buyer may live anywhere. Add a recipient telephone, message, preferred date, packaging and delivery instructions.</p></div></div><div className="market-card"><div className="market-index">International</div><div><h3>Send internationally</h3><p>Eligible products, shipping estimates and customs guidance adapt to the destination selected.</p></div></div></div></PageContainer></section><Section><PageContainer><div className="section-heading"><div><span className="eyebrow">Gift-ready selection</span><h2>Curated to share</h2></div><Link className="text-link" href="/gifts/gift-sets">View all gift sets <ArrowUpRight size={14} /></Link></div><ProductGrid products={products} /></PageContainer></Section></>;
}
