"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function ProductCardMotion({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      className="product-card"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reducedMotion ? undefined : { y: -5 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.38,
        delay: reducedMotion ? 0 : Math.min(index, 4) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.article>
  );
}
