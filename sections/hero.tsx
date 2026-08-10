"use client";

import { motion } from "framer-motion";
import { ArrowDown, Github } from "lucide-react";
import { profile } from "@/data/profile";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1fr_.8fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <p className="mb-5 text-sm font-medium text-zinc-500">{profile.role}</p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-.055em] sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-relaxed text-zinc-700 dark:text-zinc-300">
            {profile.tagline}
          </p>
          <p className="mt-4 max-w-lg leading-7 text-zinc-500">{profile.introduction}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="#projects">
              프로젝트 보기 <ArrowDown className="ml-2" size={15} />
            </Button>
            <Button
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
            >
              <Github className="mr-2" size={15} />
              GitHub
            </Button>
            {/* public/resume.pdf를 실제 이력서 PDF로 교체한 뒤 이력서 버튼을 활성화하세요. */}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-5 shadow-2xl shadow-zinc-900/10 dark:border-zinc-800"
        >
          <div className="mb-5 flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <i className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <i className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </div>
          <pre className="overflow-hidden font-mono text-sm leading-7 text-zinc-300">
            <span className="text-violet-300">const</span> developer = {"{"}
            {"\n"} name: <span className="text-emerald-300">&quot;{profile.name}&quot;</span>,
            {"\n"} focus: [
            <span className="text-emerald-300">&quot;React&quot;</span>, {" "}
            <span className="text-emerald-300">&quot;TypeScript&quot;</span>],
            {"\n"} learning: {" "}
            <span className="text-emerald-300">&quot;Full-stack Web Development&quot;</span>
            {"\n"}{"}"};
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
