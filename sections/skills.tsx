import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { skillGroups } from "@/data/skills";

export function Skills() {
  return (
    <section className="py-24">
      <Container>
        <p className="section-label">02 — Tech Stack</p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
          {skillGroups.map((group, i) => (
            <Reveal key={group.name} delay={i * 0.04}>
              <div className="min-h-44 bg-white p-6 dark:bg-zinc-950">
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
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
