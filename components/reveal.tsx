"use client";
import { motion } from "framer-motion";
export function Reveal({ children, delay = 0 }: React.PropsWithChildren<{ delay?: number }>) {
  return <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay }}>{children}</motion.div>;
}
