import { formatMoney } from "@bangla-blend/commerce-client";
import type { ProductVariant } from "@bangla-blend/types";

export function ProductPrice({ variant }: { variant?: ProductVariant }) {
  if (!variant) return <span>Price unavailable</span>;
  return <span>{formatMoney(variant.price.amount, variant.price.currencyCode)}</span>;
}
