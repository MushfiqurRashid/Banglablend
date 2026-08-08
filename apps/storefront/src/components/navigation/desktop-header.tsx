import Link from "@/components/navigation/smart-link";
import { UserRound, ShoppingBag } from "lucide-react";
import { Brand } from "./brand";
import { MegaMenu } from "./mega-menu";
import { DestinationSelector } from "./destination-selector";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/components/commerce/cart-button";
import { SearchCommand } from "@/components/search/search-command";
import { LanguageSelector } from "./language-selector";
import type { StorefrontCatalog } from "@bangla-blend/types";

const shopLinks = [
  { label: "Shop All", href: "/shop/all", image: "/images/hero-spice-still-life.webp" },
  { label: "Originals", href: "/shop/originals", image: "/images/home-hero-hathajari.jpg" },
  { label: "Reserve", href: "/shop/reserve", image: "/images/recipe-mezban-gosh.webp" },
  { label: "Pantry", href: "/shop/pantry", image: "/images/recipe-chana-dal-bhuna.webp" },
  { label: "Tea & Wellness", href: "/shop/tea-wellness", image: "/images/recipe-masala-chai.webp" },
  {
    label: "Lifestyle Accessories",
    href: "/shop/lifestyle-accessories",
    image: "/images/gifts-hero.webp",
  },
  {
    label: "Best Sellers",
    href: "/shop/best-sellers",
    image: "/images/shorisha-ilish-recipe.webp",
  },
  { label: "New Arrivals", href: "/shop/new-arrivals", image: "/images/recipe-grilled-hilsa.webp" },
];
const giftLinks = [
  { label: "Gift Sets", href: "/gifts/gift-sets", image: "/images/gifts-hero.webp" },
  {
    label: "Regional Gifts",
    href: "/gifts/regional-gifts",
    image: "/images/bangladesh-river-landscape.webp",
  },
  { label: "Corporate Gifting", href: "/gifts/corporate", image: "/images/our-story-craft.webp" },
];
const discoverLinks = [
  {
    label: "Food Heritage",
    href: "/discover-bangladesh/food-heritage",
    image: "/images/home-hero-hathajari.jpg",
  },
  {
    label: "Regional Flavours",
    href: "/discover-bangladesh/regional-flavours",
    image: "/images/bangladesh-river-landscape.webp",
  },
  {
    label: "Ingredient Stories",
    href: "/discover-bangladesh/ingredient-stories",
    image: "/images/hero-spice-still-life.webp",
  },
  {
    label: "Farmer & Sourcing Stories",
    href: "/discover-bangladesh/farmer-sourcing-stories",
    image: "/images/our-story-annapurna.webp",
  },
  {
    label: "Cooking Guides",
    href: "/discover-bangladesh/cooking-guides",
    image: "/images/recipe-grilled-hilsa.webp",
  },
  {
    label: "Festivals & Seasons",
    href: "/discover-bangladesh/festivals-seasons",
    image: "/images/recipe-masala-chai.webp",
  },
  {
    label: "Behind Bangla Blend",
    href: "/discover-bangladesh/behind-bangla-blend",
    image: "/images/our-story-craft.webp",
  },
];

function uniqueLinks<T extends { href: string }>(links: T[]) {
  return links.filter(
    (link, index) => links.findIndex((item) => item.href === link.href) === index,
  );
}

export function DesktopHeader({ catalogs = [] }: { catalogs?: StorefrontCatalog[] }) {
  const dynamicShopLinks = catalogs
    .filter((catalog) => catalog.section !== "gifts")
    .map((catalog) => ({
      label: catalog.name,
      href: `/shop/${catalog.section}/${catalog.handle}`,
      image: "/images/hero-spice-still-life.webp",
    }));
  const dynamicGiftLinks = catalogs
    .filter((catalog) => catalog.section === "gifts")
    .map((catalog) => ({
      label: catalog.name,
      href: `/gifts/${catalog.handle}`,
      image: "/images/gifts-hero.webp",
    }));

  return (
    <header className="site-header">
      <div className="shell header-main">
        <Brand />
        <MobileMenu catalogs={catalogs} />
        <nav className="desktop-nav" aria-label="Main navigation">
          <MegaMenu
            label="Shop"
            href="/shop"
            links={uniqueLinks([...shopLinks, ...dynamicShopLinks])}
          />
          <MegaMenu
            label="Gifts"
            href="/gifts"
            links={uniqueLinks([...giftLinks, ...dynamicGiftLinks])}
          />
          <MegaMenu label="Discover Bangladesh" href="/discover-bangladesh" links={discoverLinks} />
          <Link className="nav-link" href="/our-story">
            Our Story
          </Link>
        </nav>
        <div className="header-actions">
          <DestinationSelector />
          <span className="desktop-only">
            <LanguageSelector />
          </span>
          <span className="header-search">
            <SearchCommand />
          </span>
          <Link href="/account" className="icon-button account-action" aria-label="Account">
            <UserRound size={19} />
          </Link>
          <CartButton icon={<ShoppingBag size={19} />} />
        </div>
      </div>
    </header>
  );
}
