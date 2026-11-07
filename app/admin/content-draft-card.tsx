"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { mergeProposal } from "@/lib/automation/content";
import type { Generated } from "@/lib/automation/schema";
import { ProjectPreview } from "./project-preview";

export type ContentDraft={id:string;project_id:string;technical_id:string|null;parent_id:string|null;commit_sha:string;revision:number;status:string;analysis_result:Generated|{kind:"citation_cleanup";citations:unknown[];reviewNotes:string[]};generated_content:Project;base_content:Project;edited_fields:string[];created_at:string};
type Current={content:Project;locked_fields:string[];updated_at:string};
const button="min-h-11 rounded-full border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700";
const field="mt-2 min-h-28 w-full rounded-xl border border-zinc-300 bg-transparent p-3 text-sm leading-6 dark:border-zinc-700";
const sectionFields=[["overview","프로젝트 소개"],["problem","기획 배경"],["goal","개발 목표"],["roleSummary","담당 역할"],["architecture","기술 구조"],["result","개발 결과"],["retrospective","회고 (직접 확인한 내용)"]] as const;
export function ContentDraftCard({draft,current,previous,busy,onAction}:{draft:ContentDraft;current:Current;previous?:ContentDraft;busy:boolean;onAction:(body:object)=>Promise<void>}) {
  const [editable,setEditable]=useState(draft.generated_content);
  const preview="kind" in draft.analysis_result?structuredClone(draft.generated_content):mergeProposal(current.content,draft.analysis_result,current.locked_fields);
  for(const key of draft.edited_fields)if(!current.locked_fields.includes(key)) {
    if(key.startsWith("detail.")){const field=key.slice(7) as keyof NonNullable<Project["detail"]>;preview.detail={...preview.detail,[field]:draft.generated_content.detail?.[field]};}
    else Object.assign(preview,{[key]:draft.generated_content[key as keyof Project]});
  }
  const review=(decision:"approve"|"reject",publish:boolean)=>onAction({action:"reviewDraft",draftId:draft.id,revision:draft.revision,decision,publish,projectRevision:new Date(current.updated_at).toISOString()});
  return <article className="min-w-0 rounded-2xl border border-zinc-200 p-5 sm:p-7 dark:border-zinc-800">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">{draft.generated_content.title} · 상세 초안</h2><span className="text-xs text-zinc-500">개정 {draft.revision} · {draft.commit_sha.slice(0,12)}</span></div>
    <p className="mt-3 text-sm leading-6 text-zinc-500">기존 수동 보호 필드는 승인해도 유지됩니다. 회고 제안·미확인 정보는 근거 패널에서 확인하고, 사실 확인 후 직접 수정하세요.</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="min-w-0"><h3 className="mb-4 text-sm font-semibold text-zinc-500">현재 게시 내용</h3><ProjectPreview project={current.content}/></section><section className="min-w-0 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900"><h3 className="mb-4 text-sm font-semibold text-zinc-500">승인 후 상세 설명 미리보기</h3><ProjectPreview project={preview}/></section></div>
    {draft.status==="pending"&&<details className="mt-6"><summary className="cursor-pointer text-sm font-medium">항목별 초안 수정</summary><div className="mt-4 space-y-4">
      <label className="block text-sm">제목<input className={`${field} min-h-0`} value={editable.title} disabled={current.locked_fields.includes("title")} onChange={e=>setEditable({...editable,title:e.target.value})}/></label>
      <label className="block text-sm">부제<input aria-label="초안 부제" className={`${field} min-h-0`} value={editable.subtitle} disabled={current.locked_fields.includes("subtitle")} onChange={e=>setEditable({...editable,subtitle:e.target.value})}/></label>
      <label className="block text-sm">핵심 소개<textarea className={field} value={editable.description} disabled={current.locked_fields.includes("description")} onChange={e=>setEditable({...editable,description:e.target.value})}/></label>
      {sectionFields.map(([key,label])=><label className="block text-sm" key={key}>{label}{current.locked_fields.includes(`detail.${key}`)?" · 기존 수동 내용 보호":""}<textarea aria-label={label} className={field} value={editable.detail?.[key]??""} disabled={current.locked_fields.includes(`detail.${key}`)} onChange={e=>setEditable({...editable,detail:{...editable.detail,[key]:e.target.value}})}/></label>)}
      {([["features","핵심 기능 (한 줄에 하나)"],["implementation","핵심 구현 (한 줄에 하나)"],["responsibilities","담당 작업 (한 줄에 하나)"],["userFlow","사용자 흐름 (한 줄에 하나)"],["limitations","남은 과제 (한 줄에 하나)"]] as const).map(([key,label])=><label className="block text-sm" key={key}>{label}<textarea aria-label={label} className={field} value={editable.detail?.[key]?.join("\n")??""} disabled={current.locked_fields.includes(`detail.${key}`)} onChange={e=>setEditable({...editable,detail:{...editable.detail,[key]:e.target.value.split("\n").filter(Boolean)}})}/></label>)}
      {editable.detail?.troubleshooting?.map((item,index)=><fieldset key={index} disabled={current.locked_fields.includes("detail.troubleshooting")} className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><legend className="px-2 text-sm">문제 해결 {index+1}</legend>{([["title","제목"],["problem","Problem"],["solution","Approach"],["result","Result"]] as const).map(([key,label])=><label className="block text-sm" key={key}>{label}<textarea aria-label={`문제 해결 ${index+1} ${label}`} className={field} value={item[key]??""} onChange={e=>setEditable({...editable,detail:{...editable.detail,troubleshooting:editable.detail!.troubleshooting!.map((value,i)=>i===index?{...value,[key]:e.target.value}:value)}})}/></label>)}</fieldset>)}
      <button className={button} disabled={busy} onClick={()=>void onAction({action:"editDraft",draftId:draft.id,revision:draft.revision,content:editable})}>초안 수정 저장</button>
    </div></details>}
    <details className="mt-5"><summary className="cursor-pointer text-sm">근거·미확인 정보·회고 제안</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">{JSON.stringify(draft.analysis_result,null,2)}</pre></details>
    <details className="mt-5"><summary className="cursor-pointer text-sm">이전 버전과 비교</summary><div className="mt-3 grid gap-4 md:grid-cols-2">{[["이전 초안 또는 생성 당시 본문",previous?.generated_content??draft.base_content],["이번 초안",draft.generated_content]].map(([label,value])=><div className="min-w-0" key={String(label)}><p className="text-sm font-semibold">{String(label)}</p><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">{JSON.stringify(value,null,2)}</pre></div>)}</div></details>
    {draft.status==="pending"?<div className="mt-6 flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>void review("approve",true)}>초안 승인 후 게시</button><button className={button} disabled={busy} onClick={()=>void review("approve",false)}>초안 승인·공개 상태 유지</button><button className={button} disabled={busy} onClick={()=>void review("reject",false)}>초안 거절</button></div>:<p className="mt-5 text-sm text-zinc-500">처리된 초안 · {draft.status}</p>}
  </article>;
}
