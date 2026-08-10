"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { profile } from "@/data/profile";
export function Header() {
  const [dark, setDark] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("theme"); const next = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; setDark(next); document.documentElement.classList.toggle("dark", next); }, []);
  const toggle = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("theme", next ? "dark" : "light"); };
  return <header className="sticky top-0 z-50 border-b border-zinc-100/70 bg-white/80 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/80"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8"><Link href="/" className="font-semibold tracking-tight">{profile.name}</Link><nav className="hidden gap-6 text-sm text-zinc-500 md:flex"><Link href="/#about">About</Link><Link href="/#projects">Projects</Link><Link href="/#contact">Contact</Link></nav><button aria-label="테마 변경" onClick={toggle} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div></header>;
}
