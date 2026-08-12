"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircleQuestion, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "@/components/navigation/smart-link";
import { faqs } from "@/data/faqs";
import styles from "./faq-chat-widget.module.css";

const widgetFaqs = faqs.slice(0, 6);

export function FaqChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handlePointerDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  if (pathname === "/cart" || pathname.startsWith("/checkout")) return null;

  return (
    <div className={`${styles.wrapper} faq-chat-widget`} ref={wrapperRef}>
      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Frequently asked questions">
          <div className={styles.panelHeader}>
            <span>Frequently Asked Questions</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="Close FAQ"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.panelBody}>
            {widgetFaqs.map((faq) => (
              <details className={styles.item} key={faq.id} name="faq-widget">
                <summary className={styles.summary}>{faq.question}</summary>
                <p className={styles.answer}>{faq.answer}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className={styles.allLink} onClick={() => setOpen(false)}>
            View all FAQs
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close FAQ" : "Open FAQ"}
      >
        {open ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <MessageCircleQuestion size={22} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
