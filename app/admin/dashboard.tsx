"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Github, LogOut, ShieldCheck, Upload, Play } from "lucide-react";
import type { Project } from "@/types";
import type { Settings } from "@/lib/automation/schema";
import { mergeProposal } from "@/lib/automation/content";
import type { Generated } from "@/lib/automation/schema";
import { ContentDraftCard, type ContentDraft } from "./content-draft-card";
import type { TechnicalAnalysis } from "@/lib/automation/editorial";
import { hasInlineEvidence } from "@/lib/automation/prose";

type ProjectRow={id:string;repo_name:string|null;github_repo_id:number|null;content:Project;visibility:"public"|"private";display_order:number;auto_register:boolean;locked_fields:string[];analysis_status:string;updated_at:string;last_synced_at:string|null;project_type:string|null};
type Analysis={id:string;project_id:string;commit_sha:string;status:string;analysis_result:Generated & {images?:string[]};generated_content:Project;analyzed_files:{path:string;sha:string}[];estimated_cost:number;created_at:string};
type Job={id:string;kind:string;status:string;attempts:number;error_message:string|null;updated_at:string};
type State={technicalAnalyses:{id:string;project_id:string;commit_sha:string;facts:TechnicalAnalysis;created_at:string}[];contentDrafts:ContentDraft[];projects:ProjectRow[];analyses:Analysis[];jobs:Job[];queueSummary:{kind:string;status:string;count:number}[];logs:{id:number;event_type:string;status:string;error_message:string|null;created_at:string}[];usage:{calls:number;input_tokens:number;output_tokens:number;cost:number};settings:Settings;connection:{githubOwner:string;githubToken:boolean;openai:boolean;model:string|null}};
const field="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";
const button="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm transition hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";
const card="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-950";
const stamp=(date:string|null)=>date ? new Date(date).toLocaleString("ko-KR") : "기록 없음";
const statusLabels:Record<string,string>={pending:"검토 대기",manually_edited:"직접 수정",ai_update_proposed:"AI 업데이트 제안",reviewed:"검토 완료",published:"게시 완료",rejected:"거절",queued:"대기",running:"실행 중",done:"완료",failed:"실패"};
function status(value:string) {return statusLabels[value] ?? value;}

