import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText, Github } from "lucide-react";
import { profile } from "@/data/profile";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/portfolio";
import { groupProjects } from "@/lib/presentation";

export async function Hero() {
  const { featured } = groupProjects(await getProjects());
  const hasTarot=featured.some(p=>p.github?.toLowerCase().endsWith("/tarot-card"));
  return <section className="py-14 sm:py-20">
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.3fr_.9fr] lg:gap-16 lg:px-8">
      <div>
        <p className="text-sm font-medium tracking-wide text-zinc-600 dark:text-zinc-400">{profile.role}</p>
        <h1 className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-5xl font-semibold tracking-[-.055em] sm:text-6xl">{profile.name}<span className="text-xl font-normal tracking-tight text-zinc-500 sm:text-2xl">Portfolio</span></h1>
        <p className="mt-6 max-w-lg text-balance text-2xl font-medium leading-[1.5] tracking-tight sm:text-3xl">{profile.tagline}</p>
        <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-600 dark:text-zinc-400">{profile.introduction}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="#projects">프로젝트 보기 <ArrowDown aria-hidden="true" className="ml-2" size={15}/></Button>
          <Button href={profile.github} target="_blank" rel="noopener noreferrer" variant="secondary"><Github aria-hidden="true" className="mr-2" size={15}/>GitHub</Button>
          <Button href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" variant="secondary"><FileText aria-hidden="true" className="mr-2" size={15}/>이력서 보기</Button>
        </div>
      </div>
      <aside aria-label="대표 프로젝트 요약" className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {hasTarot ? <div className="bg-zinc-50 p-6 dark:bg-zinc-900">
          <p className="text-xs font-medium tracking-wide text-zinc-500">별빛 타로 / 평균 응답시간</p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2"><p className="text-4xl font-semibold tracking-tight">33.2% <span className="text-base font-normal">단축</span></p><p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">15.39s → 10.28s</p></div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">기존 측정 전후 각 6회 평균 · 조건과 근거는 상세에서 확인</p>
        </div> : <p className="p-7 text-lg leading-8">문제 발견 → 요구사항 구체화 → AI 활용 구현 → 실제 테스트 → 반복 개선</p>}
        {featured.length > 0 && <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">{featured.map((project,index) => <li key={project.slug}><Link className="flex min-h-16 items-center gap-4 px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900" href={`/projects/${project.slug}`}><span className="font-mono text-xs text-zinc-500">0{index+1}</span><span className="min-w-0 flex-1"><strong className="block text-sm font-medium">{project.title}</strong><span className="mt-1 block text-xs leading-5 text-zinc-500">{project.subtitle}</span></span><ArrowUpRight aria-hidden="true" size={16}/></Link></li>)}</ol>}
      </aside>
    </div>
  </section>;
}
