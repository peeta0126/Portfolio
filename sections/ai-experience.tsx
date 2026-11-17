import { Check } from "lucide-react";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { aiExperience } from "@/data/ai-experience";

const principles = [
  "요구사항과 변경 범위를 먼저 정의",
  "유지해야 하는 기존 로직 명시",
  "코드와 실행 결과로 제안 검증",
  "문제의 원인을 확인한 뒤 수정",
];

export function AiExperience() {
  return (
    <section id="ai-experience" className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="section-label">05 — AI-Assisted Workflow</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            빠르게 탐색하되, 최종 판단과 검증은 직접 합니다.
          </h2>
        </div>
        <div className="workflow mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {aiExperience.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <article className="relative h-full border-t border-zinc-300 pt-5 dark:border-zinc-700">
                <p className="flex items-center justify-between font-mono text-xs text-zinc-500">
                  {String(index + 1).padStart(2, "0")}
                  {index < aiExperience.length - 1 && <span aria-hidden="true">→</span>}
                </p>
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-zinc-600 dark:text-zinc-400">Focus Hub의 UI 요구사항 정리 → 별빛 타로의 API 흐름 검토 → 증강 알까기의 반복 플레이 테스트. AI는 구현을 돕고, 기획과 최종 검증은 직접 진행했습니다.</p>
        <ul className="mt-8 grid gap-3 rounded-2xl border border-zinc-200 p-6 sm:grid-cols-2 dark:border-zinc-800">
          {principles.map((principle) => (
            <li key={principle} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <Check aria-hidden="true" size={15} className="shrink-0 text-zinc-950 dark:text-white" />
              {principle}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
