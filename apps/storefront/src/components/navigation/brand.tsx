import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand-mark" aria-label="Bangla Blend home">
      <Image
        className="brand-logo"
        src="/images/bangla-blend-logo-final-v3.png"
        alt=""
        width={96}
        height={96}
        sizes="(max-width: 900px) 48px, 52px"
        priority
      />
      <span className="brand-wordmark">Bangla Blend</span>
    </Link>
  );
}
