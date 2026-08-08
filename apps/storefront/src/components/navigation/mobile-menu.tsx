"use client";

import { useRef, useState } from "react";
import Link from "@/components/navigation/smart-link";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useModalDialog } from "@/components/accessibility/use-modal-dialog";
import { Brand } from "./brand";
import { DestinationSelector } from "./destination-selector";
import type { StorefrontCatalog } from "@bangla-blend/types";

type NavigationGroup = {
  label: string;
  href: string;
  children: Array<readonly [string, string]>;
};

const groups: NavigationGroup[] = [
  {
    label: "Shop",
    href: "/shop",
    children: [
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
    label: "Gifts",
    href: "/gifts",
    children: [
      ["Gift Sets", "/gifts/gift-sets"],
      ["Regional Gifts", "/gifts/regional-gifts"],
      ["Corporate Gifting", "/gifts/corporate"],
    ],
  },
  {
    label: "Discover Bangladesh",
    href: "/discover-bangladesh",
    children: [
      ["Food Heritage", "/discover-bangladesh/food-heritage"],
      ["Regional Flavours", "/discover-bangladesh/regional-flavours"],
      ["Ingredient Stories", "/discover-bangladesh/ingredient-stories"],
      ["Farmer & Sourcing Stories", "/discover-bangladesh/farmer-sourcing-stories"],
      ["Cooking Guides", "/discover-bangladesh/cooking-guides"],
      ["Festivals & Seasons", "/discover-bangladesh/festivals-seasons"],
      ["Behind Bangla Blend", "/discover-bangladesh/behind-bangla-blend"],
    ],
  },
  {
    label: "Our Story",
    href: "/our-story",
    children: [
      ["About Bangla Blend", "/about-bangla-blend"],
      ["Our Philosophy", "/our-story/our-philosophy"],
      ["Our Impact", "/our-story/our-impact"],
      ["Meet Annapurna", "/our-story/meet-annapurna"],
    ],
  },
];

const secondaryLinks = [
  ["Search", "/search"],
  ["Wholesale", "/wholesale"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
  ["Account", "/account"],
] as const;

export function MobileMenu({ catalogs = [] }: { catalogs?: StorefrontCatalog[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const close = () => setOpen(false);
  const navigationGroups = groups.map((group) => {
    const dynamicChildren =
      group.label === "Gifts"
        ? catalogs
            .filter((catalog) => catalog.section === "gifts")
            .map((catalog) => [catalog.name, `/gifts/${catalog.handle}`] as const)
        : group.label === "Shop"
          ? catalogs
              .filter((catalog) => catalog.section !== "gifts")
              .map(
                (catalog) => [catalog.name, `/shop/${catalog.section}/${catalog.handle}`] as const,
              )
          : [];
    return {
      ...group,
      children: [...group.children, ...dynamicChildren].filter(
        (child, index, children) => children.findIndex((item) => item[1] === child[1]) === index,
      ),
    };
  });

  useModalDialog(open, close, dialogRef, closeRef);

  return (
    <>
      <button
        className="icon-button mobile-menu-button"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu size={21} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            tabIndex={-1}
            initial={reducedMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mobile-menu-top">
              <Brand />
              <button
                ref={closeRef}
                className="icon-button"
                type="button"
                onClick={close}
                aria-label="Close menu"
              >
                <X />
              </button>
            </div>

            <nav className="mobile-menu-links" aria-label="Mobile navigation">
              <Link className="mobile-primary-link" href="/" onClick={close}>
                Home
                <ArrowUpRight size={19} />
              </Link>

              {navigationGroups.map((group) => (
                <details className="mobile-menu-group" key={group.href}>
                  <summary>
                    {group.label}
                    <ChevronDown size={18} />
                  </summary>
                  <div className="mobile-submenu">
                    <Link href={group.href} onClick={close}>
                      View all {group.label}
                      <ArrowUpRight size={14} />
                    </Link>
                    {group.children.map(([label, href]) => (
                      <Link href={href} key={href} onClick={close}>
                        {label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}
                  </div>
                </details>
              ))}

              {secondaryLinks.map(([label, href]) => (
                <Link className="mobile-primary-link" href={href} key={href} onClick={close}>
                  {label}
                  <ArrowUpRight size={19} />
                </Link>
              ))}
            </nav>

            <div className="mobile-menu-foot">
              <DestinationSelector />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
