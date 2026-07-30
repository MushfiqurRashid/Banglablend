import Link from "next/link";
import { UserRound, ShoppingBag } from "lucide-react";
import { Brand } from "./brand";
import { MegaMenu } from "./mega-menu";
import { DestinationSelector } from "./destination-selector";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/components/commerce/cart-button";
import { SearchCommand } from "@/components/search/search-command";
import { LanguageSelector } from "./language-selector";

const shopLinks = [
  { label: "Shop All", href: "/shop/all", image: "/images/hero-spice-still-life.png" },
  { label: "Originals", href: "/shop/originals", image: "/images/home-hero-hathajari.jpg" },
  { label: "Reserve", href: "/shop/reserve", image: "/images/recipe-mezban-gosh.png" },
  { label: "Pantry", href: "/shop/pantry", image: "/images/recipe-chana-dal-bhuna.png" },
  { label: "Tea & Wellness", href: "/shop/tea-wellness", image: "/images/recipe-masala-chai.png" },
  { label: "Lifestyle Accessories", href: "/shop/lifestyle-accessories", image: "/images/gifts-hero.png" },
  { label: "Best Sellers", href: "/shop/best-sellers", image: "/images/shorisha-ilish-recipe.png" },
  { label: "New Arrivals", href: "/shop/new-arrivals", image: "/images/recipe-grilled-hilsa.png" },
];
const giftLinks = [
  { label: "Gift Sets", href: "/gifts/gift-sets", image: "/images/gifts-hero.png" },
  { label: "Regional Gifts", href: "/gifts/regional-gifts", image: "/images/bangladesh-river-landscape.png" },
  { label: "Corporate Gifting", href: "/gifts/corporate", image: "/images/our-story-craft.png" },
];
const discoverLinks = [
  { label: "Food Heritage", href: "/discover-bangladesh/food-heritage", image: "/images/home-hero-hathajari.jpg" },
  { label: "Regional Flavours", href: "/discover-bangladesh/regional-flavours", image: "/images/bangladesh-river-landscape.png" },
  { label: "Ingredient Stories", href: "/discover-bangladesh/ingredient-stories", image: "/images/hero-spice-still-life.png" },
  { label: "Farmer & Sourcing Stories", href: "/discover-bangladesh/farmer-sourcing-stories", image: "/images/our-story-annapurna.png" },
  { label: "Cooking Guides", href: "/discover-bangladesh/cooking-guides", image: "/images/recipe-grilled-hilsa.png" },
  { label: "Festivals & Seasons", href: "/discover-bangladesh/festivals-seasons", image: "/images/recipe-masala-chai.png" },
  { label: "Behind Bangla Blend", href: "/discover-bangladesh/behind-bangla-blend", image: "/images/our-story-craft.png" },
];

export function DesktopHeader() {
  return (
    <header className="site-header">
      <div className="shell header-main">
        <Brand />
        <MobileMenu />
        <nav className="desktop-nav" aria-label="Main navigation">
          <MegaMenu label="Shop" href="/shop" links={shopLinks} />
          <MegaMenu label="Gifts" href="/gifts" links={giftLinks} />
          <MegaMenu label="Discover Bangladesh" href="/discover-bangladesh" links={discoverLinks} />
          <Link className="nav-link" href="/our-story">Our Story</Link>
        </nav>
        <div className="header-actions">
          <DestinationSelector />
          <span className="desktop-only"><LanguageSelector /></span>
          <span className="header-search"><SearchCommand /></span>
          <Link href="/account" className="icon-button account-action" aria-label="Account"><UserRound size={19} /></Link>
          <CartButton icon={<ShoppingBag size={19} />} />
        </div>
      </div>
    </header>
  );
}
