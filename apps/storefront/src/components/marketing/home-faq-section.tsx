"use client";

import Link from "next/link";
import { ArrowUpRight, Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import { faqs } from "@/data/faqs";
import { PageContainer } from "@/components/layout/page-container";
import styles from "./home-faq-section.module.css";

const homepageFaqs = faqs.slice(0, 7);

export function HomeFaqSection() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="home-faq-title">
      <PageContainer className={styles.inner}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Good to know</span>
          <h2 className={styles.title} id="home-faq-title">
            Frequently Asked
            <br />
            Questions
          </h2>
          <div className={styles.ornament} aria-hidden="true">
            <span />
            <Sprout size={62} strokeWidth={1.25} />
            <span />
          </div>
          <p>
            A quick guide to our ingredients, products, storage and delivery.
          </p>
          <Link className={styles.allLink} href="/faq">
            Explore all FAQs
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.accordion}>
          {homepageFaqs.map((faq, index) => (
            <details
              className={styles.item}
              key={faq.id}
              name="home-faq"
              open={index === 0}
            >
              <summary className={styles.summary}>{faq.question}</summary>
              <div className={styles.answer}>
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
