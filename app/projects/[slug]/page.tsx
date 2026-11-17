import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProjects } from "@/lib/portfolio";
import { Container } from "@/components/container";
import { ProjectDetailContent } from "@/components/project-detail";
import { publicPeriod } from "@/lib/presentation";

export const dynamic = "force-dynamic";
type Props = {params: Promise<{slug:string}>};
export async function generateMetadata({params}:Props): Promise<Metadata> {
  const {slug}=await params;
  const project=(await getProjects()).find(p=>p.slug===slug);
  return {title:project?`${project.title} | 이민석 포트폴리오`:"Project",description:project?.description};
}

export default async function ProjectPage({params}:Props) {
  const {slug}=await params;
  const project=(await getProjects()).find(p=>p.slug===slug);
  if(!project) notFound();
  return <main id="main-content">
    <Container className="py-12 sm:py-20">
      <Link href="/#projects" className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"><ArrowLeft aria-hidden="true" size={16}/>프로젝트 목록</Link>
      <div className="mt-12 max-w-4xl">
        <p className="text-sm text-zinc-500">{project.kind === "Team Project" ? "팀 프로젝트" : project.kind === "Personal Project" ? "개인 프로젝트" : "프로젝트"}{publicPeriod(project.period) && ` · ${publicPeriod(project.period)}`}</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{project.title}</h1>
        <p className="mt-5 text-xl leading-8 text-zinc-600 dark:text-zinc-400">{project.subtitle}</p>
        <p className="mt-6 max-w-3xl leading-8 text-zinc-700 dark:text-zinc-300">{project.description}</p>
        {project.detail?.overview && <p className="mt-5 max-w-3xl leading-8 text-zinc-600 dark:text-zinc-400">{project.detail.overview}</p>}
        <ul aria-label="사용 기술" className="mt-8 flex flex-wrap gap-2">{project.tech.map(tech=><li className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800" key={tech}>{tech}</li>)}</ul>
        <div className="mt-7 flex flex-wrap gap-5 text-sm">{project.github && <a href={project.github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">GitHub ↗</a>}{project.demo && <a href={project.demo} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">Live Demo ↗</a>}</div>
      </div>
    </Container>
    <div className="border-y border-zinc-100 bg-zinc-50 py-16 sm:py-20 dark:border-zinc-900 dark:bg-zinc-900/30"><Container className="max-w-4xl"><ProjectDetailContent project={project}/></Container></div>
  </main>;
}
