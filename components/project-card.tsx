import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projectSummary, publicPeriod } from "@/lib/presentation";
import type { Project } from "@/types";

export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  const summary = projectSummary(project);
  const image = project.detail?.gallery?.[0];
  const src = image?.src ?? project.thumbnail;
  const href = `/projects/${project.slug}`;
  const period = publicPeriod(project.period);
  return <article className={`project-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${compact ? "project-card-compact" : ""}`}>
    <Link href={href} aria-label={`${project.title} 상세 보기`} className={`group relative block overflow-hidden bg-zinc-100 dark:bg-zinc-900 ${compact ? "aspect-[16/9] max-h-44 sm:max-h-48" : "aspect-[16/10]"}`}>
      {src ? <Image src={src} alt={image?.alt ?? `${project.title} 실제 화면`} fill unoptimized={src.startsWith("https:") || src.startsWith("/api/")} sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw" className="object-contain transition-transform duration-300 motion-safe:group-hover:scale-[1.02]" /> : <div className="flex h-full flex-col justify-between p-6"><span className="font-mono text-xs tracking-widest text-zinc-500">PROJECT NOTES</span><p className="max-w-xs text-lg font-medium leading-7">{project.subtitle}</p><span className="text-xs text-zinc-500">화면 자료 준비 중 · 프로젝트 소개 보기 ↗</span></div>}
    </Link>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h4 className="text-2xl font-semibold tracking-tight"><Link className="inline-flex min-h-11 items-center gap-2 hover:underline underline-offset-4" href={href}>{project.title}<ArrowUpRight aria-hidden="true" size={17}/></Link></h4>
      <p className="mt-1 line-clamp-2 min-h-12 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{project.subtitle || project.description}</p>
      <div className="mt-3 flex min-h-5 flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500"><span>{project.kind === "Team Project" ? "팀 프로젝트" : project.kind === "Personal Project" ? "개인 프로젝트" : "프로젝트"}</span>{period && <span>{period}</span>}</div>
      <p className="mt-4 line-clamp-2 min-h-12 border-l-2 border-zinc-300 pl-3 text-sm leading-6 dark:border-zinc-700">{summary || project.description}</p>
      <ul aria-label="핵심 기술" className="mb-5 mt-4 flex flex-wrap gap-2">{(project.cardTech ?? project.tech).slice(0,4).map(tech => <li key={tech} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">{tech}</li>)}</ul>
      <div className="mt-auto flex flex-wrap gap-x-5 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
        <Link className="inline-flex min-h-11 items-center gap-1 font-medium" href={href}>상세 보기 <ArrowUpRight aria-hidden="true" size={14}/></Link>
        {project.github && <a className="inline-flex min-h-11 items-center text-zinc-600 hover:underline dark:text-zinc-400" href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} GitHub 저장소 열기`}>GitHub ↗</a>}
        {project.demo && <a className="inline-flex min-h-11 items-center text-zinc-600 hover:underline dark:text-zinc-400" href={project.demo} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} 라이브 데모 열기`}>Live Demo ↗</a>}
      </div>
    </div>
  </article>;
}
