"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export function Section({ className, ...props }: HTMLMotionProps<"section">) {
  const reducedMotion = useReducedMotion();
  return <motion.section className={cn("section", className)} initial={reducedMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }} {...props} />;
}