export function AdminDashboard({authenticated,configured}:{authenticated:boolean;configured:boolean}) {
  const [loggedIn,setLoggedIn]=useState(authenticated);
  const [data,setData]=useState<State|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [selected,setSelected]=useState("");
  const [tab,setTab]=useState("projects");
  const [draft,setDraft]=useState("");
  const [visibility,setVisibility]=useState<"public"|"private">("private");
  const [order,setOrder]=useState(0);
  const [auto,setAuto]=useState(true);
  const [config,setConfig]=useState<Settings|null>(null);

  async function load() {
    const response=await fetch("/api/admin",{cache:"no-store"});
    const result=await response.json();
    if (!response.ok) {if(response.status===401)setLoggedIn(false);throw new Error(result.error);}
    setData(result);setConfig(result.settings);
    return result as State;
  }
  useEffect(()=>{if(loggedIn)load().catch(error=>setMessage(error.message));},[loggedIn]);
  const project=data?.projects.find(p=>p.id===selected);
  function select(p:ProjectRow) {setSelected(p.id);setDraft(JSON.stringify(p.content,null,2));setVisibility(p.visibility);setOrder(p.display_order);setAuto(p.auto_register);}
  async function action(body:object) {
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok)throw new Error([result.error,...(result.details ?? [])].join(" · "));
      const next=await load();
      if(selected){const updated=next.projects.find(p=>p.id===selected);if(updated)select(updated);}
      setMessage(result.queueReset ? `작업 큐를 초기화했습니다. ${result.queueReset.before.reduce((sum:number,row:{count:number})=>sum+row.count,0)}건 → ${result.queueReset.after.reduce((sum:number,row:{count:number})=>sum+row.count,0)}건 (삭제 ${result.queueReset.deleted}건)` : result.code ? `작업 상태: ${result.code}` : "저장되었습니다.");
    }catch(error){setMessage(error instanceof Error ? error.message : "요청에 실패했습니다.");}
    finally{setBusy(false);}
  }
  async function login(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget;setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/admin/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:new FormData(form).get("password")})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);form.reset();setLoggedIn(true);
    }catch(error){setMessage(error instanceof Error ? error.message : "로그인 실패");}finally{setBusy(false);}
  }
  async function upload(file:File|undefined) {
    if(!file)return;setBusy(true);
    try {
      const response=await fetch("/api/admin/upload",{method:"POST",headers:{"Content-Type":file.type},body:file});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setDraft(value=>JSON.stringify({...JSON.parse(value),thumbnail:result.url},null,2));setMessage("이미지가 업로드되었습니다. 프로젝트를 저장하면 반영됩니다.");
    }catch(error){setMessage(error instanceof Error ? error.message : "이미지 업로드 실패");}finally{setBusy(false);}
  }
  const pending=data?.analyses.filter(a=>a.status==="pending") ?? [];
  const draftPending=data?.contentDrafts.filter(d=>d.status==="pending")??[];
  const technical=data?.technicalAnalyses.find(t=>t.project_id===selected);
  const queueTotal=data?.queueSummary.reduce((sum,row)=>sum+row.count,0) ?? 0;
  const queueRunning=data?.queueSummary.some(row=>row.status==="running") ?? false;
  function confirmQueueReset() {
    if(window.confirm("discover·analyze·rewrite 작업의 대기·완료·실패 항목을 초기화할까요?\n프로젝트, Problem Solving, AI 분석 결과, 관리자 수정, 공개 상태, API 사용량·비용, 동기화 로그는 유지됩니다.\n실행 중인 작업이 있으면 초기화하지 않습니다.")) {
      void action({action:"resetQueue",confirmed:true});
    }
  }
  return <main className="mx-auto min-h-screen max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500"><ArrowLeft size={16} aria-hidden="true"/>포트폴리오</Link>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-5">
      <div><p className="section-label">Portfolio — Workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">프로젝트 관리</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">GitHub의 변화를 확인하고, 코드에 근거한 설명을 검토해 게시합니다.</p></div>
      {loggedIn && <button className={button} disabled={busy} onClick={async()=>{await fetch("/api/admin/session",{method:"DELETE"});setLoggedIn(false);setData(null);}}><LogOut size={16} aria-hidden="true"/>로그아웃</button>}
    </div>
    <div role="status" aria-live="polite" className="mt-5 min-h-6 break-words text-sm">{busy ? "처리 중입니다…" : message}</div>
    {!loggedIn ? <form onSubmit={login} className={`${card} mt-8 max-w-md`}>
      <ShieldCheck size={24} aria-hidden="true"/><h2 className="mt-4 text-xl font-semibold">관리자 로그인</h2>
      {!configured && <p className="mt-4 text-sm leading-6 text-zinc-500">DB와 관리자 인증 환경변수를 먼저 설정하세요. 설정 방법은 docs/automation.md에서 확인할 수 있습니다.</p>}
      <label className="mt-6 block text-sm">비밀번호<input className={`${field} mt-2`} name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>
      <button className={`${button} mt-5`} disabled={busy||!configured}>로그인</button>
    </form> : <>
      <nav aria-label="관리 메뉴" className="mt-8 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        {[["projects","프로젝트"],["review",`AI 검토 ${pending.length+draftPending.length}`],["sync","동기화"],["budget","비용·설정"]].map(([key,label])=><button className={`${button} ${tab===key ? "bg-zinc-100 font-semibold dark:bg-zinc-800" : ""}`} key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}
        <button className={`${button} ml-auto`} disabled={busy} onClick={()=>{setBusy(true);load().catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}><RefreshCw size={16} aria-hidden="true"/>새로고침</button>
      </nav>
      {!data ? <p className="mt-8">관리 데이터를 불러오는 중입니다. 연결 오류가 있으면 위 메시지를 확인하세요.</p> : <>
        {tab==="projects" && <div className="mt-7 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">{data.projects.map(p=><button key={p.id} onClick={()=>select(p)} aria-pressed={selected===p.id} className={`${card} w-full text-left ${selected===p.id ? "ring-2 ring-zinc-500" : ""}`}><span className="block break-words font-semibold">{p.content.title}</span><span className="mt-2 block text-xs text-zinc-500">{p.visibility==="public" ? "공개" : "비공개"} · {status(p.analysis_status)}</span><span className="mt-1 block break-words text-xs text-zinc-500">{p.repo_name ?? "GitHub 미연결"}</span></button>)}</div>
          {project ? <section className={`${card} min-w-0`}><h2 className="text-xl font-semibold">{project.content.title}</h2><p className="mt-2 text-xs text-zinc-500">Repository ID {project.github_repo_id ?? "연결 전"} · {project.project_type ?? "유형 미분석"}</p>
            <div className="mt-6 flex flex-wrap gap-5 text-sm"><label>공개 상태<select className={`${field} mt-2`} value={visibility} onChange={e=>setVisibility(e.target.value as typeof visibility)}><option value="private">비공개</option><option value="public">공개</option></select></label><label>표시 순서<input type="number" className={`${field} mt-2 max-w-32`} value={order} onChange={e=>setOrder(Number(e.target.value))}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/>자동 분석 허용</label></div>
            <p className="mt-5 text-sm leading-6 text-zinc-500">내용과 Problem Solving을 아래에서 수정할 수 있습니다. 변경한 필드는 이후 AI 제안 승인 시에도 보호됩니다. slug는 기존 주소 보존을 위해 수정할 수 없습니다.</p>
            <label htmlFor="project-content" className="mt-5 block text-sm">프로젝트 데이터</label><textarea id="project-content" aria-describedby="editor-hint" className={`${field} mt-2 min-h-96 font-mono text-xs leading-6`} value={draft} onChange={e=>setDraft(e.target.value)} spellCheck={false}/><p id="editor-hint" className="mt-2 text-xs text-zinc-500">title: 제목 · subtitle: 한 줄 소개 · tech: 기술 · detail.overview: 개요 · detail.troubleshooting: Problem / solution(Approach) / Result</p>
            <label className="mt-5 flex items-center gap-2 text-sm"><Upload size={16} aria-hidden="true"/>대표 이미지<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="min-w-0 max-w-full text-xs" onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/></label>
            <div className="mt-6 flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>{try {void action({action:"edit",projectId:project.id,content:JSON.parse(draft),visibility,displayOrder:order,autoRegister:auto,revision:new Date(project.updated_at).toISOString()});}catch{setMessage("JSON 형식을 확인하세요.");}}}>변경 저장</button><button className={button} disabled={busy||!project.github_repo_id} onClick={()=>void action({action:"analyze",projectId:project.id})}>분석 요청</button></div>
            <p className="mt-5 break-words text-xs leading-6 text-zinc-500">보호된 필드: {project.locked_fields.join(", ")||"없음"}<br/>마지막 동기화: {stamp(project.last_synced_at)}</p>
            <div className="mt-6 flex flex-wrap gap-3"><button className={button} disabled={busy||!technical} onClick={()=>technical&&void action({action:"rewriteDescription",projectId:project.id,technicalId:technical.id})}>설명만 다시 생성</button>{hasInlineEvidence(JSON.stringify(project.content))&&<button className={button} disabled={busy} onClick={()=>void action({action:"cleanupCitations",projectId:project.id})}>본문 근거 분리 초안 만들기</button>}</div>
            <p className="mt-3 text-xs leading-6 text-zinc-500">설명 재작성은 저장된 기술 분석을 재사용해 큐에 예약합니다. 기존 설명과 공개 상태는 승인 전까지 유지됩니다.{!technical&&" 먼저 새 기술 분석을 완료해야 합니다. 이전 AI 분석은 아래 기록에서 참고할 수 있습니다."}</p>
            <details className="mt-5"><summary className="cursor-pointer text-sm">기술 분석·근거·미확인 정보</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">{JSON.stringify(technical??{message:"새 기술 분석 없음",legacy:data.analyses.filter(a=>a.project_id===project.id)},null,2)}</pre></details>
          </section> : <div className={card}>수정할 프로젝트를 선택하세요. 처음 연결하는 경우 동기화 탭에서 저장소를 수집하세요.</div>}
        </div>}
        {tab==="review" && <div className="mt-7 space-y-6">{draftPending.map(d=>{const current=data.projects.find(p=>p.id===d.project_id);return current?<ContentDraftCard key={`${d.id}:${d.revision}`} draft={d} current={current} previous={data.contentDrafts.find(p=>p.id===d.parent_id)} busy={busy} onAction={action}/>:null;})}<details className={card}><summary className="cursor-pointer">상세 초안 버전 기록 {data.contentDrafts.length}건</summary><div className="mt-4 space-y-6">{data.contentDrafts.filter(d=>d.status!=="pending").map(d=>{const current=data.projects.find(p=>p.id===d.project_id);return current?<ContentDraftCard key={d.id} draft={d} current={current} previous={data.contentDrafts.find(p=>p.id===d.parent_id)} busy={busy} onAction={action}/>:null;})}</div></details>{pending.length===0&&draftPending.length===0 && <p>검토 대기 중인 분석이 없습니다.</p>}{pending.map(a=>{
          const current=data.projects.find(p=>p.id===a.project_id);if(!current)return null;
          const next=mergeProposal(current.content,a.analysis_result,current.locked_fields);
          return <article className={card} key={a.id}><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">{current.content.title}</h2><span className="break-all font-mono text-xs text-zinc-500">{a.commit_sha.slice(0,12)} · ${Number(a.estimated_cost).toFixed(4)}</span></div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">직접 수정한 필드가 보호된 상태로 비교됩니다. JSON 편집기에서 직접 내용을 고치려면 프로젝트 탭을 사용하세요.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">{[["현재 게시 내용",current.content],["승인 후 내용",next]].map(([label,value])=><div key={String(label)} className="min-w-0"><h3 className="text-sm font-medium">{String(label)}</h3><pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-zinc-100 p-4 text-xs leading-6 dark:bg-zinc-900">{JSON.stringify(value,null,2)}</pre></div>)}</div>
            <details className="mt-5"><summary className="cursor-pointer text-sm">분석 근거·검토 사항·AI 원본</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-100 p-4 text-xs leading-6 dark:bg-zinc-900">{JSON.stringify({files:a.analyzed_files,...a.analysis_result},null,2)}</pre></details>
            <div className="mt-5 flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>void action({action:"review",analysisId:a.id,decision:"approve",publish:true})}>승인 후 게시</button><button className={button} disabled={busy} onClick={()=>void action({action:"review",analysisId:a.id,decision:"approve",publish:false})}>승인·현재 공개 상태 유지</button><button className={button} disabled={busy} onClick={()=>void action({action:"review",analysisId:a.id,decision:"reject",publish:false})}>거절</button></div>
          </article>;
        })}<details className={card}><summary className="cursor-pointer">전체 분석 기록 {data.analyses.length}건</summary><div className="mt-4 space-y-4">{data.analyses.map(a=><details key={a.id}><summary className="cursor-pointer break-words text-sm">{data.projects.find(p=>p.id===a.project_id)?.content.title} · {status(a.status)} · {stamp(a.created_at)}</summary><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(a,null,2)}</pre></details>)}</div></details></div>}
        {tab==="sync" && <div className="mt-7 space-y-6"><section className={card}><h2 className="flex items-center gap-2 text-xl font-semibold"><Github size={22} aria-hidden="true"/>{data.connection.githubOwner}</h2><p className="mt-3 text-sm text-zinc-500">GitHub 토큰 {data.connection.githubToken ? "설정됨" : "미설정 (공개 API 제한 적용)"} · OpenAI {data.connection.openai ? "설정됨" : "미설정"}</p><p className="mt-3 text-sm leading-6 text-zinc-500">수동 동기화는 수집 작업을 예약합니다. 작업 1개 실행으로 큐를 처리하거나 예약 실행기를 연결하세요. 이미 분석한 커밋은 재사용합니다.</p><div className="mt-5 flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>void action({action:"sync"})}><RefreshCw size={16} aria-hidden="true"/>수동 동기화</button><button className={button} disabled={busy} onClick={()=>void action({action:"work"})}><Play size={16} aria-hidden="true"/>작업 1개 실행</button></div></section>
          <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">작업 큐 · {queueTotal}건</h2><button className={`${button} text-red-700 dark:text-red-400`} disabled={busy||queueRunning||queueTotal===0} aria-describedby="queue-reset-hint" onClick={confirmQueueReset}>작업 큐 초기화</button></div><p id="queue-reset-hint" className="mt-3 text-sm leading-6 text-zinc-500">대기·완료·실패 작업만 지웁니다. 프로젝트·분석 결과·사용량·로그는 유지됩니다.{queueRunning && " 실행 중인 작업이 있어 초기화할 수 없습니다."}</p><p className="mt-2 text-xs text-zinc-500">{data.queueSummary.map(row=>`${row.kind} ${status(row.status)} ${row.count}건`).join(" · ") || "예약된 작업이 없습니다."}</p><div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">{data.jobs.map(j=><div key={j.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><div>{j.kind} · {status(j.status)} · 시도 {j.attempts}<p className="mt-1 break-words text-xs text-zinc-500">{stamp(j.updated_at)} {j.error_message}</p></div>{j.status==="failed" && <button className={button} disabled={busy} onClick={()=>void action({action:"retry",jobId:j.id})}>재시도</button>}</div>)}</div></section>
          <section className={card}><h2 className="text-xl font-semibold">동기화 로그</h2><div className="mt-4 space-y-3">{data.logs.map(l=><p key={l.id} className="break-words text-xs leading-6 text-zinc-500">{stamp(l.created_at)} · {l.event_type} · {l.status} {l.error_message}</p>)}</div></section></div>}
        {tab==="budget" && config && <div className="mt-7 grid items-start gap-6 md:grid-cols-2"><section className={card}><h2 className="text-xl font-semibold">이번 달 API 사용</h2><dl className="mt-6 grid grid-cols-2 gap-6">{[["호출·예약",`${data.usage.calls}회`],["추정 비용·예약",`$${Number(data.usage.cost).toFixed(4)}`],["입력 토큰",data.usage.input_tokens.toLocaleString()],["출력 토큰",data.usage.output_tokens.toLocaleString()]].map(([label,value])=><div key={label}><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-2 text-2xl font-semibold">{value}</dd></div>)}</dl><p className="mt-6 text-xs leading-6 text-zinc-500">모델: {data.connection.model ?? "미설정"}. 추정 비용은 서버에 설정한 단가 기준입니다. 응답을 확인하지 못한 호출은 예약액을 유지합니다.</p></section>
          <form className={card} onSubmit={e=>{e.preventDefault();void action({action:"settings",value:config});}}><h2 className="text-xl font-semibold">동기화·예산 설정</h2><div className="mt-6 space-y-5">{([["autoPublish","검토 사항이 없으면 자동 게시"],["includeForks","Fork 저장소 포함"],["includeArchived","보관된 저장소 포함"]] as const).map(([key,label])=><label className="flex items-center gap-3 text-sm" key={key}><input type="checkbox" checked={config[key]} onChange={e=>setConfig({...config,[key]:e.target.checked})}/>{label}</label>)}
            <label className="block text-sm">제외할 저장소 이름 (쉼표로 구분)<input className={`${field} mt-2`} value={config.excludedPattern} onChange={e=>setConfig({...config,excludedPattern:e.target.value})}/></label>
            <label className="block text-sm">월간 한도 (USD)<input type="number" min="0" max="1000" step="0.01" className={`${field} mt-2`} value={config.monthlyBudget} onChange={e=>setConfig({...config,monthlyBudget:Number(e.target.value)})}/></label>
            <label className="block text-sm">월간 최대 호출 횟수<input type="number" min="0" max="10000" className={`${field} mt-2`} value={config.monthlyCalls} onChange={e=>setConfig({...config,monthlyCalls:Number(e.target.value)})}/></label><button className={button} disabled={busy}>설정 저장</button></div></form></div>}
      </>}
    </>}
  </main>;
}
