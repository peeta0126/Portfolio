import { Container } from "@/components/container";
import { getProblems } from "@/lib/portfolio";

export async function ProblemSolving() {
  const problemSolving = await getProblems();
  return (
    <section
      id="problem-solving"
      className="border-y border-zinc-100 py-24 dark:border-zinc-900"
    >
      <Container>
        <p className="section-label">04 — Problem Solving</p>
        <div className="mt-12 border-l border-zinc-200 dark:border-zinc-800">
          {problemSolving.map((item, index) => (
            <article
              key={item.title}
              className="relative ml-6 border-b border-zinc-100 py-9 last:border-0 dark:border-zinc-900"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[29px] top-11 h-3 w-3 rounded-full border-2 border-white bg-zinc-950 dark:border-zinc-950 dark:bg-white"
              />
              <p className="text-sm text-zinc-500">
                {String(index + 1).padStart(2, "0")} · {item.project}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              {item.metric && (
                <div className="mt-5 flex max-w-lg items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div>
                    <p className="text-xs text-zinc-500">Before</p>
                    <p className="mt-1 font-mono text-lg">{item.metric.before}</p>
                  </div>
                  <span aria-hidden="true" className="text-zinc-400">→</span>
                  <div>
                    <p className="text-xs text-zinc-500">After</p>
                    <p className="mt-1 font-mono text-lg">{item.metric.after}</p>
                  </div>
                  <strong className="ml-auto text-lg">{item.metric.change}</strong>
                </div>
              )}
              <div className="mt-6 grid gap-5 text-sm leading-6 text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
                <p>
                  <b className="mb-1 block text-zinc-950 dark:text-zinc-100">Problem</b>
                  {item.problem}
                </p>
                <p>
                  <b className="mb-1 block text-zinc-950 dark:text-zinc-100">Approach</b>
                  {item.solution}
                </p>
                <p>
                  <b className="mb-1 block text-zinc-950 dark:text-zinc-100">Result</b>
                  {item.result}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
