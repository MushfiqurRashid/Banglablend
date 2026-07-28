import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@bangla-blend/types";
import { getProductMedia } from "@/lib/product-presentation";

const colorByCollection: Record<Product["collection"], string> = {
  originals: "visual-chilli",
  reserve: "visual-gold",
  pantry: "visual-terracotta",
  "tea-wellness": "visual-green",
  "lifestyle-accessories": "visual-ink",
  gifts: "visual-gift"
};

export function ProductVisual({ product, className }: { product: Product; className?: string }) {
  const media = getProductMedia(product)[0];

  if (media) {
    return (
      <div className={cn("product-visual product-media-visual", className)}>
        <Image
          src={media.url}
          alt={media.alt}
          fill
          sizes="(max-width: 700px) 50vw, 25vw"
          unoptimized={media.url.startsWith("http")}
        />
      </div>
    );
  }

  return (
    <div className={cn("product-visual", colorByCollection[product.collection], className)} aria-hidden="true">
      <span className="visual-sun" />
      <span className="visual-leaf visual-leaf-one" />
      <span className="visual-leaf visual-leaf-two" />
      <div className="product-pack">
        <span className="pack-lid" />
        <span className="pack-kicker">BANGLA BLEND</span>
        <span className="pack-glyph">ব</span>
        <span className="pack-name">{product.title}</span>
        <span className="pack-origin">{product.region ?? "Bangladesh"}</span>
      </div>
    </div>
  );
}
