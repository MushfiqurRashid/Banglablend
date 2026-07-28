"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

export function AddToCartButton({ variantId, quantity = 1, disabled = false }: { variantId: string; quantity?: number; disabled?: boolean }) {
  const cart = useCart();
  return (
    <div>
      <button
        className="button button-primary add-to-cart"
        disabled={disabled || cart.isLoading}
        onClick={() => void cart.addItem({ variantId, quantity })}
      >
        <ShoppingBag size={16} /> {cart.isLoading ? "Adding…" : "Add to cart"}
      </button>
      {cart.error ? <p className="field-error cart-action-error" role="alert">{cart.error}</p> : null}
    </div>
  );
}
