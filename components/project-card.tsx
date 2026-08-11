import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:-translate-y-1 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-600"
    >
      {project.thumbnail && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-[0.14] transition-opacity group-hover:opacity-20 dark:opacity-10 dark:group-hover:opacity-[0.16]">
          <Image
            src={project.thumbnail}
            alt=""
            fill
            sizes="(min-width: 768px) 20vw, 40vw"
            className="object-cover object-center grayscale"
          />
        </div>
      )}
      <div className="relative max-w-[85%]">
        <p className="text-sm text-zinc-500">{project.period}</p>
        <h3 className="mt-7 text-2xl font-semibold tracking-tight">
          {project.title}
        </h3>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {project.subtitle}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {project.description}
        </p>
      </div>
      <div className="relative mt-6 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400"
            >
              {item}
            </span>
          ))}
        </div>
        <ArrowUpRight
          className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          size={20}
        />
      </div>
    </Link>
  );
}
