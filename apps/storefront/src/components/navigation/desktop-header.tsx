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
  ["Shop All", "/shop/all"], ["Originals", "/shop/originals"], ["Reserve", "/shop/reserve"],
  ["Pantry", "/shop/pantry"], ["Tea & Wellness", "/shop/tea-wellness"],
  ["Lifestyle Accessories", "/shop/lifestyle-accessories"], ["Best Sellers", "/shop/best-sellers"],
  ["New Arrivals", "/shop/new-arrivals"], ["Build a Box", "/shop/build-a-box"]
] satisfies Array<readonly [string, string]>;
const mappedShopLinks = shopLinks.map(([label, href]) => ({ label, href }));
const giftLinks = ([
  ["Gift Sets", "/gifts/gift-sets"], ["Regional Gifts", "/gifts/regional-gifts"], ["Corporate Gifting", "/gifts/corporate"]
] satisfies Array<readonly [string, string]>).map(([label, href]) => ({ label, href }));
const discoverLinks = ([
  ["Food Heritage", "/discover-bangladesh/food-heritage"], ["Regional Flavours", "/discover-bangladesh/regional-flavours"],
  ["Ingredient Stories", "/discover-bangladesh/ingredient-stories"], ["Farmer & Sourcing Stories", "/discover-bangladesh/farmer-sourcing-stories"],
  ["Cooking Guides", "/discover-bangladesh/cooking-guides"], ["Festivals & Seasons", "/discover-bangladesh/festivals-seasons"],
  ["Behind Bangla Blend", "/discover-bangladesh/behind-bangla-blend"]
] satisfies Array<readonly [string, string]>).map(([label, href]) => ({ label, href }));

export function DesktopHeader() {
  return (
    <header className="site-header">
      <div className="shell header-main">
        <Brand />
        <MobileMenu />
        <nav className="desktop-nav" aria-label="Main navigation">
          <MegaMenu label="Shop" href="/shop" title="Begin with flavor" description="Signature blends, Reserve ingredients and practical pantry staples." links={mappedShopLinks} featureTitle="The Originals" featureHref="/shop/originals" />
          <MegaMenu label="Gifts" href="/gifts" title="Give with meaning" description="Gift sets for people, places and organizations—sent near or far." links={giftLinks} featureTitle="Regional Gifts" featureHref="/gifts/regional-gifts" />
          <MegaMenu label="Discover Bangladesh" href="/discover-bangladesh" title="Follow food into story" description="Food heritage, regional flavours, ingredients, people and practical cooking." links={discoverLinks} featureTitle="Food Heritage" featureHref="/discover-bangladesh/food-heritage" />
          <Link className="nav-link" href="/recipes">Recipes</Link>
          <Link className="nav-link" href="/our-story">Our Story</Link>
        </nav>
        <div className="header-actions">
          <DestinationSelector />
          <span className="desktop-only"><LanguageSelector /></span>
          <SearchCommand />
          <Link href="/account" className="icon-button account-action" aria-label="Account"><UserRound size={19} /></Link>
          <CartButton icon={<ShoppingBag size={19} />} />
        </div>
      </div>
    </header>
  );
}
