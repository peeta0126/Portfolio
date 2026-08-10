import Link from "next/link";
import { cn } from "@/lib/utils";
type Props = React.ComponentProps<typeof Link> & { variant?: "primary" | "secondary" };
export function Button({ className, variant = "primary", ...props }: Props) {
  return <Link className={cn("inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-transform hover:-translate-y-0.5", variant === "primary" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-200 dark:border-zinc-800", className)} {...props} />;
}
