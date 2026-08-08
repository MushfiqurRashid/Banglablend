"use client";

import { useState } from "react";
import { Check, PackagePlus } from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { useCart } from "@/providers/cart-provider";
import { ProductPrice } from "./product-price";
import { ProductVisual } from "./product-visual";

export function BoxBuilder({ products, boxSize = 3 }: { products: Product[]; boxSize?: number }) {
  const cart = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const requiredSize = Number.isInteger(boxSize) && boxSize >= 2 && boxSize <= 12 ? boxSize : 3;

  const toggle = (variantId: string) => {
    setSelected((current) =>
      current.includes(variantId)
        ? current.filter((id) => id !== variantId)
        : current.length < requiredSize
          ? [...current, variantId]
          : current,
    );
  };

  const addBox = async () => {
    if (selected.length !== requiredSize) return;
    setAdding(true);
    try {
      for (const variantId of selected) await cart.addItem({ variantId, quantity: 1 });
      setSelected([]);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="box-builder">
      <div className="box-builder-heading">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2>Choose any {requiredSize}</h2>
          <p>
            Select a product once. You can adjust individual quantities later in your shopping bag.
          </p>
        </div>
        <div className="box-progress" aria-live="polite">
          <strong>
            {selected.length}/{requiredSize}
          </strong>
          <span>selected</span>
        </div>
      </div>
      {products.length ? (
        <div className="box-product-grid">
          {products.map((product) => {
            const variant = product.variants[0]!;
            const isSelected = selected.includes(variant.id);
            const isDisabled = !isSelected && selected.length === requiredSize;
            return (
              <button
                className={`box-product${isSelected ? "selected" : ""}`}
                type="button"
                onClick={() => toggle(variant.id)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                key={product.id}
              >
                <span className="box-product-visual">
                  <ProductVisual product={product} />
                </span>
                <span className="box-product-copy">
                  <span>
                    <strong>{product.title}</strong>
                    <small>{variant.title}</small>
                  </span>
                  <ProductPrice variant={variant} />
                </span>
                <span className="box-product-check" aria-hidden="true">
                  {isSelected ? <Check size={16} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No box items are available</h3>
          <p>Assign products to this catalog in Admin, or try another delivery destination.</p>
        </div>
      )}
      <div className="box-builder-action">
        <div>
          <span className="eyebrow">Step 2</span>
          <h3>
            {selected.length === requiredSize
              ? "Your box is ready"
              : `Choose ${requiredSize - selected.length} more`}
          </h3>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={selected.length !== requiredSize || adding || cart.isLoading}
          onClick={() => void addBox()}
        >
          <PackagePlus size={17} />
          {adding ? "Adding box…" : "Add box to bag"}
        </button>
      </div>
      {cart.error ? (
        <p className="field-error" role="alert">
          {cart.error}
        </p>
      ) : null}
    </div>
  );
}
