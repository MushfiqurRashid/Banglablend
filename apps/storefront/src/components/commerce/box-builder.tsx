"use client";

import { useState } from "react";
import { Check, PackagePlus } from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { useCart } from "@/providers/cart-provider";
import { ProductPrice } from "./product-price";
import { ProductVisual } from "./product-visual";

const BOX_SIZE = 3;

export function BoxBuilder({ products }: { products: Product[] }) {
  const cart = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const toggle = (variantId: string) => {
    setSelected((current) => current.includes(variantId) ? current.filter((id) => id !== variantId) : current.length < BOX_SIZE ? [...current, variantId] : current);
  };

  const addBox = async () => {
    if (selected.length !== BOX_SIZE) return;
    setAdding(true);
    try {
      for (const variantId of selected) await cart.addItem({ variantId, quantity: 1 });
      setSelected([]);
    } finally {
      setAdding(false);
    }
  };

  return <div className="box-builder"><div className="box-builder-heading"><div><span className="eyebrow">Step 1</span><h2>Choose any three</h2><p>Select a product once. You can adjust individual quantities later in your shopping bag.</p></div><div className="box-progress" aria-live="polite"><strong>{selected.length}/{BOX_SIZE}</strong><span>selected</span></div></div>{products.length ? <div className="box-product-grid">{products.map((product) => { const variant = product.variants[0]!; const isSelected = selected.includes(variant.id); const isDisabled = !isSelected && selected.length === BOX_SIZE; return <button className={`box-product${isSelected ? " selected" : ""}`} type="button" onClick={() => toggle(variant.id)} disabled={isDisabled} aria-pressed={isSelected} key={product.id}><span className="box-product-visual"><ProductVisual product={product} /></span><span className="box-product-copy"><span><strong>{product.title}</strong><small>{variant.title}</small></span><ProductPrice variant={variant} /></span><span className="box-product-check" aria-hidden="true">{isSelected ? <Check size={16} /> : null}</span></button>; })}</div> : <div className="empty-state"><h3>No box items are available</h3><p>Try another delivery destination or return when the collection is restocked.</p></div>}<div className="box-builder-action"><div><span className="eyebrow">Step 2</span><h3>{selected.length === BOX_SIZE ? "Your box is ready" : `Choose ${BOX_SIZE - selected.length} more`}</h3></div><button className="button button-primary" type="button" disabled={selected.length !== BOX_SIZE || adding || cart.isLoading} onClick={() => void addBox()}><PackagePlus size={17} />{adding ? "Adding box…" : "Add box to bag"}</button></div>{cart.error ? <p className="field-error" role="alert">{cart.error}</p> : null}</div>;
}
