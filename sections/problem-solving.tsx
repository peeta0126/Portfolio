import Link from "next/link";
import { Container } from "@/components/container";
import { getProblems } from "@/lib/portfolio";
import { selectHomeProblems } from "@/lib/presentation";

export async function ProblemSolving() {
  const items = selectHomeProblems(await getProblems());
  return <section id="problem-solving" className="border-y border-zinc-100 py-16 sm:py-20 dark:border-zinc-900"><Container>
    <p className="section-label">03 — Problem Solving</p>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><h2 className="text-3xl font-semibold tracking-tight">문제를 발견하고, 근거로 개선합니다.</h2><Link href="/problem-solving" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">전체 문제 해결 사례 보기 ↗</Link></div>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{items.map((item,index)=><article key={`${item.slug}-${item.title}`} className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 p-6 sm:p-7 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">0{index+1} / {item.project}</p>
      <h3 className="mt-3 text-xl font-semibold leading-7"><Link className="hover:underline underline-offset-4" href={`/projects/${item.slug}#problem-solving`}>{item.title} <span aria-hidden="true">↗</span></Link></h3>
      {(item.metric || item.title.includes("33.2")) && <div className="mt-4 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-900"><p className="font-mono text-sm">{item.metric ? `${item.metric.before} → ${item.metric.after} · ${item.metric.change}` : "15.39초 → 10.28초 · 약 33.2% 단축"}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.title.includes("33.2") ? "측정 당시 전후 각 6회 평균 · 현재 구조와 차이는 상세 참고" : "빌드 시 생성한 WOFF2 폰트 3종 합계 · 기존 측정 기록"}</p></div>}
      <dl className="my-5 space-y-4 text-sm leading-6">{[["Problem",item.problem,2],["Approach",item.solution,3],["Result",item.result,2]].map(([label,text,lines])=><div key={label} className="grid gap-1 sm:grid-cols-[74px_1fr] sm:gap-3"><dt className="font-medium">{label}</dt><dd className={`text-zinc-600 dark:text-zinc-400 ${lines===3?"line-clamp-3":"line-clamp-2"}`}>{text}</dd></div>)}</dl>
      <Link href={`/projects/${item.slug}#problem-solving`} className="mt-auto inline-flex min-h-11 items-center border-t border-zinc-100 pt-3 text-sm font-medium dark:border-zinc-800">과정과 검증 근거 자세히 보기 ↗</Link>
    </article>)}</div>
  </Container></section>;
}
