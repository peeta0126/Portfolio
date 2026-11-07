import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUpRight, ExternalLink, Github } from "lucide-react";
import { getProjects } from "@/lib/portfolio";
import { Container } from "@/components/container";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((item) => item.slug === slug);

  return {
    title: project ? `${project.title} | 이민석 포트폴리오` : "Project",
    description: project?.description,
  };
}

function TextSection({ title, children }: { title: string; children?: string }) {
  if (!children) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
      <p className="mt-4 max-w-3xl text-lg leading-8">{children}</p>
    </section>
  );
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-zinc-200 bg-white p-4 leading-7 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  const detail = project.detail ?? {};

  return (
    <main>
      <Container className="py-12 sm:py-20">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
        >
          <ArrowLeft aria-hidden="true" size={16} /> 프로젝트 목록
        </Link>
        <div className="mt-16 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium uppercase tracking-[.12em] dark:border-zinc-800">
              {project.kind}
            </span>
            <span>{project.period}</span>
          </div>
          <h1 className="mt-5 break-words text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
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
                aria-label={`${project.title} GitHub 저장소 열기`}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm text-white dark:bg-white dark:text-zinc-950"
              >
                <Github aria-hidden="true" size={16} /> GitHub <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} 라이브 데모 열기`}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800"
              >
                <ExternalLink aria-hidden="true" size={16} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </Container>

      <div className="border-y border-zinc-100 bg-zinc-50 py-20 dark:border-zinc-900 dark:bg-zinc-900/30">
        <Container className="max-w-4xl">
          <div className="space-y-16">
            <TextSection title="프로젝트 소개">{detail.overview}</TextSection>

            {detail.contributionNote && (
              <aside className="rounded-2xl border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-zinc-500">
                  Contribution Scope
                </p>
                <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                  {detail.contributionNote}
                </p>
              </aside>
            )}

            {detail.gallery?.length ? (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">프로젝트 화면</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {detail.gallery.map((image, index) => (
                    <figure
                      key={image.src}
                      className={index === 0 ? "sm:col-span-2" : undefined}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
                        <Image
                          unoptimized={image.src.startsWith("https:") || image.src.startsWith("/api/")}
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes={index === 0 ? "(min-width: 1024px) 896px, 100vw" : "(min-width: 640px) 448px, 100vw"}
                          className="object-cover"
                          priority={index === 0}
                        />
                      </div>
                      <figcaption className="mt-2 text-sm text-zinc-500">
                        {image.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            <TextSection title="문제 정의">{detail.problem}</TextSection>
            <TextSection title="목표">{detail.goal}</TextSection>
            <TextSection title="담당 역할">{detail.roleSummary}</TextSection>
            <ListSection title="내가 담당한 작업" items={detail.responsibilities} />

            {(detail.architecture || detail.architectureLayers?.length) && (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">기술 구조</h2>
                {detail.architecture && (
                  <p className="mt-4 max-w-3xl text-lg leading-8">{detail.architecture}</p>
                )}
                {detail.architectureLayers?.length ? (
                  <div className="mt-6 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
                    {detail.architectureLayers.map((layer, index) => (
                      <div key={layer.name} className="contents">
                        <div className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
                          <h3 className="font-semibold">{layer.name}</h3>
                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {layer.items.join(" · ")}
                          </p>
                        </div>
                        {index < detail.architectureLayers!.length - 1 && (
                          <ArrowDown
                            aria-hidden="true"
                            size={16}
                            className="mx-auto shrink-0 text-zinc-400 lg:-rotate-90"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            <ListSection title="프로젝트 전체 기능" items={detail.features} />
            <ListSection title="핵심 구현" items={detail.implementation} />
            <ListSection title="Git 협업" items={detail.collaboration} />

            {detail.userFlow?.length ? (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">사용자 흐름</h2>
                <ol className="mt-4 space-y-3">
                  {detail.userFlow.map((item, index) => (
                    <li
                      key={item}
                      className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <span className="font-mono text-sm text-zinc-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <TextSection title="API 구조">{detail.api}</TextSection>
            <TextSection title="개발 과정">{detail.process}</TextSection>
            <TextSection title="구조 개선">{detail.performance}</TextSection>

            {detail.metrics?.length ? (
              <section>
                <h2 className="text-sm font-medium text-zinc-500">검증한 결과</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {detail.metrics.map((metric) => (
                    <article
                      key={metric.label}
                      className="rounded-2xl bg-zinc-950 p-6 text-white dark:bg-white dark:text-zinc-950"
                    >
                      <p className="text-xs uppercase tracking-[.14em] text-zinc-400">
                        {metric.label}
                      </p>
                      <div className="mt-5 flex items-end gap-3">
                        <div>
                          <p className="text-xs text-zinc-400">Before</p>
                          <p className="mt-1 font-mono text-xl">{metric.before}</p>
                        </div>
                        <span aria-hidden="true" className="pb-1 text-zinc-500">→</span>
                        <div>
                          <p className="text-xs text-zinc-400">After</p>
                          <p className="mt-1 font-mono text-2xl font-semibold">{metric.after}</p>
                        </div>
                        <strong className="ml-auto text-2xl">{metric.change}</strong>
                      </div>
                      <p className="mt-5 text-xs leading-5 text-zinc-400">{metric.evidence}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {detail.troubleshooting?.length ? (
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
                          <dt className="font-medium text-zinc-950 dark:text-white">Problem</dt>
                          <dd>{item.problem}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-zinc-950 dark:text-white">Approach</dt>
                          <dd>{item.solution}</dd>
                        </div>
                        {item.result && (
                          <div>
                            <dt className="font-medium text-zinc-950 dark:text-white">Result</dt>
                            <dd>{item.result}</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <TextSection title="결과">{detail.result}</TextSection>
            <TextSection title="회고">{detail.retrospective}</TextSection>
          </div>
        </Container>
      </div>
    </main>
  );
}
