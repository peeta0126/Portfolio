import { Container } from "@/components/container";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/data/projects";

export function Projects() {
  const featured = projects.filter((project) => project.featured);

  return (
    <section id="projects" className="py-24">
      <Container>
        <div className="flex items-end justify-between">
          <p className="section-label">03 — Projects</p>
          <span className="text-sm text-zinc-500">프로젝트 {featured.length}개</span>
        </div>
        <div
          className={
            featured.length === 1
              ? "mt-12 max-w-3xl"
              : "mt-12 grid gap-5 md:grid-cols-2"
          }
        >
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </section>
  );
}
