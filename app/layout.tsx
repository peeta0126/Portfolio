import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { profile } from "@/data/profile";
export const metadata: Metadata = { title: `${profile.name} | ${profile.role}`, description: profile.tagline, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<React.PropsWithChildren>) { return <html lang="ko" suppressHydrationWarning><body><Header />{children}</body></html>; }
