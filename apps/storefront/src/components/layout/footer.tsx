import Link from "next/link";
import { Brand } from "@/components/navigation/brand";

const columns = [
  { title: "Shop", links: [["Shop All", "/shop/all"], ["Originals", "/shop/originals"], ["Reserve", "/shop/reserve"], ["Pantry", "/shop/pantry"], ["Tea & Wellness", "/shop/tea-wellness"], ["Lifestyle Accessories", "/shop/lifestyle-accessories"], ["Best Sellers", "/shop/best-sellers"], ["New Arrivals", "/shop/new-arrivals"], ["Build a Box", "/shop/build-a-box"]] },
  { title: "Discover", links: [["Food Heritage", "/discover-bangladesh/food-heritage"], ["Regional Flavours", "/discover-bangladesh/regional-flavours"], ["Ingredient Stories", "/discover-bangladesh/ingredient-stories"], ["Farmer & Sourcing", "/discover-bangladesh/farmer-sourcing-stories"], ["Cooking Guides", "/discover-bangladesh/cooking-guides"], ["Festivals & Seasons", "/discover-bangladesh/festivals-seasons"], ["Behind Bangla Blend", "/discover-bangladesh/behind-bangla-blend"]] },
  { title: "Gifts & Recipes", links: [["Gift Sets", "/gifts/gift-sets"], ["Regional Gifts", "/gifts/regional-gifts"], ["Corporate Gifting", "/gifts/corporate"], ["Recipe Library", "/recipes"], ["By Region", "/recipes/by-region"], ["By Product", "/recipes/by-product"], ["Traditional", "/recipes/traditional"], ["Everyday Cooking", "/recipes/everyday-cooking"]] },
  { title: "Our Story", links: [["About Bangla Blend", "/our-story/about-bangla-blend"], ["Our Philosophy", "/our-story/our-philosophy"], ["Our Impact", "/our-story/our-impact"], ["Our Standards", "/our-story/our-standards"], ["Meet Annapurna", "/our-story/meet-annapurna"], ["Wholesale", "/wholesale"]] },
  { title: "Help & Legal", links: [["FAQ", "/faq"], ["Contact", "/contact"], ["Shipping Policy", "/legal/shipping-policy"], ["Returns & Refunds", "/legal/returns-refund-policy"], ["Privacy Policy", "/legal/privacy-policy"], ["Terms & Conditions", "/legal/terms-and-conditions"], ["Cookie Policy", "/legal/cookie-policy"]] }
] satisfies Array<{ title: string; links: Array<readonly [string, string]> }>;

export function Footer() {
  return <footer className="site-footer"><div className="shell footer-top"><div className="footer-brand"><Brand /><p>The Taste of Bangladesh—expressed through regional products, generous cooking and stories handled with care.</p></div>{columns.map((column) => <div className="footer-column" key={column.title}><p className="footer-title">{column.title}</p><ul className="footer-links">{column.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>)}</div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Bangla Blend</span><span>English storefront · Bangladesh and approved international markets</span></div></footer>;
}
