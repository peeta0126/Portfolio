import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { Project } from "../../types";
import type { Settings } from "./schema";
export { mergeProposal } from "./content";

export type TreeFile = { path: string; sha: string; size?: number; type: string; mode?: string };
export function isSource(path: string) {
  return !/(^|\/)(node_modules|vendor|dist|build|coverage|\.git|\.next|\.godot|addons|Library|Temp|secrets?|credentials?|\.ssh|\.aws)(\/|$)/i.test(path) &&
    !/(^|\/)(\.env[^/]*|.*(?:secret|credential|private[-_]?key).*|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|bun\.lockb?|.*\.lock)$/i.test(path) &&
    !/\.(min\.js|map|pem|key|p12|svg|snap)$/i.test(path) &&
    /\.(tsx?|jsx?|m?js|cjs|json|py|gd|tscn|tres|cfg|cs|go|rs|java|rb|php|sql|prisma|toml|yaml|yml|md|godot|cpp|h|lua)$/i.test(path);
}
export function selectFiles(tree: TreeFile[]) {
  const group = (p:string) => /\.(tscn|tres)$/i.test(p) ? "scene" : /(^|\/)(tests?|__tests__)\//i.test(p) ? "test" : /\.md$/i.test(p) ? "doc" : /\.(json|toml|godot|prisma|yaml|yml)$/i.test(p) ? "config" : "code";
  const score = (p: string) => /(^|\/)(package\.json|project\.godot|Cargo\.toml|pyproject\.toml|schema\.prisma|README\.md)$/i.test(p) ? 100 :
    /core\/|network\/|game_manager|augment_manager|TEST_REPORT|NETWORK_ARCHITECTURE|GAME_DESIGN/i.test(p) ? 95 :
    /auth|api\/|server|schema|migration|route|page\.|player|battle|main\./i.test(p) ? 80 : /component|service|store|game/i.test(p) ? 60 : 20;
  // Large central modules are clipped by collect; dropping them entirely loses the architecture.
  const candidates=tree.filter(f => f.type === "blob" && f.mode !== "120000" && (f.size ?? 0) <= 150000 && isSource(f.path))
    .sort((a,b)=>score(b.path)-score(a.path)||a.path.localeCompare(b.path));
  const quotas:Record<string,number>={code:8,doc:4,test:3,config:2,scene:1};
  const used:Record<string,number>={};
  const selected=candidates.filter(f=>{const key=group(f.path);used[key]=(used[key]??0)+1;return used[key]<=quotas[key];}).slice(0,18);
  return [...selected,...candidates.filter(f=>!selected.includes(f))].slice(0,18);
}
// Ignore prose, presentation-only changes, and formatting when deciding whether to pay for another analysis.
export function meaningfulHash(files: { path: string; content: string }[]) {
  return createHash("sha256").update(JSON.stringify(files.filter(f => !/\.(md|css|scss)$/i.test(f.path)).map(f => ({
    path: f.path, content: f.content.replace(/\s+/g, " ").trim(),
  })).sort((a,b) => a.path.localeCompare(b.path)))).digest("hex");
}
export function eligible(repo: { name: string; fork: boolean; archived: boolean; private: boolean }, settings: Settings) {
  return !repo.private && (!repo.fork || settings.includeForks) && (!repo.archived || settings.includeArchived) &&
    !settings.excludedPattern.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).some(s => repo.name.toLowerCase().includes(s));
}
export function editedFields(previous: Project, next: Project) {
  const changed: string[] = [];
  for (const key of new Set([...Object.keys(previous),...Object.keys(next)]) as Set<keyof Project>) {
    if (key === "detail") {
      for (const detailKey of new Set([...Object.keys(previous.detail ?? {}), ...Object.keys(next.detail ?? {})])) {
        if (!isDeepStrictEqual(previous.detail?.[detailKey as keyof typeof previous.detail],next.detail?.[detailKey as keyof typeof next.detail])) changed.push(`detail.${detailKey}`);
      }
    } else if (!isDeepStrictEqual(previous[key],next[key])) changed.push(key);
  }
  return changed;
}
export function redact(content: string) {
  return content.replace(/(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]+|AKIA[A-Z0-9]{16})/g, "[REDACTED]")
    .replace(/((?:api[_-]?key|password|secret|token)\s*[:=]\s*)["'][^"'\n]+["']/gi, '$1"[REDACTED]"');
}
