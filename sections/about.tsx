import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { profile } from "@/data/profile";

export function About() {
  const paragraphs = profile.about.split("\n").filter(Boolean);

  return (
    <section id="about" className="border-y border-zinc-100 py-14 sm:py-16 dark:border-zinc-900">
      <Container className="grid gap-8 md:grid-cols-[180px_1fr]">
        <div>
          <p className="section-label">01 — About</p>
          <h2 className="mt-5 text-base font-semibold leading-7">{profile.education}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{profile.educationPeriod}</p>
          <p className="mt-4 text-sm leading-6 text-zinc-500">프론트엔드 · 웹개발<br/>AI 활용 구현과 UI 개선</p>
        </div>
        <Reveal>
          <div className="about-copy space-y-5 text-zinc-600 dark:text-zinc-400">
            <p className="text-xl font-medium leading-8 tracking-tight text-zinc-950 dark:text-zinc-100">직접 사용하고 검증하며, 더 나은 사용 경험을 만듭니다.</p>
            {paragraphs.map((paragraph, index) => <div key={index}><h3 className="mb-1 text-xs font-semibold text-zinc-950 dark:text-zinc-100">{index === 0 ? "개발을 시작한 계기" : "개발하는 방식"}</h3><p>{paragraph}</p></div>)}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
