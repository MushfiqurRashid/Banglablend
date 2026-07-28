import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { ProductPrice } from "./product-price";
import { formatCollection, getProductMedia } from "@/lib/product-presentation";

export function ProductRecommendationCard({ product }: { product: Product }) {
  const media = getProductMedia(product)[0];

  return (
    <article className="pdp-recommendation-card">
      <Link className="pdp-recommendation-image" href={`/products/${product.handle}`} aria-label={`View ${product.title}`}>
        {media ? (
          <Image
            src={media.url}
            alt={media.alt}
            fill
            sizes="(max-width: 600px) 46vw, (max-width: 1000px) 23vw, 260px"
            unoptimized={media.url.startsWith("http")}
          />
        ) : null}
      </Link>
      <span className="pdp-card-heart" aria-hidden="true"><Heart size={16} /></span>
      <div className="pdp-recommendation-copy">
        <span>{formatCollection(product.collection)}</span>
        <h3><Link href={`/products/${product.handle}`}>{product.title}</Link></h3>
        <strong><ProductPrice variant={product.variants[0]} /></strong>
      </div>
    </article>
  );
}
