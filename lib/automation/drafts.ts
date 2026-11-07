import "server-only";
import { db } from "./db";
import { writePortfolio } from "./ai";
import { mergeProposal, editedFields } from "./core";
import { projectSchema, generatedSchema } from "./schema";
import { validateTechnical, validateWriting, separateLegacyEvidence, hasInlineEvidence, type SourcePacket } from "./editorial";
import { snapshot } from "./publish";
import type { Project } from "../../types";

export async function rewriteDescription(projectId:string,technicalId:string) {
  // Existing stored facts and excerpts are reused. No GitHub fetch or technical-model call here.
  const [technical]=await db()`select * from portfolio_technical_analysis where id=${technicalId} and project_id=${projectId}`;
  if(!technical)throw new Error("TECHNICAL_ANALYSIS_REQUIRED");
  const source=technical.source_packet as SourcePacket;
  const facts=validateTechnical(technical.facts,source);
  const result=await writePortfolio(projectId,facts,source);
  return db().begin(async tx=>{
    const [p]=await tx`select * from projects where id=${projectId} for update`;
    if(!p)throw new Error("NOT_FOUND");
    const [previous]=await tx`select id from portfolio_content_drafts where project_id=${projectId} order by created_at desc limit 1`;
    const [draft]=await tx`insert into portfolio_content_drafts(project_id,technical_id,parent_id,commit_sha,analyzed_files,analysis_result,generated_content,base_content,token_usage,estimated_cost)
      values(${projectId},${technicalId},${previous?.id??null},${source.sha},${tx.json(source.files.map(({path,sha})=>({path,sha})))},${tx.json(result.generated)},${tx.json(mergeProposal(p.content,result.generated,p.locked_fields))},${tx.json(p.content)},${tx.json(result.usage)},${result.estimatedCost}) returning id`;
    return draft.id as string;
  });
}
export async function createCitationCleanup(projectId:string) {
  return db().begin(async tx=>{
    const [p]=await tx`select * from projects where id=${projectId} for update`;
    if(!p)throw new Error("NOT_FOUND");
    const preview=separateLegacyEvidence(p.content);
    if(!preview.citations.length)throw new Error("NO_INLINE_EVIDENCE");
    const [row]=await tx`insert into portfolio_content_drafts(project_id,commit_sha,analysis_result,generated_content,base_content)
      values(${projectId},${p.last_commit??"legacy"},${tx.json({kind:"citation_cleanup",citations:preview.citations,reviewNotes:["기존 본문에서 분리한 근거입니다. 실제 파일·커밋과의 일치 검증은 별도로 필요하며 자동 사실 검증을 통과한 새 분석이 아닙니다."]})},${tx.json(projectSchema.parse(preview.proposal))},${tx.json(p.content)}) returning id`;
    return row.id as string;
  });
}
export async function editDraft(draftId:string,revision:number,content:Project) {
  const parsed=projectSchema.parse(content);
  if(hasInlineEvidence(JSON.stringify(parsed)))throw new Error("INLINE_EVIDENCE_IN_PROSE");
  return db().begin(async tx=>{
    const [draft]=await tx`select * from portfolio_content_drafts where id=${draftId} for update`;
    if(!draft||draft.status!=="pending"||draft.revision!==revision)throw new Error("EDIT_CONFLICT");
    if(parsed.slug!==draft.base_content.slug)throw new Error("SLUG_IMMUTABLE");
    const fields=[...new Set([...draft.edited_fields,...editedFields(draft.generated_content,parsed)])];
    await tx`update portfolio_content_drafts set generated_content=${tx.json(parsed)},edited_fields=${fields},revision=revision+1,updated_at=now() where id=${draftId}`;
  });
}
export async function reviewDraft(draftId:string,revision:number,decision:"approve"|"reject",publish:boolean,projectRevision:string) {
  return db().begin(async tx=>{
    const [draft]=await tx`select * from portfolio_content_drafts where id=${draftId} for update`;
    if(!draft||draft.status!=="pending")throw new Error("ALREADY_REVIEWED");
    if(draft.revision!==revision)throw new Error("EDIT_CONFLICT");
    if(decision==="reject"){await tx`update portfolio_content_drafts set status='rejected',updated_at=now() where id=${draftId}`;return;}
    const [p]=await tx`select * from projects where id=${draft.project_id} for update`;
    if(new Date(p.updated_at).toISOString()!==projectRevision)throw new Error("EDIT_CONFLICT");
    let next:Project;
    if(draft.technical_id) {
      const [technical]=await tx`select * from portfolio_technical_analysis where id=${draft.technical_id} and project_id=${p.id}`;
      if(!technical)throw new Error("TECHNICAL_ANALYSIS_REQUIRED");
      validateWriting(draft.analysis_result,validateTechnical(technical.facts,technical.source_packet),technical.source_packet);
      next=mergeProposal(p.content,generatedSchema.parse(draft.analysis_result),p.locked_fields);
      // Apply explicit human draft edits, then restore all existing locked fields.
      const manual=draft.generated_content as Project;
      for(const field of draft.edited_fields as string[]) {
        if(p.locked_fields.includes(field))continue;
        if(field.startsWith("detail.")) {const key=field.slice(7) as keyof NonNullable<Project["detail"]>;next.detail={...next.detail,[key]:manual.detail?.[key]};}
        else Object.assign(next,{[field]:manual[field as keyof Project]});
      }
    } else {
      // Cleanup only removes citation markers from unchanged base text. It cannot replace manual content.
      if(JSON.stringify(p.content)!==JSON.stringify(draft.base_content))throw new Error("EDIT_CONFLICT");
      next=draft.generated_content;
    }
    const content=projectSchema.parse(next);
    if(hasInlineEvidence(JSON.stringify(content)))throw new Error("INLINE_EVIDENCE_IN_PROSE");
    const locked=[...new Set([...p.locked_fields,...draft.edited_fields])];
    await tx`update projects set content=${tx.json(content)},locked_fields=${locked},analysis_status=${publish?"published":"reviewed"},visibility=${publish?"public":p.visibility},published_at=case when ${publish} then now() else published_at end,updated_at=now() where id=${p.id}`;
    await tx`update portfolio_content_drafts set status=${publish?"published":"reviewed"},updated_at=now() where id=${draftId}`;
    if(!p.locked_fields.includes("detail.troubleshooting"))for(const item of content.detail?.troubleshooting??[]) {
      const manual=(draft.edited_fields as string[]).includes("detail.troubleshooting");
      const generated=draft.technical_id?generatedSchema.parse(draft.analysis_result):null;
      const evidence=generated?.troubleshooting.find(t=>t.title===item.title)?.evidence??[];
      await tx`insert into project_problem_solving(project_id,title,problem,approach,result,evidence,source_type,manually_edited)
        values(${p.id},${item.title},${item.problem},${item.solution},${item.result??null},${tx.json(evidence)},${manual?"manual":"ai"},${manual})
        on conflict(project_id,title) do update set problem=excluded.problem,approach=excluded.approach,result=excluded.result,evidence=excluded.evidence,source_type=excluded.source_type,manually_edited=excluded.manually_edited
        where ${manual} or not project_problem_solving.manually_edited`;
    }
    await snapshot(tx);
    await tx`insert into sync_logs(event_type,status,error_message) values('content_draft_review','success',${draftId})`;
  });
}
