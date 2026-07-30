import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Coffee,
  LayoutGrid,
  Leaf,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";

const categoryCards: Array<{
  slug: string;
  title: string;
  copy: string;
  href: string;
  icon: LucideIcon;
}> = [
  { slug: "all", title: "Shop All", copy: "The full collection", href: "/shop/all", icon: LayoutGrid },
  { slug: "originals", title: "Originals", copy: "Signature blends", href: "/shop/originals", icon: Leaf },
  { slug: "reserve", title: "Reserve", copy: "Spices from one origin", href: "/shop/reserve", icon: Sparkles },
  { slug: "pantry", title: "Pantry", copy: "Everyday essentials", href: "/shop/pantry", icon: Package },
  { slug: "tea-wellness", title: "Tea & Wellness", copy: "Teas and infusions", href: "/shop/tea-wellness", icon: Coffee },
  {
    slug: "lifestyle-accessories",
    title: "Lifestyle",
    copy: "Kitchen accessories",
    href: "/shop/lifestyle-accessories",
    icon: ShoppingBag,
  },
  { slug: "best-sellers", title: "Best Sellers", copy: "Customer favourites", href: "/shop/best-sellers", icon: Tag },
  { slug: "new-arrivals", title: "New Arrivals", copy: "Freshly added", href: "/shop/new-arrivals", icon: BadgeCheck },
];

export function ShopCategoryBand({ activeCategory }: { activeCategory?: string }) {
  return (
    <section className="shop-category-band" aria-label="Shop by category">
      <div className="shell shop-category-shortcuts">
        {categoryCards.map(({ slug, title, copy, href, icon: Icon }) => {
          const isActive = activeCategory === slug;

          return (
            <Link
              className={`shop-category-shortcut${isActive ? " is-active" : ""}`}
              href={href}
              aria-current={isActive ? "page" : undefined}
              key={href}
            >
              <Icon size={27} strokeWidth={1.45} />
              <strong>{title}</strong>
              <span>{copy}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
