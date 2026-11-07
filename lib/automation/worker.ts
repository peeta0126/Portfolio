import "server-only";
import { randomUUID } from "node:crypto";
import { db, enqueue, log, settings } from "./db";
import { collect, github, owner, repoSchema, repositoryPage, ServiceError, type Repository } from "./github";
import { eligible, meaningfulHash, mergeProposal } from "./core";
import { safeUrl } from "./schema";
import { analyze, EvidenceError } from "./ai";
import type { EvidenceDiagnostics } from "./evidence";
import { snapshot } from "./publish";
import type { Project } from "../../types";
import { rewriteDescription } from "./drafts";

async function discover(payload: { page?: number; seen?: number[]; run?: string }) {
  const page = payload.page ?? 1, run = payload.run ?? randomUUID();
  const repositories = await repositoryPage(page);
  const config = await settings();
  for (const repo of repositories) {
    if (repo.private) continue;
    const [current] = await db()`select * from projects where github_repo_id=${repo.id}
      or (github_repo_id is null and lower(content->>'github')=lower(${repo.html_url})) limit 1`;
    const content: Project = { slug:`github-${repo.id}`, title:repo.name, subtitle:repo.description ?? "", description:repo.description ?? "",
      period:"기간 확인 필요", kind:"Project", tech:repo.language ? [repo.language] : [], github:repo.html_url,
      demo: safeUrl.safeParse(repo.homepage ?? "").success ? repo.homepage ?? "" : "", featured:true };
    const [project] = current ? await db()`update projects set github_repo_id=${repo.id},repo_name=${repo.name},repository=${db().json(repo)},last_synced_at=now() where id=${current.id} returning *` :
      await db()`insert into projects(github_repo_id,slug,repo_name,repository,content,auto_register) values (${repo.id},${content.slug},${repo.name},${db().json(repo)},${db().json(content)},${eligible(repo,config)}) on conflict(github_repo_id) do update set repository=excluded.repository returning *`;
    if (project.auto_register && eligible(repo,config)) await enqueue("analyze",`repo:${repo.id}`,{ projectId:project.id });
    if (!current) await log("repository_discovered","success",repo.id);
  }
  const seen = [...(payload.seen ?? []),...repositories.map(r=>r.id)];
  if (repositories.length === 100) {
    await enqueue("discover",`discover:${run}:${page+1}`,{page:page+1,run,seen});
  } else {
    // Repositories made private/deleted/transferred must no longer be served publicly.
    await db().begin(async tx => {
      await tx`update projects set visibility='private',updated_at=now() where github_repo_id is not null and not (github_repo_id=any(${seen}))`;
      await snapshot(tx);
    });
    await log("discovery_completed","success");
  }
}
async function analyzeProject(projectId: string, evidenceFeedback?: EvidenceDiagnostics, refreshTechnical=false) {
  const [project] = await db()`select * from projects where id=${projectId}`;
  if (!project || !project.auto_register) return;
  // Fetch current repository metadata by immutable ID; never trust a saved name or a webhook payload.
  let repo: Repository;
  try { repo = repoSchema.parse(await github(`/repositories/${project.github_repo_id}`)); }
  catch (error) {
    if (error instanceof ServiceError && error.code === "HTTP_404") {
      await db().begin(async tx => { await tx`update projects set visibility='private' where id=${projectId}`; await snapshot(tx); });
      return;
    }
    throw error;
  }
  if (repo.private || repo.full_name.split("/")[0].toLowerCase() !== owner().toLowerCase()) {
    await db().begin(async tx => { await tx`update projects set visibility='private' where id=${projectId}`; await snapshot(tx); }); return;
  }
  const config = await settings();
  if (!eligible(repo,config)) return;
  const source = await collect(repo,refreshTechnical?[]:project.source_manifest);
    const [prior] = await db()`select id from project_analysis where project_id=${projectId} and commit_sha=${source.sha}
      union all select id from portfolio_content_drafts where project_id=${projectId} and commit_sha=${source.sha} limit 1`;
  if (prior&&!refreshTechnical) return;
  const hash = meaningfulHash(source.files);
  const priorPaths=new Set((project.source_manifest as {path:string}[]).map(f=>f.path));
  const nextPaths=new Set(source.manifest.map(f=>f.path));
  const hasNewSource=source.manifest.some(f=>!priorPaths.has(f.path));
  const hasRemovedSource=[...priorPaths].some(path=>!nextPaths.has(path));
  const clipped=source.files.some(f=>f.content.length>=10000);
  if (!refreshTechnical&&(source.unchanged || project.source_hash === hash && !hasNewSource && !hasRemovedSource && !clipped)) {
    await db()`update projects set last_commit=${source.sha},source_manifest=${db().json(source.manifest)},last_synced_at=now() where id=${projectId}`;
    await log("analysis_skipped_unchanged","success",repo.id); return;
  }
  const result = await analyze(projectId,source,evidenceFeedback);
  if (clipped || source.manifest.length>source.files.length) {
    result.generated.reviewNotes=[...result.generated.reviewNotes.slice(0,14),"크기·파일 수 제한에 따라 일부 소스만 분석했습니다. 핵심 구현과 누락 범위를 검토하세요."];
  }
  await db().begin(async tx => {
    // Serialize approval/manual edits with analysis. Read locks again after the provider call.
    const [latest] = await tx`select * from projects where id=${projectId} for update`;
    const next = mergeProposal(latest.content,result.generated,latest.locked_fields);
    // Editorial content always requires explicit approval, even if legacy autoPublish is enabled.
    await tx`insert into portfolio_content_drafts(project_id,technical_id,commit_sha,analyzed_files,analysis_result,generated_content,base_content,token_usage,estimated_cost,status)
      values (${projectId},${result.technicalId},${source.sha},${tx.json(source.files.map(f=>({path:f.path,sha:f.sha})))},${tx.json(result.generated)},${tx.json(next)},${tx.json(latest.content)},${tx.json(result.usage)},${result.estimatedCost},'pending')`;
    await tx`update projects set last_commit=${source.sha},source_hash=${hash},source_manifest=${tx.json(source.manifest)},last_synced_at=now(),project_type=${result.generated.projectType},analysis_status='ai_update_proposed',updated_at=now() where id=${projectId}`;
  });
  await log("analysis_completed","success",repo.id);
}
export async function runOne() {
  const lease = randomUUID();
  await db()`update portfolio_jobs set status='failed',error_message='LEASE_EXPIRED',updated_at=now() where status='running' and lease_until<now() and attempts>=3`;
  const [job] = await db()`update portfolio_jobs set status='running',attempts=attempts+1,lease_until=now()+interval '5 minutes',lease_token=${lease},updated_at=now()
    where id=(select id from portfolio_jobs where attempts<3 and ((status='queued' and available_at<=now()) or (status='running' and lease_until<now())) order by (kind='discover') desc,created_at for update skip locked limit 1) returning *`;
  if (!job) return { status:"idle" };
  try {
    if (job.kind === "discover") await discover(job.payload);
    else if(job.kind === "rewrite")await rewriteDescription(job.payload.projectId,job.payload.technicalId);
    else await analyzeProject(job.payload.projectId,job.payload.evidenceFeedback,job.payload.refreshTechnical===true);
    await db()`update portfolio_jobs set status='done',lease_until=null,updated_at=now() where id=${job.id} and lease_token=${lease}`;
    return { status:"done", kind:job.kind };
  } catch (error) {
    const code = error instanceof ServiceError ? error.code : error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "PROCESSING_FAILED";
    const delay = error instanceof ServiceError ? error.retryAfter : 60 * 2 ** job.attempts;
    const payload = error instanceof EvidenceError ? { ...job.payload, evidenceFeedback:error.diagnostics } : job.payload;
    await db()`update portfolio_jobs set status=${job.attempts>=3 ? "failed" : "queued"},payload=${db().json(payload)},error_message=${code},lease_until=null,available_at=now()+${delay}*interval '1 second',updated_at=now() where id=${job.id} and lease_token=${lease}`;
    await log(job.kind,"error",undefined,code);
    return { status:"error", code };
  }
}
