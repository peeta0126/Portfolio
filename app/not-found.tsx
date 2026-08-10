import Link from "next/link";
export default function NotFound() { return <main className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6"><p className="text-sm text-zinc-500">404</p><h1 className="mt-3 text-5xl font-semibold tracking-tight">Page not found.</h1><Link className="mt-8 text-sm underline underline-offset-4" href="/">Back home</Link></main>; }
