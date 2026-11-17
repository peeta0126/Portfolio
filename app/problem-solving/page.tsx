import Link from "next/link";
import { Container } from "@/components/container";
import { getProblems } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export const metadata = { title: "문제 해결 사례 | 이민석 포트폴리오" };

export default async function ProblemSolvingPage() {
  const items = await getProblems();
  return <main id="main-content"><Container className="max-w-4xl py-12 sm:py-20">
    <Link href="/#problem-solving" className="inline-flex min-h-11 items-center text-sm text-zinc-500">← 메인으로 돌아가기</Link>
    <h1 className="mt-8 text-4xl font-semibold tracking-tight">문제 해결 기록</h1>
    <p className="mt-4 text-zinc-600 dark:text-zinc-400">성능 개선부터 UI와 회귀 테스트까지, 프로젝트에서 확인한 사례입니다.</p>
    <div className="mt-10 space-y-6">{items.map(item=><article key={`${item.slug}-${item.title}`} className="rounded-2xl border border-zinc-200 p-6 sm:p-8 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{item.project}</p><h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
      <dl className="mt-5 space-y-4 text-sm leading-7">{[["Problem",item.problem],["Approach",item.solution],["Result",item.result]].map(([label,text])=><div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 text-zinc-600 dark:text-zinc-400">{text}</dd></div>)}</dl>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm"><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/projects/${item.slug}#problem-solving`}>프로젝트 상세 보기 ↗</Link>{item.evidence?.map(ref=><a key={ref.url} className="inline-flex min-h-11 items-center underline underline-offset-4" href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} ↗</a>)}</div>
    </article>)}</div>
  </Container></main>;
}
