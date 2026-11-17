import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { skillGroups } from "@/data/skills";
import Link from "next/link";
import { getProjects } from "@/lib/portfolio";

export async function Skills() {
  const projects = await getProjects();
  return (
    <section id="skills" className="border-y border-zinc-100 py-16 sm:py-20 dark:border-zinc-900">
      <Container>
        <p className="section-label">04 — Tech Stack</p>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight">프로젝트에 적용한 기술</h2>
        <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">각 프로젝트의 구현 범위를 기준으로 정리했습니다. 숙련도 점수 대신 상세 페이지에서 사용 맥락을 설명합니다.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          {skillGroups.map((group, i) => (
            <Reveal key={group.name} delay={i * 0.04} className="min-w-0 grow basis-full md:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)] lg:last:basis-[calc(66.667%-0.333rem)]">
              <div className="h-full rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                <h3 className="font-medium">{group.name}</h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-3 text-xs text-zinc-500">{projects.filter(p=>p.tech.some(tech=>(group.skills as readonly string[]).includes(tech))).slice(0,2).map(p=><Link className="inline-flex min-h-11 items-center underline underline-offset-4" key={p.slug} href={`/projects/${p.slug}`}>{p.title} ↗</Link>)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
