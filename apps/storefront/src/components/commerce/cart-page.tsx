"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@bangla-blend/commerce-client";
import { useCart } from "@/providers/cart-provider";

export function CartPageContent() {
  const { cart, isLoading, updateItem, removeItem, error } = useCart();
  const reducedMotion = useReducedMotion();

  if (isLoading && !cart) {
    return (
      <div className="cart-page-state" role="status">
        <LoaderCircle className="cart-page-spinner" size={24} aria-hidden="true" />
        <div>
          <h2>Preparing your bag</h2>
          <p>Confirming your selection and destination pricing.</p>
        </div>
      </div>
    );
  }
  if (!cart?.items.length) {
    return (
      <div className="cart-page-empty">
        <div className="cart-empty-copy">
          <span className="cart-empty-icon" aria-hidden="true">
            <ShoppingBag size={24} />
          </span>
          <span className="eyebrow">Your bag is waiting</span>
          <h2>Begin with something remarkable.</h2>
          <p>Explore regional blends, pantry essentials and gifts made to be shared.</p>
          <Link className="button button-primary" href="/shop">
            Shop the collection <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="cart-empty-media">
          <Image
            src="/images/campaign/shop-signature-lineup.jpg"
            alt="A selection of Bangla Blend spices"
            fill
            sizes="(max-width: 900px) 100vw, 46vw"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-grid">
      <div className="cart-page-lines">
        <div className="cart-lines-heading">
          <div>
            <span className="eyebrow">In your bag</span>
            <h2>{cart.items.reduce((total, line) => total + line.quantity, 0)} items selected</h2>
          </div>
          <Link href="/shop">
            <ArrowLeft size={14} aria-hidden="true" /> Keep shopping
          </Link>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <AnimatePresence initial={false}>
          {cart.items.map((line) => (
            <motion.article
              className="cart-page-line"
              key={line.id}
              layout={reducedMotion ? undefined : true}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion
                  ? undefined
                  : { opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }
              }
              transition={{ duration: 0.25 }}
            >
              <div className="cart-page-art">
                {line.thumbnail ? (
                  <Image
                    src={line.thumbnail}
                    alt={line.title}
                    fill
                    sizes="160px"
                    unoptimized={line.thumbnail.startsWith("http")}
                  />
                ) : (
                  <span aria-hidden="true">ব</span>
                )}
              </div>
              <div className="cart-page-info">
                <h3>{line.title}</h3>
                <p>{line.variantTitle ?? "Signature selection"}</p>
                <span className="cart-unit-price">
                  {formatMoney(line.unitPrice, cart.currencyCode.toUpperCase())} each
                </span>
                <div className="quantity-control" aria-label={`Quantity for ${line.title}`}>
                  <button
                    type="button"
                    disabled={isLoading || line.quantity <= 1}
                    onClick={() => void updateItem(line.id, line.quantity - 1)}
                    aria-label={`Decrease ${line.title}`}
                  >
                    <Minus size={15} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void updateItem(line.id, line.quantity + 1)}
                    aria-label={`Increase ${line.title}`}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="cart-page-line-end">
                <div>
                  <small>Item total</small>
                  <strong>{formatMoney(line.total, cart.currencyCode.toUpperCase())}</strong>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void removeItem(line.id)}
                  aria-label={`Remove ${line.title}`}
                  title="Remove item"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        <div className="gift-note-field">
          <span className="gift-note-icon" aria-hidden="true">
            <Gift size={18} />
          </span>
          <div>
            <strong>Make it a gift</strong>
            <p>Add a recipient, personal message and preferred delivery date at checkout.</p>
          </div>
          <ArrowRight size={16} aria-hidden="true" />
        </div>
      </div>
      <aside className="cart-summary">
        <div className="cart-summary-heading">
          <div>
            <span className="eyebrow">Review</span>
            <h2>Order summary</h2>
          </div>
          <ShoppingBag size={21} aria-hidden="true" />
        </div>
        <div className="cart-summary-lines">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(cart.subtotal, cart.currencyCode.toUpperCase())}</strong>
          </div>
          {cart.discountTotal ? (
            <div className="cart-summary-discount">
              <span>Discount</span>
              <strong>-{formatMoney(cart.discountTotal, cart.currencyCode.toUpperCase())}</strong>
            </div>
          ) : null}
          <div>
            <span>Delivery</span>
            <strong>Calculated at checkout</strong>
          </div>
          <div className="summary-total">
            <span>Estimated total</span>
            <strong>{formatMoney(cart.total, cart.currencyCode.toUpperCase())}</strong>
          </div>
        </div>
        <p className="cart-summary-note">
          Final delivery, taxes and duties are confirmed from the destination address.
        </p>
        <Link href="/checkout" className="button button-primary">
          Continue to checkout <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <ul className="cart-summary-assurances">
          <li>
            <LockKeyhole size={14} aria-hidden="true" /> Secure checkout
          </li>
          <li>
            <ShieldCheck size={14} aria-hidden="true" /> Server-verified payment
          </li>
          <li>
            <Gift size={14} aria-hidden="true" /> Gift details available next
          </li>
        </ul>
        <Link href="/shop" className="cart-summary-back">
          <ArrowLeft size={14} aria-hidden="true" /> Keep shopping
        </Link>
      </aside>
    </div>
  );
}
