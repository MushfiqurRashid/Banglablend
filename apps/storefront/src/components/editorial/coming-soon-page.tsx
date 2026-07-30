import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import type { ComingSoonPageConfig } from "@/config/coming-soon";
import styles from "./coming-soon-page.module.css";

export function ComingSoonPage({
  title,
  eyebrow,
  description,
  image,
  imageAlt,
  parent,
}: ComingSoonPageConfig) {
  return (
    <section className={styles.page} aria-labelledby="coming-soon-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.copy}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            {parent.href === "/" ? null : <Link href={parent.href}>{parent.label}</Link>}
            {parent.href === "/" ? null : <span aria-hidden="true">/</span>}
            <span aria-current="page">{title}</span>
          </nav>

          <span className={styles.status}>
            <Sparkles size={14} strokeWidth={1.7} aria-hidden="true" />
            Coming soon
          </span>
          <p className={styles.bangla} lang="bn">
            শীঘ্রই আসছে
          </p>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="coming-soon-title">{title}</h1>
          <span className={styles.ornament} aria-hidden="true">
            <span />
          </span>
          <p className={styles.description}>{description}</p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href={parent.href}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to {parent.label}
            </Link>
            <Link className={styles.secondaryAction} href="/shop">
              Explore the shop
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.promise} aria-label="Our publishing approach">
            <span>Gathered with care</span>
            <i aria-hidden="true" />
            <span>Reviewed before release</span>
          </div>
        </div>

        <div className={styles.media}>
          <div className={styles.imageFrame}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 46vw"
            />
            <span className={styles.imageShade} aria-hidden="true" />
            <span className={styles.cornerMark} aria-hidden="true">
              BB
            </span>
            <div className={styles.imageCaption}>
              <span>In preparation</span>
              <strong>{title}</strong>
            </div>
          </div>
          <span className={styles.mediaIndex} aria-hidden="true">
            Bangla Blend · Journal 01
          </span>
        </div>
      </div>
    </section>
  );
}
