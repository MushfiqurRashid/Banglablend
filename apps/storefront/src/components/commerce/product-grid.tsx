import type { Product } from "@bangla-blend/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  action = "none",
}: {
  products: Product[];
  action?: "none" | "add-to-cart" | "order";
}) {
  if (!products.length) return <div className="empty-state"><h3>No products found</h3><p>Try another collection or delivery destination.</p></div>;
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          action={action}
        />
      ))}
    </div>
  );
}
