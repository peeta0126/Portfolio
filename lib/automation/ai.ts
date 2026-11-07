import "server-only";
import { z } from "zod";
import { createHash } from "node:crypto";
import { db } from "./db";
import { ServiceError, type collect } from "./github";
import { redact } from "./core";
import { validateEvidence, type EvidenceDiagnostics } from "./evidence";
import { technicalSchema, writingSchema, validateTechnical, validateWriting, technicalPrompt, writingPrompt, allowedEvidence, type SourcePacket, type TechnicalAnalysis } from "./editorial";
import { requestModel } from "./model";
export { pricing } from "./model";
export const pipelineVersion="portfolio-v2";
export class EvidenceError extends ServiceError {
  constructor(public diagnostics:EvidenceDiagnostics) {super("INVALID_EVIDENCE");}
}
export async function technicalAnalysis(projectId:string,source:SourcePacket) {
  // Selection priority can reorder identical files (manual refresh vs incremental collect).
  // Cache the actual evidence content, not incidental request ordering or collection flags.
  const hash=createHash("sha256").update(JSON.stringify({sha:source.sha,
    files:[...source.files].sort((a,b)=>a.path.localeCompare(b.path)),
    commits:[...source.commits].sort((a,b)=>a.id.localeCompare(b.id)),
    prs:[...source.prs].sort((a,b)=>a.id.localeCompare(b.id)),
    issues:[...(source.issues??[])].sort((a,b)=>a.id.localeCompare(b.id)),tree:[...source.tree].sort(),
  })).digest("hex");
  const [cached]=await db()`select * from portfolio_technical_analysis where project_id=${projectId} and commit_sha=${source.sha} and source_hash=${hash} and pipeline_version=${pipelineVersion}`;
  if(cached)return {id:cached.id as string,facts:validateTechnical(cached.facts,source),source,cached:true};
  const [legacy]=await db()`select id,analysis_result,analyzed_files from project_analysis where project_id=${projectId} and commit_sha=${source.sha} order by created_at desc limit 1`;
  const result=await requestModel(projectId,"portfolio_technical_facts",technicalSchema,technicalPrompt()+" 이전 AI 분석은 재검토할 참고 자료이며 근거 자체가 아닙니다. 현재 source 원문에서 다시 확인한 내용만 facts로 올리세요.",{source,allowedEvidence:allowedEvidence(source),legacyContext:legacy?{id:legacy.id,analyzedFiles:legacy.analyzed_files,overview:legacy.analysis_result?.overview,evidence:legacy.analysis_result?.evidence,reviewNotes:legacy.analysis_result?.reviewNotes}:null});
  const facts=validateTechnical(result.raw,source);
  const [saved]=await db()`insert into portfolio_technical_analysis(project_id,commit_sha,source_hash,pipeline_version,facts,source_packet,token_usage,estimated_cost)
    values(${projectId},${source.sha},${hash},${pipelineVersion},${db().json(facts)},${db().json(source)},${db().json(result.usage)},${result.estimatedCost})
    on conflict(project_id,commit_sha,source_hash,pipeline_version) do update set project_id=excluded.project_id returning id`;
  return {id:saved.id as string,facts,source,cached:false};
}
export async function writePortfolio(projectId:string,facts:TechnicalAnalysis,source:SourcePacket,evidenceFeedback?:EvidenceDiagnostics) {
  validateTechnical(facts,source);
  const result=await requestModel(projectId,"portfolio_writing",writingSchema,writingPrompt(),{facts,source,allowedEvidence:allowedEvidence(source),...(evidenceFeedback?{evidenceFeedback:{issues:evidenceFeedback.issues,instruction:"현재 근거 목록과 원문으로 다시 검증하고 확인할 수 없는 주장은 제외하세요."}}:{})},9000);
  const envelope=writingSchema.extend({troubleshooting:z.array(z.unknown()).max(5)}).safeParse(result.raw);
  if(!envelope.success)throw new ServiceError("AI_SCHEMA_INVALID");
  const valid=envelope.data.troubleshooting.flatMap((item,index)=>{const parsed=writingSchema.shape.troubleshooting.element.safeParse(item);return parsed.success?[{item:parsed.data,index}]:[];});
  const troubleshooting=valid.map(v=>v.item);
  const fieldEvidence=envelope.data.fieldEvidence.flatMap(e=>{const match=/^troubleshooting\.(\d+)\.(.*)$/.exec(e.field);if(!match)return [e];const index=valid.findIndex(v=>v.index===Number(match[1]));return index<0?[]:[{...e,field:`troubleshooting.${index}.${match[2]}`}];});
  const dropped=troubleshooting.length!==envelope.data.troubleshooting.length;
  const prepared={...envelope.data,troubleshooting,fieldEvidence,reviewNotes:dropped?[...envelope.data.reviewNotes.slice(0,14),"스키마 또는 근거가 불완전한 Problem Solving 항목을 제외했습니다."]:envelope.data.reviewNotes};
  const checked=validateEvidence(prepared,source);
  if(checked.diagnostics.issues.length||dropped)await db()`insert into sync_logs(event_type,status,error_message) values('analysis_evidence_validation','error',${redact(JSON.stringify({projectId,...checked.diagnostics,malformedTroubleshootingDropped:dropped}))})`;
  if(checked.basicInvalid)throw new EvidenceError(checked.diagnostics);
  const generated=validateWriting(prepared,facts,source);
  return {generated,usage:result.usage,estimatedCost:result.estimatedCost};
}
export async function analyze(projectId:string,source:Awaited<ReturnType<typeof collect>>,evidenceFeedback?:EvidenceDiagnostics) {
  const technical=await technicalAnalysis(projectId,source);
  const result=await writePortfolio(projectId,technical.facts,source,evidenceFeedback);
  return {...result,technicalId:technical.id};
}
