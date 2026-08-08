import Image from "next/image";
import Link from "@/components/navigation/smart-link";

export function Brand() {
  return (
    <Link href="/" className="brand-mark" aria-label="Bangla Blend home">
      <Image
        className="brand-logo"
        src="/images/bangla-blend-logo-final-v3.webp"
        alt=""
        width={96}
        height={96}
        fetchPriority="low"
      />
      <span className="brand-wordmark">Bangla Blend</span>
    </Link>
  );
}
