import Link from "@/components/navigation/smart-link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { ProductVisual } from "./product-visual";
import { ProductPrice } from "./product-price";
import { ProductBadge } from "./product-badge";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductCardMotion } from "./product-card-motion";

export function ProductCard({
  product,
  index = 0,
  action = "none",
}: {
  product: Product;
  index?: number;
  action?: "none" | "add-to-cart" | "order";
}) {
  const primaryVariant = product.variants[0];

  return (
    <ProductCardMotion index={index}>
      <Link href={`/products/${product.handle}`} className="product-card-image" aria-label={`View ${product.title}`}>
        <ProductVisual product={product} />
        <span className="product-card-arrow"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="product-card-body">
        <div className="product-badges">{product.badges.slice(0, 2).map((badge) => <ProductBadge key={badge}>{badge}</ProductBadge>)}</div>
        <Link href={`/products/${product.handle}`}><h3>{product.title}</h3></Link>
        <p className="product-subtitle">{product.subtitle}</p>
        <div className="product-card-meta"><span>{product.region}</span><ProductPrice variant={product.variants[0]} /></div>
        {action !== "none" ? (
          <div className="product-card-actions">
            {action === "order" ? (
              <Link
                className="button button-primary product-card-order"
                href={`/products/${product.handle}`}
              >
                Click to order
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ) : primaryVariant ? (
              <AddToCartButton
                variantId={primaryVariant.id}
                disabled={
                  Boolean(product.isPlaceholder) ||
                  (primaryVariant.inventoryQuantity ?? 0) <= 0
                }
                showError={false}
              />
            ) : (
              <button className="button button-primary add-to-cart" type="button" disabled>
                Add to cart
              </button>
            )}
          </div>
        ) : null}
      </div>
    </ProductCardMotion>
  );
}
