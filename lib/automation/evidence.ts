import { generatedSchema, type Generated } from "./schema";

export type EvidenceSource = {
  sha: string;
  files: { path: string; sha: string; content: string }[];
  commits: { id: string }[];
  prs: { id: string }[];
  tree: string[];
};
export type EvidenceIssue = { field: string; reference: string; reason: string };
export type EvidenceDiagnostics = {
  commit: string;
  analyzedFiles: { path: string; sha: string }[];
  allowed: string[];
  submitted: { field: string; references: string[] }[];
  issues: EvidenceIssue[];
};

export function allowedEvidence(source: EvidenceSource) {
  return [...source.files.map(f => f.path), ...source.commits.map(c => c.id), ...source.prs.map(p => p.id)];
}

// Never resolve basenames, case changes, repository prefixes, URLs or traversal.
// Only presentation aliases with an unambiguous supplied file are accepted.
export function validateEvidence(generated: Generated, source: EvidenceSource) {
  const allowed = allowedEvidence(source);
  const exact = new Set(allowed);
  const history = new Set([...source.commits, ...source.prs].map(item => item.id));
  const diagnostics: EvidenceDiagnostics = {
    commit: source.sha, analyzedFiles: source.files.map(({ path, sha }) => ({ path, sha })),
    allowed, submitted: [], issues: [],
  };
  function resolve(reference: string): string | undefined {
    if (exact.has(reference)) return reference;
    const path = reference.trim().replace(/\\/g, "/").replace(/^(\.\/)+/, "");
    const match = /^(.*?)(?::(?:L)?(\d+)(?:-(?:L)?(\d+))?|#L(\d+)(?:-L(\d+))?)$/.exec(path);
    const file = source.files.find(f => f.path === (match?.[1] ?? path));
    if (!file) return undefined;
    if (match) {
      const start = Number(match[2] ?? match[4]);
      const end = Number(match[3] ?? match[5] ?? start);
      if (start < 1 || end < start || end > file.content.split("\n").length) return undefined;
      // Keep line ranges so downstream reviewers do not lose citation precision.
      return `${file.path}#L${start}${end === start ? "" : `-L${end}`}`;
    }
    return file.path;
  }
  function check(refs: string[], field: string) {
    diagnostics.submitted.push({ field, references: refs });
    return refs.map(reference => {
      const resolved = resolve(reference);
      if (!resolved) diagnostics.issues.push({ field, reference, reason: source.tree.includes(reference) ? "FILE_NOT_ANALYZED" : "UNKNOWN_OR_INVALID_REFERENCE" });
      return resolved;
    });
  }
  const evidence = generated.evidence.map((item, i) => ({ ...item, sources: check(item.sources, `evidence.${i}.sources`) }));
  const basicInvalid = evidence.some(item => item.sources.some(ref => ref === undefined));
  const troubleshooting = generated.troubleshooting.flatMap((item, i) => {
    const field = `troubleshooting.${i}.evidence`;
    const refs = check(item.evidence, field);
    // Code demonstrates implementation, but cannot by itself establish a past problem/approach/result.
    const hasHistory = refs.some(ref => ref !== undefined && history.has(ref));
    if (!hasHistory || [item.title, item.problem, item.solution, item.result].some(value => !value.trim())) {
      diagnostics.issues.push({ field, reference: "", reason: "INSUFFICIENT_PROBLEM_SOLVING_EVIDENCE" });
    }
    if (!hasHistory || refs.some(ref => ref === undefined) || [item.title, item.problem, item.solution, item.result].some(value => !value.trim())) return [];
    return [{ ...item, evidence: refs as string[] }];
  });
  const dropped = troubleshooting.length !== generated.troubleshooting.length;
  return {
    basicInvalid, diagnostics,
    generated: generatedSchema.parse({ ...generated, evidence: evidence.map((item, i) => ({ ...item, sources: item.sources.map((ref, j) => ref ?? generated.evidence[i].sources[j]) })), troubleshooting,
      reviewNotes: dropped ? [...generated.reviewNotes.slice(0, 14), "근거가 부족하거나 유효하지 않은 Problem Solving 항목을 제외했습니다. 이력 근거의 문제·접근·결과를 검토하세요."] : generated.reviewNotes,
    // Invalid basic evidence is never returned to the publisher. Keep parsing separate from reference validation.
    }),
  };
}
