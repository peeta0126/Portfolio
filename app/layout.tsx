import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { profile } from "@/data/profile";
export const metadata: Metadata = { title: `${profile.name} | ${profile.role}`, description: profile.tagline, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<React.PropsWithChildren>) { return <html lang="ko" suppressHydrationWarning><body><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-zinc-950">본문으로 건너뛰기</a><Header />{children}</body></html>; }
