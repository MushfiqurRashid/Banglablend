"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@bangla-blend/types";
import { ProductVisual } from "./product-visual";
import { ProductPrice } from "./product-price";
import { ProductBadge } from "./product-badge";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({
  product,
  index = 0,
  action = "none",
}: {
  product: Product;
  index?: number;
  action?: "none" | "add-to-cart" | "order";
}) {
  const reducedMotion = useReducedMotion();
  const primaryVariant = product.variants[0];

  return (
    <motion.article className="product-card" initial={reducedMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} whileHover={reducedMotion ? undefined : { y: -6 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.055, ease: [0.22, 1, 0.36, 1] }}>
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
                  (primaryVariant.inventoryQuantity !== undefined &&
                    primaryVariant.inventoryQuantity <= 0)
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
    </motion.article>
  );
}
