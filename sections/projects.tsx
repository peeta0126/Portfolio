import { Container } from "@/components/container";
import { ProjectCard } from "@/components/project-card";
import { getProjects } from "@/lib/portfolio";
import { groupProjects } from "@/lib/presentation";

export async function Projects() {
  const { featured, other } = groupProjects(await getProjects());
  return <section id="projects" className="py-16 sm:py-20">
    <Container>
      <p className="section-label">02 — Selected work</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">직접 만들고 개선한 프로젝트</h2>
        <p className="text-sm text-zinc-500">기획 · 구현 · 테스트 · 개선</p>
      </div>
      {featured.length > 0 && <div className="mt-12">
        <h3 className="mb-6 text-sm font-medium">Featured Projects <span className="ml-2 text-zinc-500">{featured.length}</span></h3>
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">{featured.map(project => <ProjectCard key={project.slug} project={project} />)}</div>
      </div>}
      {other.length > 0 && <div id="other-projects" className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h3 className="mb-6 text-xl font-semibold">Other Projects <span className="ml-2 text-sm font-normal text-zinc-500">{other.length}</span></h3>
        <div className="grid items-stretch gap-5 md:grid-cols-2">{other.map(project => <ProjectCard key={project.slug} project={project} compact />)}</div>
      </div>}
      {!featured.length && !other.length && <p className="mt-10 text-zinc-600 dark:text-zinc-400">지금은 프로젝트를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.</p>}
    </Container>
  </section>;
}
