"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled = false,
  label = "Add to cart",
  showError = true,
}: {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  label?: string;
  showError?: boolean;
}) {
  const cart = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async () => {
    if (disabled || isAdding) return;
    setIsAdding(true);
    try {
      await cart.addItem({ variantId, quantity });
    } catch {
      // The shared cart provider presents the request error to the shopper.
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <button
        className="button button-primary add-to-cart"
        type="button"
        disabled={disabled || isAdding}
        onClick={() => void addToCart()}
      >
        <ShoppingBag size={16} /> {isAdding ? "Adding…" : label}
      </button>
      {showError && cart.error ? (
        <p className="field-error cart-action-error" role="alert">
          {cart.error}
        </p>
      ) : null}
    </div>
  );
}
