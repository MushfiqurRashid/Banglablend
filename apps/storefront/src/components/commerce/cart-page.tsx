"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatMoney } from "@bangla-blend/commerce-client";
import { useCart } from "@/providers/cart-provider";

export function CartPageContent() {
  const { cart, isLoading, updateItem, removeItem, error } = useCart();
  if (isLoading && !cart) return <div className="empty-state"><h3>Loading your bag…</h3></div>;
  if (!cart?.items.length) return <div className="empty-state"><h3>Your shopping bag is empty</h3><p>Find a blend, ingredient or gift to begin.</p><Link className="button button-primary" href="/shop">Shop the collection</Link></div>;
  return (
    <div className="cart-page-grid">
      <div className="cart-page-lines">
        {error ? <p className="form-error">{error}</p> : null}
        {cart.items.map((line) => <article className="cart-page-line" key={line.id}><div className="cart-page-art">ব</div><div className="cart-page-info"><h3>{line.title}</h3><p>{line.variantTitle}</p><div className="quantity-control"><button type="button" disabled={isLoading || line.quantity <= 1} onClick={() => void updateItem(line.id, line.quantity - 1)} aria-label={`Decrease ${line.title}`}><Minus size={15} /></button><span>{line.quantity}</span><button type="button" disabled={isLoading} onClick={() => void updateItem(line.id, line.quantity + 1)} aria-label={`Increase ${line.title}`}><Plus size={15} /></button></div></div><div className="cart-page-line-end"><strong>{formatMoney(line.total, cart.currencyCode.toUpperCase())}</strong><button type="button" onClick={() => void removeItem(line.id)} aria-label={`Remove ${line.title}`}><Trash2 size={16} /> Remove</button></div></article>)}
        <div className="gift-note-field"><strong>Sending a gift?</strong><p>Add the recipient, message, preferred date, and delivery instructions securely at checkout.</p></div>
      </div>
      <aside className="cart-summary"><span className="eyebrow">Order summary</span><div><span>Subtotal</span><strong>{formatMoney(cart.subtotal, cart.currencyCode.toUpperCase())}</strong></div>{cart.discountTotal ? <div><span>Discount</span><strong>−{formatMoney(cart.discountTotal, cart.currencyCode.toUpperCase())}</strong></div> : null}<div className="summary-total"><span>Estimated total</span><strong>{formatMoney(cart.total, cart.currencyCode.toUpperCase())}</strong></div><p>Shipping, taxes and duties are calculated from the delivery address. International buyers may owe local import charges.</p><Link href="/checkout" className="button button-primary">Continue to checkout</Link><Link href="/shop" className="text-link">Keep shopping</Link></aside>
    </div>
  );
}
