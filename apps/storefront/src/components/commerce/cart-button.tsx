"use client";

import type { ReactNode } from "react";
import { useCart } from "@/providers/cart-provider";

export function CartButton({ icon }: { icon: ReactNode }) {
  const { count, open } = useCart();
  return <button className="icon-button" onClick={open} aria-label={`Open cart, ${count} items`}>{icon}{count ? <span className="cart-count">{count}</span> : null}</button>;
}
