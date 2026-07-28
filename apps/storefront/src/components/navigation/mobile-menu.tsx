"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Brand } from "./brand";
import { DestinationSelector } from "./destination-selector";
import { useModalDialog } from "@/components/accessibility/use-modal-dialog";

const groups = [
  { label: "Shop", href: "/shop", children: [["Shop All", "/shop/all"], ["Originals", "/shop/originals"], ["Reserve", "/shop/reserve"], ["Pantry", "/shop/pantry"], ["Tea & Wellness", "/shop/tea-wellness"], ["Lifestyle Accessories", "/shop/lifestyle-accessories"], ["Best Sellers", "/shop/best-sellers"], ["New Arrivals", "/shop/new-arrivals"], ["Build a Box", "/shop/build-a-box"]] },
  { label: "Gifts", href: "/gifts", children: [["Gift Sets", "/gifts/gift-sets"], ["Regional Gifts", "/gifts/regional-gifts"], ["Corporate Gifting", "/gifts/corporate"]] },
  { label: "Discover Bangladesh", href: "/discover-bangladesh", children: [["Food Heritage", "/discover-bangladesh/food-heritage"], ["Regional Flavours", "/discover-bangladesh/regional-flavours"], ["Ingredient Stories", "/discover-bangladesh/ingredient-stories"], ["Farmer & Sourcing Stories", "/discover-bangladesh/farmer-sourcing-stories"], ["Cooking Guides", "/discover-bangladesh/cooking-guides"], ["Festivals & Seasons", "/discover-bangladesh/festivals-seasons"], ["Behind Bangla Blend", "/discover-bangladesh/behind-bangla-blend"]] },
  { label: "Recipes", href: "/recipes", children: [["By Region", "/recipes/by-region"], ["By Product", "/recipes/by-product"], ["Traditional", "/recipes/traditional"], ["Everyday Cooking", "/recipes/everyday-cooking"]] },
  { label: "Our Story", href: "/our-story", children: [["About Bangla Blend", "/our-story/about-bangla-blend"], ["Our Philosophy", "/our-story/our-philosophy"], ["Our Impact", "/our-story/our-impact"], ["Our Standards", "/our-story/our-standards"], ["Meet Annapurna", "/our-story/meet-annapurna"]] }
] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const close = () => setOpen(false);
  useModalDialog(open, close, dialogRef, closeRef);
  return <><button className="icon-button mobile-menu-button" type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu size={21} /></button><AnimatePresence>{open ? <motion.div ref={dialogRef} className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Main navigation" tabIndex={-1} initial={reducedMotion ? false : { x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}><div className="mobile-menu-top"><Brand /><button ref={closeRef} className="icon-button" type="button" onClick={close} aria-label="Close menu"><X /></button></div><nav className="mobile-menu-links"><Link className="mobile-primary-link" href="/" onClick={close}>Home<ArrowUpRight size={19} /></Link>{groups.map((group) => <details className="mobile-menu-group" key={group.href}><summary>{group.label}<ChevronDown size={18} /></summary><div className="mobile-submenu"><Link href={group.href} onClick={close}>View all {group.label}<ArrowUpRight size={14} /></Link>{group.children.map(([label, href]) => <Link href={href} key={href} onClick={close}>{label}<ArrowUpRight size={14} /></Link>)}</div></details>)}{([[
    "Wholesale", "/wholesale"
  ], ["FAQ", "/faq"], ["Contact", "/contact"], ["Account", "/account"]] satisfies Array<readonly [string, string]>).map(([label, href]) => <Link className="mobile-primary-link" href={href} key={href} onClick={close}>{label}<ArrowUpRight size={19} /></Link>)}</nav><div className="mobile-menu-foot"><DestinationSelector /></div></motion.div> : null}</AnimatePresence></>;
}
