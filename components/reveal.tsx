"use client";
import { motion, useReducedMotion } from "framer-motion";
export function Reveal({ children, delay = 0, className }: React.PropsWithChildren<{ delay?: number; className?: string }>) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 1, y: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay }}>{children}</motion.div>;
}
