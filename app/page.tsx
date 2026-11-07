import { Hero } from "@/sections/hero";
import { About } from "@/sections/about";
import { Skills } from "@/sections/skills";
import { Projects } from "@/sections/projects";
import { ProblemSolving } from "@/sections/problem-solving";
import { AiExperience } from "@/sections/ai-experience";
import { Contact } from "@/sections/contact";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <ProblemSolving />
      <AiExperience />
      <Contact />
    </main>
  );
}
