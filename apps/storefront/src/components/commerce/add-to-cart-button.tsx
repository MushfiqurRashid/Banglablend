"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled = false,
  label = "Add to cart",
}: {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  label?: string;
}) {
  const cart = useCart();

  return (
    <div>
      <button
        className="button button-primary add-to-cart"
        disabled={disabled || cart.isLoading}
        onClick={() => void cart.addItem({ variantId, quantity })}
      >
        <ShoppingBag size={16} /> {cart.isLoading ? "Adding…" : label}
      </button>
      {cart.error ? (
        <p className="field-error cart-action-error" role="alert">
          {cart.error}
        </p>
      ) : null}
    </div>
  );
}
