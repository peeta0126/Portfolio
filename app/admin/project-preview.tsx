import type { Project } from "@/types";

export function ProjectPreview({project}:{project:Project}) {
  const detail=project.detail??{};
  return <div className="space-y-6 break-words text-sm leading-7">
    <div><p className="text-xs text-zinc-500">{project.kind} · {project.period}</p><h3 className="mt-2 text-2xl font-semibold">{project.title}</h3><p>{project.subtitle}</p><p className="mt-3">{project.description}</p></div>
    {[["프로젝트 소개",detail.overview],["기획 배경",detail.problem],["개발 목표",detail.goal],["담당 역할",detail.roleSummary],["기술 구조",detail.architecture],["개발 결과",detail.result],["회고",detail.retrospective]].map(([title,text])=>text?<section key={title}><h4 className="font-semibold">{title}</h4><p className="mt-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{text}</p></section>:null)}
    {[["핵심 기능",detail.features],["핵심 구현",detail.implementation],["남은 과제",detail.limitations]].map(([title,items])=>Array.isArray(items)&&items.length?<section key={String(title)}><h4 className="font-semibold">{title}</h4><ul className="mt-2 list-disc space-y-2 pl-5">{items.map(text=><li key={text}>{text}</li>)}</ul></section>:null)}
    {detail.architectureLayers?.length?<ol aria-label="기술 구조 흐름" className="grid gap-3 sm:grid-cols-2">{detail.architectureLayers.map(layer=><li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" key={layer.name}><strong>{layer.name}</strong><p>{layer.items.join(" · ")}</p></li>)}</ol>:null}
    {detail.troubleshooting?.map(item=><section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" key={item.title}><h4 className="font-semibold">{item.title}</h4><dl className="mt-3 space-y-3">{[["Problem",item.problem],["Approach",item.solution],["Result",item.result]].map(([label,text])=><div key={label}><dt className="font-medium">{label}</dt><dd>{text}</dd></div>)}</dl></section>)}
  </div>;
}
