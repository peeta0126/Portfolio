import "server-only";
import { z } from "zod";
import { isSource, redact, selectFiles, type TreeFile } from "./core";

export class ServiceError extends Error {
  constructor(public code: string, public retryAfter = 60) { super(code); }
}
export async function requestJson(url: string, init: RequestInit, attempts = 3): Promise<unknown> {
  for (let i = 0; i < attempts; i++) {
    let response: Response;
    try { response = await fetch(url, { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(18000) }); }
    catch { if (i === attempts - 1) throw new ServiceError("NETWORK_ERROR"); await new Promise(r => setTimeout(r, 300 * 2 ** i)); continue; }
    if (response.ok) return response.json();
    const retryAfter=Number(response.headers.get("retry-after"));
    const reset=Number(response.headers.get("x-ratelimit-reset"))-Date.now()/1000;
    const wait = retryAfter>0 ? retryAfter : Number.isFinite(reset) && reset>0 ? Math.max(60,reset) : 60;
    if (response.status === 429 || response.status === 403 && (response.headers.get("x-ratelimit-remaining") === "0" || retryAfter>0)) throw new ServiceError("RATE_LIMIT", Math.min(wait, 86400));
    if (response.status < 500 || i === attempts - 1) throw new ServiceError(`HTTP_${response.status}`);
    await new Promise(r => setTimeout(r, 300 * 2 ** i));
  }
  throw new ServiceError("REQUEST_FAILED");
}
export function owner() {
  const value = process.env.GITHUB_OWNER || "peeta0126";
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(value)) throw new Error("INVALID_GITHUB_OWNER");
  return value;
}
export async function github(path: string) {
  if (!path.startsWith("/") || path.includes("..")) throw new Error("INVALID_GITHUB_PATH");
  return requestJson(`https://api.github.com${path}`, { headers: {
    Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  } });
}
export const repoSchema = z.object({ id: z.number().int().positive(), name: z.string(), full_name: z.string(),
  private: z.boolean(), fork: z.boolean(), archived: z.boolean(), description: z.string().nullable(),
  html_url: z.string().url().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+$/), homepage: z.string().nullable(), default_branch: z.string(),
  created_at: z.string(), updated_at: z.string(), pushed_at: z.string().nullable(), language: z.string().nullable(), topics: z.array(z.string()).default([]),
});
export type Repository = z.infer<typeof repoSchema>;
export async function repositoryPage(page: number) {
  return z.array(repoSchema).parse(await github(`/users/${owner()}/repos?type=owner&sort=full_name&per_page=100&page=${page}`));
}
export async function collect(repo: Repository, previousManifest: {path:string;sha:string}[] = []) {
  const base = `/repos/${repo.full_name.split("/").map(encodeURIComponent).join("/")}`;
  if (repo.full_name.split("/")[0].toLowerCase() !== owner().toLowerCase()) throw new Error("REPO_OWNER_MISMATCH");
  const commit = z.object({ sha: z.string(), commit: z.object({ tree: z.object({ sha: z.string() }) }) }).parse(await github(`${base}/commits/${encodeURIComponent(repo.default_branch)}`));
  const tree = z.object({ truncated: z.boolean(), tree: z.array(z.object({ path: z.string(), sha: z.string(), type: z.string(), mode: z.string(), size: z.number().optional() })) }).parse(await github(`${base}/git/trees/${commit.commit.tree.sha}?recursive=1`));
  if (tree.truncated) throw new ServiceError("TREE_TOO_LARGE_REVIEW_REQUIRED", 86400);
  const manifest=tree.tree.filter(f=>f.type==="blob" && f.mode!=="120000" && isSource(f.path) && !/\.md$/i.test(f.path)).map(f=>({path:f.path,sha:f.sha})).sort((a,b)=>a.path.localeCompare(b.path));
  if (previousManifest.length && JSON.stringify(manifest)===JSON.stringify(previousManifest)) {
    return {sha:commit.sha,files:[],tree:[],commits:[],prs:[],languages:{},images:[],manifest,unchanged:true};
  }
  const old=new Map(previousManifest.map(f=>[f.path,f.sha]));
  const changed=tree.tree.filter(f=>previousManifest.length && old.get(f.path)!==f.sha && !/\.md$/i.test(f.path));
  const priority=selectFiles(changed as TreeFile[]).slice(0,8);
  const selected=[...priority,...selectFiles(tree.tree as TreeFile[]).filter(f=>!priority.some(c=>c.path===f.path))].slice(0,18);
  const files: { path: string; content: string; sha: string }[] = [];
  let remaining = 65000;
  // Small sequential batches limit API bursts and total source payload.
  for (let start = 0; start < selected.length && remaining > 0; start += 4) {
    const batch = await Promise.all(selected.slice(start, start + 4).map(async file => {
      const blob = z.object({ content: z.string(), encoding: z.literal("base64") }).parse(await github(`${base}/git/blobs/${file.sha}`));
      return { path: file.path, sha: file.sha, content: redact(Buffer.from(blob.content, "base64").toString("utf8")).slice(0, 10000) };
    }));
    for (const f of batch) { if (remaining <= 0) break; const content = f.content.slice(0, remaining); remaining -= content.length; files.push({ ...f, content }); }
  }
  if (!files.some(f => !/\.(md|json|yaml|yml|toml)$/i.test(f.path))) throw new ServiceError("INSUFFICIENT_SOURCE", 86400);
  const [commits, prs, languages] = await Promise.allSettled([
    github(`${base}/commits?per_page=10`), github(`${base}/pulls?state=closed&per_page=5`), github(`${base}/languages`),
  ]);
  const records = (value: PromiseSettledResult<unknown>, type: "commit" | "pr") => {
    if (value.status !== "fulfilled" || !Array.isArray(value.value)) return [];
    return value.value.slice(0,10).map(v => type === "commit" ? { id: String(v.sha), message: redact(String(v.commit?.message ?? "")).slice(0,2000) } : { id: `pr:${v.number}`, title: redact(String(v.title)), body: redact(String(v.body ?? "")).slice(0,2500) });
  };
  const images = tree.tree.filter(f => /\.(png|webp|jpg|jpeg)$/i.test(f.path) && /screen|preview|cover|hero/i.test(f.path)).slice(0,10).map(f => `https://raw.githubusercontent.com/${repo.full_name}/${commit.sha}/${f.path.split("/").map(encodeURIComponent).join("/")}`);
  return { sha: commit.sha, files, tree: tree.tree.map(f => f.path).slice(0,1500), commits: records(commits,"commit"), prs: records(prs,"pr"), languages: languages.status === "fulfilled" ? languages.value : {}, images,manifest,unchanged:false };
}
