import Link from "@/components/navigation/smart-link";
import { Brand } from "@/components/navigation/brand";
import { siteConfig } from "@/config/site";
import type { StorefrontCatalog } from "@bangla-blend/types";

function SocialIcon({ label }: { label: string }) {
  if (label === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 8.5V7c0-1 .7-1.5 1.6-1.5H18V2h-3.2C11.6 2 10 4 10 6.7v1.8H7V12h3v10h4V12h3.2l.6-3.5H14Z" />
      </svg>
    );
  }
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.4" cy="6.7" r="1.15" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  );
}

const columns = [
  {
    title: "Shop",
    links: [
      ["Shop All", "/shop/all"],
      ["Originals", "/shop/originals"],
      ["Reserve", "/shop/reserve"],
      ["Pantry", "/shop/pantry"],
      ["Tea & Wellness", "/shop/tea-wellness"],
      ["Lifestyle Accessories", "/shop/lifestyle-accessories"],
      ["Best Sellers", "/shop/best-sellers"],
      ["New Arrivals", "/shop/new-arrivals"],
    ],
  },
  {
    title: "Discover",
    links: [
      ["Food Heritage", "/discover-bangladesh/food-heritage"],
      ["Regional Flavours", "/discover-bangladesh/regional-flavours"],
      ["Ingredient Stories", "/discover-bangladesh/ingredient-stories"],
      ["Farmer & Sourcing", "/discover-bangladesh/farmer-sourcing-stories"],
      ["Cooking Guides", "/discover-bangladesh/cooking-guides"],
      ["Festivals & Seasons", "/discover-bangladesh/festivals-seasons"],
      ["Behind Bangla Blend", "/discover-bangladesh/behind-bangla-blend"],
    ],
  },
  {
    title: "Gifts & Recipes",
    links: [
      ["Gift Sets", "/gifts/gift-sets"],
      ["Regional Gifts", "/gifts/regional-gifts"],
      ["Corporate Gifting", "/gifts/corporate"],
      ["Recipe Library", "/recipes"],
      ["By Region", "/recipes/by-region"],
      ["By Product", "/recipes/by-product"],
      ["Traditional", "/recipes/traditional"],
      ["Everyday Cooking", "/recipes/everyday-cooking"],
    ],
  },
  {
    title: "Our Story",
    links: [
      ["About Bangla Blend", "/about-bangla-blend"],
      ["Our Philosophy", "/our-story/our-philosophy"],
      ["Our Impact", "/our-story/our-impact"],
      ["Meet Annapurna", "/our-story/meet-annapurna"],
      ["Wholesale", "/wholesale"],
    ],
  },
  {
    title: "Help & Legal",
    links: [
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
      ["Shipping Policy", "/legal/shipping-policy"],
      ["Returns & Refunds", "/legal/returns-refund-policy"],
      ["Privacy Policy", "/legal/privacy-policy"],
      ["Terms & Conditions", "/legal/terms-and-conditions"],
      ["Cookie Policy", "/legal/cookie-policy"],
    ],
  },
] satisfies Array<{ title: string; links: Array<readonly [string, string]> }>;

export function Footer({ catalogs = [] }: { catalogs?: StorefrontCatalog[] }) {
  const navigationColumns = columns.map((column) => {
    const dynamicLinks =
      column.title === "Shop"
        ? catalogs
            .filter((catalog) => catalog.section !== "gifts")
            .map((catalog) => [catalog.name, `/shop/${catalog.section}/${catalog.handle}`] as const)
        : column.title === "Gifts & Recipes"
          ? catalogs
              .filter((catalog) => catalog.section === "gifts")
              .map((catalog) => [catalog.name, `/gifts/${catalog.handle}`] as const)
          : [];
    return {
      ...column,
      links: [...column.links, ...dynamicLinks].filter(
        (link, index, links) => links.findIndex((item) => item[1] === link[1]) === index,
      ),
    };
  });

  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div className="footer-brand">
          <Brand />
          <div className="footer-brand-copy">
            <p>
              The Taste of Bangladesh, expressed through regional products, generous cooking and
              stories handled with care.
            </p>
            <div className="footer-social-links" aria-label="Bangla Blend social media">
              {siteConfig.socialLinks.map((social) => (
                <a
                  className="footer-social-link"
                  href={social.href}
                  key={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} (opens in a new tab)`}
                  title={social.label}
                >
                  <SocialIcon label={social.label} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {navigationColumns.map((column) => (
          <div className="footer-column" key={column.title}>
            <p className="footer-title">{column.title}</p>
            <ul className="footer-links">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Bangla Blend</span>
        <span>English storefront · Bangladesh and approved international markets</span>
      </div>
    </footer>
  );
}
