import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { profile } from "@/data/profile";

export function About() {
  const paragraphs = profile.about.split("\n").filter(Boolean);

  return (
    <section id="about" className="border-y border-zinc-100 py-24 sm:py-32 dark:border-zinc-900">
      <Container className="grid gap-8 md:grid-cols-[180px_1fr]">
        <div>
          <p className="section-label">01 — About</p>
          <span className="mt-4 block h-px w-10 bg-zinc-300 dark:bg-zinc-700" />
        </div>
        <Reveal>
          <div className="about-copy space-y-7 text-zinc-800 dark:text-zinc-200">
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
