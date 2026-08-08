"use client";

import { useMemo, useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import type { ProductVariant } from "@bangla-blend/types";
import { ProductPrice } from "./product-price";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductPurchase({
  variants,
  previewOnly = false,
  productTitle = "product"
}: {
  variants: ProductVariant[];
  previewOnly?: boolean;
  productTitle?: string;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const variant = useMemo(
    () => variants.find((item) => item.id === variantId) ?? variants[0],
    [variantId, variants]
  );

  if (!variant) return <p className="form-error">This product has no purchasable variant.</p>;
  const isOutOfStock = (variant.inventoryQuantity ?? 0) <= 0;

  return (
    <div className="purchase-panel">
      <fieldset className="variant-field">
        <legend>Select size</legend>
        <div>
          {variants.map((item) => (
            <label key={item.id} className={item.id === variantId ? "variant-option selected" : "variant-option"}>
              <input
                type="radio"
                name="variant"
                value={item.id}
                checked={item.id === variantId}
                onChange={() => setVariantId(item.id)}
              />
              <span>
                <strong>{item.title}</strong>
                <small><ProductPrice variant={item} /></small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="purchase-controls">
        <span className="purchase-label">Quantity</span>
        <div className="purchase-row">
          <div className="quantity-control" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(20, value + 1))}
              disabled={quantity >= 20}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <AddToCartButton
            variantId={variant.id}
            quantity={quantity}
            disabled={previewOnly || isOutOfStock}
          />
          <button
            className={saved ? "pdp-save-button is-saved" : "pdp-save-button"}
            type="button"
            aria-pressed={saved}
            aria-label={`${saved ? "Remove" : "Save"} ${productTitle} ${saved ? "from" : "to"} wishlist`}
            onClick={() => setSaved((value) => !value)}
          >
            <Heart size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {previewOnly ? (
        <p className="preview-note">Sample product: verified catalog data is required before purchasing is enabled.</p>
      ) : isOutOfStock ? (
        <p className="preview-note">This size is currently unavailable.</p>
      ) : (
        <p className="stock-note"><span /> Inventory is revalidated when you add to cart.</p>
      )}
    </div>
  );
}
