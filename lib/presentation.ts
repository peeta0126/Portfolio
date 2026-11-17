import type { Project, ProblemSolving } from "../types";

const featuredRepositories = ["peeta0126/tarot-card", "peeta0126/focus-hub", "peeta0126/augmentalkkagi"];
export function repositoryKey(project: Project) {
  try { const url = new URL(project.github ?? ""); if (url.hostname !== "github.com") return ""; return url.pathname.replace(/^\/|\/$/g, "").replace(/\.git$/, "").toLowerCase(); }
  catch { return ""; }
}

// Presentation only: the caller supplies the approved public snapshot.
export function groupProjects(projects: Project[]) {
  const featured = featuredRepositories.flatMap(repo => projects.filter(p => repositoryKey(p) === repo));
  const selected = new Set(featured.map(p => p.slug));
  return { featured, other: projects.filter(p => !selected.has(p.slug)) };
}

export function projectSummary(project: Project) {
  const metric = project.detail?.metrics?.[0];
  return metric ? `${metric.before} → ${metric.after} · ${metric.change}` : project.detail?.responsibilities?.slice(0,2).join(" · ") || project.detail?.roleSummary;
}

// Hide editorial placeholders only at the public presentation boundary.
export function publicPeriod(period: string) {
  return /확인|미정|미확정|unknown|pending/i.test(period) ? undefined : period.trim() || undefined;
}

export function selectHomeProblems(items: ProblemSolving[]) {
  const priorities = [
    (p: ProblemSolving) => p.title.includes("33.2"),
    (p: ProblemSolving) => p.project === "Focus Hub" && /인증|로그인|데이터/.test(p.title),
    (p: ProblemSolving) => /증강 알까기/.test(p.project) && /호스트|동기화/.test(p.title),
    (p: ProblemSolving) => /폰트/.test(p.title),
  ];
  return priorities.flatMap(matches => {
    const item = items.find(matches);
    return item ? [item] : [];
  });
}

export function collectProblems(projects: Project[], saved: {project_slug: string; content: ProblemSolving}[], baseline: Project[] = []) {
  return projects.flatMap(project => {
    const originals = saved.filter(s => s.project_slug === project.slug).map(s => ({...s.content, project: project.title, slug: project.slug, evidence: project.detail?.troubleshooting?.find(t=>t.title===s.content.title)?.evidence ?? s.content.evidence}));
    const seen = new Set(originals.map(p => p.title));
    const historical = originals.length ? new Set(baseline.find(p=>p.slug===project.slug)?.detail?.troubleshooting?.map(t=>t.title)) : new Set<string>();
    const added = (project.detail?.troubleshooting ?? []).filter(t => !seen.has(t.title) && !historical.has(t.title)).map(t => ({...t, project: project.title, slug: project.slug, result: t.result ?? ""}));
    return [...originals, ...added];
  }).map((item, index) => ({item, index})).sort((a,b) => {
    const rank = (p: typeof a.item) => {
      const repo = repositoryKey(projects.find(project => project.slug === p.slug)!);
      if (repo === featuredRepositories[0] && p.title.includes("33.2")) return 0;
      if (repo === featuredRepositories[1]) return 1;
      if (repo === featuredRepositories[2]) return 2;
      if (p.title.includes("폰트")) return 3;
      return 4;
    };
    return rank(a.item) - rank(b.item) || a.index - b.index;
  }).map(({item}) => item);
}
