import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github, ExternalLink } from "lucide-react";
import { projects } from "@/data/projects";
import { Container } from "@/components/container";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  return { title: project ? `${project.title} | Portfolio` : "Project" };
}

const labels = {
  overview: "프로젝트 소개",
  problem: "문제 정의",
  goal: "목표",
  architecture: "Architecture",
  erd: "ERD",
  api: "API 구조",
  process: "개발 과정",
  performance: "구조 개선",
  retrospective: "회고",
} as const;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  const detail = project.detail ?? {};
  const textSections = (Object.keys(labels) as Array<keyof typeof labels>).filter(
    (key) => detail[key],
  );

  return (
    <main>
      <Container className="py-12 sm:py-20">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> 프로젝트 목록
        </Link>
        <div className="mt-16 max-w-4xl">
          <p className="text-sm text-zinc-500">{project.period}</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
            {project.title}
          </h1>
          <p className="mt-5 text-xl text-zinc-600 dark:text-zinc-400">
            {project.subtitle}
          </p>
          <p className="mt-8 max-w-2xl leading-7 text-zinc-600 dark:text-zinc-400">
            {project.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {project.tech.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm text-white dark:bg-white dark:text-zinc-950"
              >
                <Github size={16} /> GitHub <ArrowUpRight size={14} />
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800"
              >
                <ExternalLink size={16} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </Container>
      <div className="border-y border-zinc-100 bg-zinc-50 py-20 dark:border-zinc-900 dark:bg-zinc-900/30">
        <Container className="max-w-4xl">
          <div className="space-y-16">
            {textSections.map((key) => (
              <section key={key}>
                <h2 className="text-sm font-medium text-zinc-500">{labels[key]}</h2>
                <p className="mt-4 max-w-3xl text-lg leading-8">{detail[key]}</p>
              </section>
            ))}
            {detail.features && (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">주요 기능</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detail.features.map((feature) => (
                    <li
                      key={feature}
                      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {detail.userFlow && (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">사용자 흐름</h2>
                <ol className="mt-4 space-y-3">
                  {detail.userFlow.map((item, index) => (
                    <li key={item} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <span className="font-mono text-sm text-zinc-400">{String(index + 1).padStart(2, "0")}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {detail.implementation && (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">구현에서 중요하게 다룬 부분</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detail.implementation.map((item) => (
                    <li key={item} className="rounded-xl border border-zinc-200 bg-white p-4 leading-7 dark:border-zinc-800 dark:bg-zinc-950">{item}</li>
                  ))}
                </ul>
              </section>
            )}
            {detail.troubleshooting && (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">문제 해결</h2>
                <div className="mt-4 space-y-4">
                  {detail.troubleshooting.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <h3 className="font-semibold">{item.title}</h3>
                      <dl className="mt-4 grid gap-4 text-sm leading-6 text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
                        <div>
                          <dt className="font-medium text-zinc-950 dark:text-white">문제</dt>
                          <dd>{item.problem}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-zinc-950 dark:text-white">해결</dt>
                          <dd>{item.solution}</dd>
                        </div>
                        {item.result && (
                          <div>
                            <dt className="font-medium text-zinc-950 dark:text-white">결과</dt>
                            <dd>{item.result}</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </Container>
      </div>
    </main>
  );
}
