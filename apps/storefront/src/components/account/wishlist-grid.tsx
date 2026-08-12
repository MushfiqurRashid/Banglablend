"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@bangla-blend/commerce-client";

export interface WishlistItem {
  id: string;
  product: {
    id: string;
    title: string;
    handle: string;
    thumbnail_url: string | null;
    thumbnail_alt: string | null;
    price?: { amount: number; currencyCode: string };
  } | null;
}

export function WishlistGrid({ items, emptyTitle = "Your wishlist is empty", emptyBody = "Save products you love to find them here." }: { items: WishlistItem[]; emptyTitle?: string; emptyBody?: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  const remove = async (productId: string) => {
    setRemoving(productId);
    try {
      await fetch(`/api/account/wishlist/${productId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRemoving(null);
    }
  };

  if (!items.length) {
    return (
      <div className="empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="wishlist-grid">
      {items.map((item) =>
        item.product ? (
          <div className="wishlist-card" key={item.id}>
            <button
              type="button"
              className="wishlist-card-remove"
              onClick={() => void remove(item.product!.id)}
              disabled={removing === item.product.id}
              aria-label={`Remove ${item.product.title} from wishlist`}
            >
              <Heart size={16} fill="currentColor" />
            </button>
            <Link href={`/products/${item.product.handle}`} className="wishlist-card-visual">
              {item.product.thumbnail_url ? (
                <img src={item.product.thumbnail_url} alt={item.product.thumbnail_alt ?? item.product.title} />
              ) : (
                <span aria-hidden="true">ব</span>
              )}
            </Link>
            <strong>{item.product.title}</strong>
            {item.product.price ? <span>{formatMoney(item.product.price.amount, item.product.price.currencyCode)}</span> : null}
            <Link href={`/products/${item.product.handle}`} className="button">View Product</Link>
          </div>
        ) : null,
      )}
    </div>
  );
}
