"use client";

import { useRef } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@bangla-blend/commerce-client";
import { useCart } from "@/providers/cart-provider";
import { useModalDialog } from "@/components/accessibility/use-modal-dialog";

export function CartDrawer() {
  const { cart, isOpen, close, updateItem, removeItem, isLoading, error } = useCart();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  useModalDialog(isOpen, close, dialogRef, closeRef);
  return (
    <AnimatePresence>
      {isOpen ? <motion.div className="cart-overlay" role="presentation" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <motion.aside ref={dialogRef} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} initial={reducedMotion ? false : { x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        <div className="cart-drawer-header"><div><span className="eyebrow">Your selection</span><h2 id="cart-title">Shopping bag</h2></div><button ref={closeRef} className="icon-button" type="button" onClick={close} aria-label="Close cart"><X /></button></div>
        <div className="shipping-progress"><div><span>Available delivery services and prices are confirmed from the checkout address.</span></div></div>
        <div className="cart-drawer-content">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {!cart?.items.length ? <div className="cart-empty"><ShoppingBag size={32} /><h3>Your bag is ready for flavor</h3><p>Explore signature blends, Reserve ingredients and gifts.</p><Link href="/shop" onClick={close} className="button button-primary">Shop the collection</Link></div> : cart.items.map((line) => (
            <div className="cart-line" key={line.id}>
              <div className="cart-line-art" aria-hidden="true">ব</div>
              <div><p className="cart-line-title">{line.title}</p><p className="cart-line-variant">{line.variantTitle}</p><div className="cart-line-actions"><div className="quantity-mini"><button type="button" disabled={isLoading || line.quantity <= 1} onClick={() => void updateItem(line.id, line.quantity - 1)} aria-label={`Decrease ${line.title}`}><Minus size={13} /></button><span>{line.quantity}</span><button type="button" disabled={isLoading} onClick={() => void updateItem(line.id, line.quantity + 1)} aria-label={`Increase ${line.title}`}><Plus size={13} /></button></div><button className="remove-line" type="button" onClick={() => void removeItem(line.id)} aria-label={`Remove ${line.title}`}><Trash2 size={14} /></button></div></div>
              <strong>{formatMoney(line.total, cart.currencyCode.toUpperCase())}</strong>
            </div>
          ))}
        </div>
        {cart?.items.length ? <div className="cart-drawer-footer"><div className="cart-subtotal"><span>Subtotal</span><strong>{formatMoney(cart.subtotal, cart.currencyCode.toUpperCase())}</strong></div><p>Shipping, discounts and duties are calculated at checkout.</p><Link href="/checkout" onClick={close} className="button button-primary">Continue to checkout</Link><Link href="/cart" onClick={close} className="text-link">View full cart</Link></div> : null}
      </motion.aside>
    </motion.div> : null}
    </AnimatePresence>
  );
}
