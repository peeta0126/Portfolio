import Image from "next/image";
import type { Project, ProjectMetric } from "@/types";

function Text({ title, text }: { title: string; text?: string }) {
  return text ? <section><h2 className="detail-heading">{title}</h2><p className="mt-4 whitespace-pre-line leading-8 text-zinc-700 dark:text-zinc-300">{text}</p></section> : null;
}
function List({title, items}: {title: string; items?: string[]}) {
  return items?.length ? <section><h2 className="detail-heading">{title}</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(item=><li key={item} className="rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-7 dark:border-zinc-800 dark:bg-zinc-950">{item}</li>)}</ul></section> : null;
}
function Metric({ metric }: {metric: ProjectMetric}) {
  const before = Number.parseFloat(metric.before.replace(/,/g,""));
  const after = Number.parseFloat(metric.after.replace(/,/g,""));
  const maximum = Math.max(before, after);
  const chartable = before > 0 && after >= 0 && Number.isFinite(maximum);
  return <figure className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
    <figcaption className="font-medium">{metric.label}</figcaption>
    <p className="mt-4 text-3xl font-semibold tracking-tight">{metric.change}</p>
    <dl className="mt-6 space-y-4">{[["Before",metric.before,before],["After",metric.after,after]].map(([label,value,number])=><div key={label}><div className="flex flex-wrap justify-between gap-2 text-sm"><dt className="text-zinc-500">{label}</dt><dd className="font-mono">{value}</dd></div>{chartable && <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-zinc-700 dark:bg-zinc-300" style={{width:`${Number(number)/maximum*100}%`}}/></div>}</div>)}</dl>
    <p className="mt-5 text-xs leading-6 text-zinc-600 dark:text-zinc-400">{metric.evidence}</p>
  </figure>;
}

export function ProjectDetailContent({project}:{project:Project}) {
  const d=project.detail??{};
  return <div className="space-y-12">
    {d.gallery?.length ? <section><h2 className="detail-heading">실제 서비스 화면</h2><div className="mt-5 grid gap-6 sm:grid-cols-2">{d.gallery.map((image,index)=><figure key={image.src} className={index===0?"sm:col-span-2":undefined}><a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`${image.alt} 원본 보기`} className="relative block aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"><Image src={image.src} alt={image.alt} fill unoptimized={image.src.startsWith("https:")||image.src.startsWith("/api/")} sizes={index===0?"(min-width: 1024px) 896px, 100vw":"(min-width: 640px) 448px, 100vw"} className="object-contain" priority={index===0}/></a><figcaption className="mt-3 text-sm leading-6 text-zinc-500">{image.caption} · 원본 보기 ↗</figcaption></figure>)}</div></section>:null}
    <List title="핵심 기능" items={d.features}/>
    <Text title="기획 배경 및 문제 정의" text={d.problem}/>
    <Text title="목표" text={d.goal}/>
    <Text title="본인 담당 역할" text={d.roleSummary}/>
    {d.contributionNote && <aside className="rounded-xl border-l-2 border-zinc-800 bg-white p-6 text-sm leading-7 dark:border-zinc-200 dark:bg-zinc-950"><h3 className="mb-2 font-semibold">기여 범위</h3>{d.contributionNote}</aside>}
    <List title="담당 작업" items={d.responsibilities}/>
    {(d.architecture || d.architectureLayers?.length) && <section><h2 className="detail-heading">기술 구조</h2>{d.architecture && <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">{d.architecture}</p>}{d.architectureLayers?.length ? <ol className="architecture-flow mt-6 flex flex-col gap-7 sm:flex-row">{d.architectureLayers.map((layer,index)=><li key={layer.name} className="relative flex-1 min-w-0 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><span className="font-mono text-xs text-zinc-500">0{index+1}</span><h3 className="mt-2 font-medium">{layer.name}</h3><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{layer.items.join(" · ")}</p></li>)}</ol>:null}</section>}
    <Text title="데이터 구조" text={d.erd}/>
    <Text title="API 구조" text={d.api}/>
    <List title="핵심 구현 과정" items={d.implementation}/>
    <Text title="개발 과정" text={d.process}/>
    <List title="협업 과정" items={d.collaboration}/>
    {d.userFlow?.length ? <section><h2 className="detail-heading">사용자 흐름</h2><ol className="mt-5 space-y-3">{d.userFlow.map((step,index)=><li className="flex gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" key={step}><span className="font-mono text-sm text-zinc-500">0{index+1}</span><span className="text-sm leading-7">{step}</span></li>)}</ol></section>:null}
    {d.troubleshooting?.length ? <section id="problem-solving"><h2 className="detail-heading">문제 해결 사례</h2><div className="mt-5 space-y-5">{d.troubleshooting.map(item=><article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950"><h3 className="text-xl font-semibold tracking-tight">{item.title}</h3><dl className="mt-6 space-y-5">{[["Problem",item.problem],["Approach",item.solution],["Result",item.result]].map(([label,text])=>text?<div key={label} className="grid gap-2 sm:grid-cols-[90px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt><dd className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{text}</dd></div>:null)}{item.evidence?.length ? <div className="grid gap-2 sm:grid-cols-[90px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Evidence</dt><dd><ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm">{item.evidence.map(ref=><li key={ref.url}><a className="underline underline-offset-4" href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} ↗</a></li>)}</ul></dd></div>:null}</dl></article>)}</div></section>:null}
    {d.metrics?.length ? <section id="verification"><h2 className="detail-heading">검증 결과</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{d.metrics.map(metric=><Metric key={metric.label} metric={metric}/>)}</div></section>:null}
    <Text title="검증 및 구조 개선" text={d.performance}/>
    <Text title="프로젝트 결과" text={d.result}/>
    <List title="한계 및 남은 과제" items={d.limitations}/>
    <Text title="회고" text={d.retrospective}/>
    {(project.github||project.demo) && <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800"><h2 className="detail-heading">프로젝트 직접 살펴보기</h2><div className="mt-4 flex flex-wrap gap-5 text-sm">{project.github && <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={project.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}{project.demo && <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={project.demo} target="_blank" rel="noopener noreferrer">Live Demo ↗</a>}</div></section>}
  </div>;
}
