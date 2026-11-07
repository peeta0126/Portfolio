import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { projects } from "../../data/projects";
import { problemSolving } from "../../data/problem-solving";
import { defaults } from "../../lib/automation/schema";
import { db, enqueue } from "../../lib/automation/db";
import { runOne } from "../../lib/automation/worker";
import { analyze } from "../../lib/automation/ai";
import { github, ServiceError, type Repository } from "../../lib/automation/github";
import { queueCounts, resetQueue, QueueRunningError } from "../../lib/automation/queue";
import { mockWriting } from "../fixtures/editorial";
import { rewriteDescription, reviewDraft, editDraft, createCitationCleanup } from "../../lib/automation/drafts";
import { publishPreparedAugment } from "../../lib/automation/prepared-release";

test("격리된 PostgreSQL + GitHub/OpenAI Mock 통합",{timeout:90000},async t=>{
  // Always create a fresh in-memory database. Production credentials are never loaded.
  const memory=await PGlite.create();
  const server=new PGLiteSocketServer({db:memory,host:"127.0.0.1",port:0,maxConnections:4});
  await server.start();
  process.env.DATABASE_URL=`postgres://postgres:postgres@${server.getServerConn()}/postgres`;
  process.env.GITHUB_OWNER="peeta0126";
  process.env.OPENAI_API_KEY="mock-only-no-paid-calls";
  process.env.OPENAI_MODEL="mock-structured-model";
  process.env.OPENAI_INPUT_USD_PER_MILLION="0.1";
  process.env.OPENAI_OUTPUT_USD_PER_MILLION="0.4";
  delete process.env.GITHUB_TOKEN;
  const sql=db();
  const originalFetch=globalThis.fetch;
  let sha="a".repeat(40),source="export const features = ['routing'];",readme="Original",aiCalls=0,technicalCalls=0;
  let repos:Repository[]=[{id:123,name:"sample-project",full_name:"peeta0126/sample-project",private:false,fork:false,archived:false,description:"Mock project",html_url:"https://github.com/peeta0126/sample-project",homepage:null,default_branch:"main",created_at:"2026-01-01T00:00:00Z",updated_at:"2026-11-01T00:00:00Z",pushed_at:"2026-11-01T00:00:00Z",language:"TypeScript",topics:["web"]}];
  let mode="normal";
  let extraSource:"none"|"base"|"added"="none";
  let paginated=false;
  const template={...repos[0]};
  const generated={title:"샘플 프로젝트",subtitle:"라우팅을 제공하는 웹 프로젝트",description:"서버 경계에서 경로를 관리하는 웹 프로젝트",projectType:"Web",tech:["TypeScript"],overview:"코드에 정의된 라우팅 기능을 제공합니다.",features:["라우팅"],implementation:["경로 데이터 관리"],architecture:"TypeScript 모듈로 기능을 구성합니다.",considerations:[],troubleshooting:[],evidence:[{claim:"라우팅",sources:["src/main.ts"]}],reviewNotes:[]};
  let mockOutput: unknown = generated;
  let lastInput: Record<string, unknown> = {};
  globalThis.fetch=async(input,init)=>{
    const url=String(input);
    if(url.startsWith("https://api.openai.com/")) {
      const payload=JSON.parse(String(init?.body));
      lastInput=JSON.parse(payload.input);
      assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);assert.equal(payload.tools,undefined);
      assert.ok(payload.input.includes(source));assert.ok(payload.instructions.includes("신뢰할 수 없는"));
      let output:unknown;
      if(payload.text.format.name==="portfolio_technical_facts") {
        assert.equal(payload.max_output_tokens,5500);
        technicalCalls++;
        output={facts:[{id:"routing",category:"implementation",statement:"라우팅 기능을 구현한 TypeScript 프로젝트",evidence:[{source:"src/main.ts",quote:source}]}],unknowns:["개발 동기·기간·기여도 미확인"]};
      }else{assert.equal(payload.max_output_tokens,9000);aiCalls++;output=mockWriting(mockOutput);}
      return Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(output)}]}],usage:{input_tokens:1000,output_tokens:500}});
    }
    if(!url.startsWith("https://api.github.com/")) throw new Error("Unexpected external request");
    if(mode==="rate")return Response.json({}, {status:429,headers:{"retry-after":"120"}});
    if(mode==="network")throw new Error("offline");
    if(url.includes("/users/")) {
      if (paginated) {
        const page=Number(new URL(url).searchParams.get("page"));
        return Response.json(Array.from({length:page===1 ? 100 : 1},(_,index)=>{
          const number=(page-1)*100+index;
          return {...template,id:20000+number,name:`practice-${number}`,fork:true,full_name:`peeta0126/practice-${number}`,html_url:`https://github.com/peeta0126/practice-${number}`};
        }));
      }
      return Response.json(repos);
    }
    if(url.includes("/repositories/"))return Response.json(repos[0]);
    if(url.endsWith("/commits/main"))return Response.json({sha,commit:{tree:{sha:"tree"}}});
    if(url.endsWith(`/commits/${sha}`))return Response.json({commit:{message:"Add route module",author:{date:"2026-11-01T00:00:00Z"}},author:{login:"peeta0126"},files:[{filename:"src/main.ts",patch:`+${source}`}]});
    if(url.includes("/git/trees/"))return Response.json({truncated:false,tree:[{path:"src/main.ts",type:"blob",sha:`code-${source.length}`,size:source.length,mode:"100644"},{path:"README.md",type:"blob",sha:"readme",size:20,mode:"100644"},{path:".env",type:"blob",sha:"secret",size:20,mode:"100644"},
      ...(extraSource!=="none" ? Array.from({length:25},(_,i)=>({path:`server/auth${i}.ts`,type:"blob",sha:`extra-${i}`,size:100,mode:"100644"})) : []),
      ...(extraSource==="added" ? [{path:"src/zzz-new-feature.ts",type:"blob",sha:"extra-new",size:100,mode:"100644"}] : [])]});
    if(url.includes("/git/blobs/code-"))return Response.json({encoding:"base64",content:Buffer.from(source).toString("base64")});
    if(url.endsWith("/git/blobs/readme"))return Response.json({encoding:"base64",content:Buffer.from(readme).toString("base64")});
    if(url.includes("/git/blobs/extra-"))return Response.json({encoding:"base64",content:Buffer.from("export const newFeature = true;").toString("base64")});
    if(url.includes("/commits?"))return Response.json([{sha,commit:{message:"Add route module"}}]);
    if(url.includes("/pulls?"))return Response.json([]);
    if(url.includes("/issues?"))return Response.json([]);
    if(url.endsWith("/languages"))return Response.json({TypeScript:500});
    throw new Error(`Unexpected mock path: ${url}`);
  };
  try {
    await sql.unsafe(await readFile("db/001_portfolio.sql","utf8"));
    await sql.unsafe(await readFile("db/002_editorial.sql","utf8"));
    await t.test("스키마를 두 번 적용해도 데이터를 삭제하지 않는다",async()=>{
      const p=projects[0];await sql`insert into projects(slug,content,visibility) values(${p.slug},${sql.json(p)},'public')`;
      await sql.unsafe(await readFile("db/001_portfolio.sql","utf8"));
      const [row]=await sql`select content from projects where slug=${p.slug}`;assert.deepEqual(row.content,p);
    });
    await t.test("실제 마이그레이션·이관 스크립트는 재실행해도 기존 내용을 보존한다",async()=>{
      const run=promisify(execFile);
      for(const script of ["scripts/migrate.ts","scripts/seed.ts","scripts/seed.ts"]) {
        await run(process.execPath,["--import","tsx",script],{env:{...process.env,DATABASE_URL:process.env.DATABASE_URL},windowsHide:true});
      }
      const rows=await sql`select content from projects order by display_order`;assert.equal(rows.length,3);
      for (const p of projects)assert.deepEqual(rows.find(r=>r.content.slug===p.slug)?.content,p);
      const home=await sql`select content from portfolio_home_problem_solving order by display_order`;
      assert.deepEqual(home.map(row=>row.content),problemSolving);
      assert.equal(home.length,4);
    });
    await t.test("신규 저장소를 ID로 등록하고 중복 수집을 막는다",async()=>{
      await enqueue("discover","discover",{});assert.equal((await runOne()).status,"done");
      const rows=await sql`select * from projects where github_repo_id=123`;assert.equal(rows.length,1);assert.equal(rows[0].visibility,"private");
      await enqueue("discover","discover",{});await sql`update portfolio_jobs set available_at=now()+interval '1 hour' where kind='analyze'`;
      assert.equal((await runOne()).status,"done");
      assert.equal((await sql`select * from projects where github_repo_id=123`).length,1);
      await sql`update portfolio_jobs set available_at=now() where kind='analyze'`;
    });
    await t.test("실제 코드가 Mock AI 요청에 포함되고 승인 대기 상태로 저장된다",async()=>{
      const result=await runOne();assert.equal(result.status,"done",JSON.stringify(result));assert.equal(aiCalls,1);
      const [row]=await sql`select * from portfolio_content_drafts`;assert.equal(row.status,"pending");assert.equal(row.analysis_result.title,generated.title);assert.equal(row.analyzed_files.length,2);
      assert.equal(technicalCalls,1);assert.equal((await sql`select * from portfolio_technical_analysis`).length,1);
      const [p]=await sql`select * from projects where github_repo_id=123`;assert.equal(p.visibility,"private");assert.equal(p.analysis_status,"ai_update_proposed");
    });
    await t.test("동일 커밋과 README 오타만 바뀐 커밋은 AI를 다시 호출하지 않는다",async()=>{
      const [p]=await sql`select id from projects where github_repo_id=123`;
      await enqueue("analyze","repo:123",{projectId:p.id});assert.equal((await runOne()).status,"done");assert.equal(aiCalls,1);
      sha="b".repeat(40);readme="Typo fixed";await enqueue("analyze","repo:123",{projectId:p.id});assert.equal((await runOne()).status,"done");assert.equal(aiCalls,1);
    });
    await t.test("자동 게시 설정에서도 수동 수정 필드는 덮어쓰지 않는다",async()=>{
      const [p]=await sql`select * from projects where github_repo_id=123`;
      await sql`update projects set content=${sql.json({...p.content,description:"관리자가 직접 작성한 설명"})},locked_fields=${["description"]} where id=${p.id}`;
      await sql`update portfolio_settings set value=${sql.json({...defaults,autoPublish:true})}`;
      sha="c".repeat(40);source="export const features = ['routing', 'auth'];";
      await enqueue("analyze","repo:123",{projectId:p.id});assert.equal((await runOne()).status,"done");assert.equal(aiCalls,2);
      const [latest]=await sql`select * from projects where id=${p.id}`;assert.equal(latest.content.description,"관리자가 직접 작성한 설명");assert.equal(latest.visibility,"private");
    });
    await t.test("월간 예산 0이면 유료 요청 전에 차단하고 작업 상태를 남긴다",async()=>{
      await sql`update portfolio_settings set value=${sql.json({...defaults,monthlyBudget:0})}`;
      const [p]=await sql`select id from projects where github_repo_id=123`;sha="d".repeat(40);source="export const newFeature = true;";
      await enqueue("analyze","repo:123",{projectId:p.id});const result=await runOne();assert.equal(result.status,"error");assert.equal("code" in result && result.code,"MONTHLY_BUDGET_EXCEEDED");assert.equal(aiCalls,2);
      const [job]=await sql`select * from portfolio_jobs where dedupe_key='repo:123'`;assert.equal(job.status,"queued");assert.equal(job.error_message,"MONTHLY_BUDGET_EXCEEDED");
      await sql`update portfolio_jobs set status='done' where dedupe_key='repo:123'`;
    });
    await t.test("GitHub rate limit와 네트워크 오류를 재시도 가능한 오류로 반환한다",async()=>{
      mode="rate";await assert.rejects(github("/users/peeta0126/repos"),(e:unknown)=>e instanceof ServiceError && e.code==="RATE_LIMIT" && e.retryAfter===120);
      mode="network";await assert.rejects(github("/users/peeta0126/repos"),(e:unknown)=>e instanceof ServiceError && e.code==="NETWORK_ERROR");mode="normal";
    });
    await t.test("삭제·비공개로 목록에서 사라진 저장소는 공개 스냅샷에서도 제거한다",async()=>{
      await sql`update projects set visibility='public' where github_repo_id=123`;repos=[];
      await enqueue("discover","discover",{});assert.equal((await runOne()).status,"done");
      const [p]=await sql`select visibility from projects where github_repo_id=123`;assert.equal(p.visibility,"private");
      const [snap]=await sql`select content from portfolio_public_snapshot`;assert.equal(snap.content.length,projects.length);assert.ok(snap.content.every((p:{slug:string})=>projects.some(original=>original.slug===p.slug)));
    });
    await t.test("기한이 지난 작업은 복구하며 3회 실패 작업은 무한 반복하지 않는다",async()=>{
      await sql`insert into portfolio_jobs(kind,dedupe_key,payload,status,attempts,lease_until) values('discover','expired', '{}','running',3,now()-interval '1 minute')`;
      await runOne();const [j]=await sql`select status from portfolio_jobs where dedupe_key='expired'`;assert.equal(j.status,"failed");
    });
    await t.test("호출 한도도 예산과 별개로 적용한다",async()=>{
      await sql`update portfolio_settings set value=${sql.json({...defaults,monthlyBudget:100,monthlyCalls:0})}`;
      const [p]=await sql`select id from projects limit 1`;
      await assert.rejects(analyze(p.id,{sha,files:[{path:"src/main.ts",content:source,sha:"code"}],tree:[],commits:[],prs:[],languages:{},images:[],manifest:[],unchanged:false}),(e:unknown)=>e instanceof ServiceError && e.code==="MONTHLY_BUDGET_EXCEEDED");
      assert.equal(aiCalls,2);
    });
    await t.test("기본 분석 대상 밖에 추가된 코드도 우선 선별한다",async()=>{
      // The source collector must prioritize changed files rather than repeatedly sampling only the same entry points.
      const {collect}=await import("../../lib/automation/github");
      repos=[{id:123,name:"sample-project",full_name:"peeta0126/sample-project",private:false,fork:false,archived:false,description:"Mock project",html_url:"https://github.com/peeta0126/sample-project",homepage:null,default_branch:"main",created_at:"2026-01-01T00:00:00Z",updated_at:"2026-11-01T00:00:00Z",pushed_at:null,language:"TypeScript",topics:[]}];
      extraSource="base";const baseline=await collect(repos[0]);
      extraSource="added";const result=await collect(repos[0],baseline.manifest);
      assert.equal(baseline.files.length,18);assert.ok(result.files.some(f=>f.path==="src/zzz-new-feature.ts"));assert.ok(result.files.length<=18);extraSource="none";
    });
    await t.test("101개 저장소를 페이지별로 수집하고 진행 중인 전체 수집을 중복 예약하지 않는다",async()=>{
      paginated=true;await enqueue("discover","discover",{});assert.equal((await runOne()).status,"done");
      await enqueue("discover","discover",{});
      const pending=await sql`select payload from portfolio_jobs where kind='discover' and status='queued'`;
      assert.equal(pending.length,1);assert.equal(pending[0].payload.page,2);
      assert.equal((await runOne()).status,"done");
      const [count]=await sql`select count(*)::int as value from projects where github_repo_id>=20000`;assert.equal(count.value,101);
      assert.equal(aiCalls,2);
    });
    await t.test("잘못된 기본 근거는 진단을 남기고 유료 즉시 재호출 없이 큐 피드백으로 다시 생성한다",async()=>{
      await sql`update portfolio_settings set value=${sql.json({...defaults,monthlyBudget:100,monthlyCalls:100})}`;
      paginated=false;
      const [p]=await sql`select * from projects where github_repo_id=123`;
      sha="e".repeat(40);source="export const evidenceRetry = true;";
      mockOutput={...generated,evidence:[{claim:"잘못된 근거",sources:["src/nonexistent.ts"]}]};
      const before=aiCalls;
      await enqueue("analyze","repo:123",{projectId:p.id});
      assert.deepEqual(await runOne(),{status:"error",code:"INVALID_EVIDENCE"});
      assert.equal(aiCalls,before+1);
      assert.equal((await sql`select * from portfolio_content_drafts where commit_sha=${sha}`).length,0);
      const [job]=await sql`select * from portfolio_jobs where dedupe_key='repo:123'`;
      assert.equal(job.status,"queued");assert.equal(job.payload.evidenceFeedback.issues[0].reference,"src/nonexistent.ts");
      const [diagnostic]=await sql`select error_message from sync_logs where event_type='analysis_evidence_validation' order by id desc limit 1`;
      const details=JSON.parse(diagnostic.error_message);
      assert.ok(details.analyzedFiles.some((f:{path:string})=>f.path==="src/main.ts"));
      assert.deepEqual(details.submitted[0].references,["src/nonexistent.ts"]);
      assert.ok(!diagnostic.error_message.includes(source));
      mockOutput={...generated,evidence:[{claim:"검증 근거",sources:["./src/main.ts:1"]}]};
      await sql`update portfolio_jobs set available_at=now() where id=${job.id}`;
      assert.equal((await runOne()).status,"done");assert.equal(aiCalls,before+2);
      assert.ok(lastInput.evidenceFeedback);
      const [analysis]=await sql`select * from portfolio_content_drafts where commit_sha=${sha}`;
      assert.deepEqual(analysis.analysis_result.evidence[0].sources,["src/main.ts#L1"]);
    });
    await t.test("근거 부족·스키마 불량 Problem Solving은 항목만 제외하고 검토 대기로 기본 설명을 보존한다",async()=>{
      await sql`update portfolio_settings set value=${sql.json({...defaults,autoPublish:true,monthlyBudget:100,monthlyCalls:100})}`;
      const [p]=await sql`select id from projects where github_repo_id=123`;
      const trouble={title:"문제",problem:"문제",solution:"접근",result:"결과"};
      for(const [index,item] of [
        {...trouble,evidence:["src/nonexistent.ts"]},
        {...trouble,evidence:["src/main.ts"]},
        {...trouble,evidence:[]},
        {...trouble,evidence:"wrong-type"},
      ].entries()) {
        sha=String(index+1).repeat(40);source=`export const problemEvidence${index} = true;`;
        mockOutput={...generated,troubleshooting:[item]};
        await enqueue("analyze","repo:123",{projectId:p.id});assert.equal((await runOne()).status,"done");
        const [analysis]=await sql`select * from portfolio_content_drafts where commit_sha=${sha}`;
        assert.equal(analysis.status,"pending");assert.equal(analysis.analysis_result.description,generated.description);
        assert.deepEqual(analysis.analysis_result.troubleshooting,[]);assert.ok(analysis.analysis_result.reviewNotes.length);
      }
    });
    await t.test("기본 응답 스키마 오류는 INVALID_EVIDENCE와 구분하며 실패 반복은 3회에서 멈춘다",async()=>{
      const [p]=await sql`select id from projects where github_repo_id=123`;
      sha="f".repeat(40);source="export const schemaError = true;";
      mockOutput={...generated,tech:"invalid"};
      await enqueue("analyze","repo:123",{projectId:p.id});
      assert.deepEqual(await runOne(),{status:"error",code:"AI_SCHEMA_INVALID"});
      mockOutput={...generated,evidence:[{claim:"bad",sources:["missing.ts"]}]};
      for(let i=0;i<2;i++) {
        await sql`update portfolio_jobs set available_at=now() where dedupe_key='repo:123'`;
        assert.deepEqual(await runOne(),{status:"error",code:"INVALID_EVIDENCE"});
      }
      const [job]=await sql`select * from portfolio_jobs where dedupe_key='repo:123'`;
      assert.equal(job.status,"failed");assert.equal(job.attempts,3);
      assert.equal((await sql`select * from portfolio_content_drafts where commit_sha=${sha}`).length,0);
    });
    await t.test("실패·재생성 후에도 원본 프로젝트 3개와 홈 Problem Solving 4개를 보존한다",async()=>{
      const rows=await sql`select content from projects where github_repo_id is null`;
      assert.equal(rows.length,3);
      for(const p of projects)assert.deepEqual(rows.find(r=>r.content.slug===p.slug)?.content,p);
      const home=await sql`select content from portfolio_home_problem_solving order by display_order`;
      assert.deepEqual(home.map(row=>row.content),problemSolving);
    });
    await t.test("실행 중인 작업은 lease 만료 여부와 관계없이 큐 초기화를 차단한다",async()=>{
      for(const lease of ["1 hour","-1 hour"]) {
        await sql`insert into portfolio_jobs(kind,dedupe_key,payload,status,lease_until) values('analyze','reset-running','{}','running',now()+${lease}::interval)`;
        const before=await sql`select * from portfolio_jobs order by id`;
        await assert.rejects(resetQueue(),QueueRunningError);
        assert.deepEqual(await sql`select * from portfolio_jobs order by id`,before);
        assert.equal((await sql`select * from sync_logs where event_type='queue_reset'`).length,0);
        await sql`delete from portfolio_jobs where dedupe_key='reset-running'`;
      }
    });
    await t.test("큐만 초기화하고 프로젝트·분석·공개·수정·비용·기존 로그를 보존한다",async()=>{
      const tables=["projects","project_analysis","portfolio_content_drafts","portfolio_technical_analysis","project_problem_solving","portfolio_home_problem_solving","portfolio_public_snapshot","ai_usage","portfolio_settings","portfolio_images"];
      const before=await Promise.all(tables.map(table=>sql.unsafe(`select * from ${table} order by row_to_json(${table})::text`)));
      const logs=await sql`select * from sync_logs order by id`;
      for(const kind of ["discover","analyze"])for(const status of ["queued","done","failed"]) {
        await sql`insert into portfolio_jobs(kind,dedupe_key,payload,status) values(${kind},${`reset-${kind}-${status}`},'{}',${status})`;
      }
      const counts=await queueCounts();
      const result=await resetQueue();
      assert.deepEqual(result.before,counts);assert.deepEqual(result.after,[]);
      assert.equal(result.deleted,counts.reduce((sum,row)=>sum+row.count,0));
      for(const [index,table] of tables.entries())assert.deepEqual(await sql.unsafe(`select * from ${table} order by row_to_json(${table})::text`),before[index],table);
      const logsAfter=await sql`select * from sync_logs order by id`;
      assert.deepEqual([...logsAfter.slice(0,logs.length)],[...logs]);assert.equal(logsAfter.length,logs.length+1);
      assert.equal(logsAfter.at(-1)?.event_type,"queue_reset");
      assert.deepEqual(JSON.parse(logsAfter.at(-1)!.error_message),result);
    });
    await t.test("초기화 후 수동 동기화·분석을 다시 예약하고 중복 예약은 막는다 (외부 호출 없음)",async()=>{
      const beforeCalls=aiCalls;
      const [p]=await sql`select id from projects where github_repo_id=123`;
      await Promise.all([enqueue("discover","discover",{}),enqueue("discover","discover",{})]);
      await enqueue("analyze","repo:123",{projectId:p.id});await enqueue("analyze","repo:123",{projectId:p.id});
      const rows=await sql`select * from portfolio_jobs order by kind`;
      assert.equal(rows.length,2);assert.ok(rows.every(row=>row.status==="queued" && row.attempts===0));
      assert.equal(rows.find(row=>row.kind==="analyze")?.payload.projectId,p.id);
      assert.ok(rows.every(row=>!row.payload.evidenceFeedback));
      assert.equal(aiCalls,beforeCalls);
      assert.ok((await sql`select * from portfolio_content_drafts where project_id=${p.id}`).length>0);
      assert.equal((await resetQueue()).deleted,2);assert.equal((await resetQueue()).deleted,0);
    });
    await t.test("설명만 재작성하면 기술 사실을 재사용하고 새 초안 버전만 저장한다",async()=>{
      mockOutput=generated;
      const [technical]=await sql`select * from portfolio_technical_analysis order by created_at desc limit 1`;
      const [p]=await sql`select * from projects where id=${technical.project_id}`;
      const snapshots=await sql`select * from portfolio_public_snapshot`;
      const factsCalls=technicalCalls,writingCalls=aiCalls;
      const first=await rewriteDescription(p.id,technical.id);
      const second=await rewriteDescription(p.id,technical.id);
      assert.equal(technicalCalls,factsCalls);assert.equal(aiCalls,writingCalls+2);
      const [a]=await sql`select * from portfolio_content_drafts where id=${second}`;
      assert.equal(a.parent_id,first);assert.equal(a.status,"pending");
      assert.deepEqual((await sql`select * from projects where id=${p.id}`)[0],p);
      assert.deepEqual(await sql`select * from portfolio_public_snapshot`,snapshots);
    });
    await t.test("초안 수동 수정·낙관적 잠금·승인 시 기존 수동 보호와 공개 상태를 유지한다",async()=>{
      const [draft]=await sql`select * from portfolio_content_drafts order by created_at desc limit 1`;
      const [p]=await sql`select * from projects where id=${draft.project_id}`;
      const edited={...draft.generated_content,description:"덮어쓰면 안 되는 새 제안",detail:{...draft.generated_content.detail,result:"관리자가 확인해 직접 작성한 결과"}};
      await editDraft(draft.id,1,edited);
      await assert.rejects(editDraft(draft.id,1,edited),/EDIT_CONFLICT/);
      await assert.rejects(reviewDraft(draft.id,1,"approve",false,new Date(p.updated_at).toISOString()),/EDIT_CONFLICT/);
      await assert.rejects(reviewDraft(draft.id,2,"approve",false,"2000-01-01T00:00:00.000Z"),/EDIT_CONFLICT/);
      await reviewDraft(draft.id,2,"approve",false,new Date(p.updated_at).toISOString());
      const [after]=await sql`select * from projects where id=${p.id}`;
      assert.equal(after.content.description,p.content.description);assert.equal(after.visibility,p.visibility);
      assert.equal(after.content.detail.result,edited.detail.result);assert.ok(after.locked_fields.includes("detail.result"));
      await assert.rejects(reviewDraft(draft.id,2,"approve",true,new Date(after.updated_at).toISOString()),/ALREADY_REVIEWED/);
    });
    await t.test("기존 근거 표식 정리는 원문·메타데이터를 보존한 초안이며 승인 전 공개되지 않는다",async()=>{
      const [p]=await sql`select * from projects where github_repo_id=123`;
      const content={...p.content,description:"라우팅 프로젝트입니다. [근거: src/main.ts]"};
      await sql`update projects set content=${sql.json(content)} where id=${p.id}`;
      const id=await createCitationCleanup(p.id);
      const [draft]=await sql`select * from portfolio_content_drafts where id=${id}`;
      assert.deepEqual(draft.base_content,content);assert.equal(draft.generated_content.description,"라우팅 프로젝트입니다.");
      assert.deepEqual(draft.analysis_result.citations,[{field:"description",references:["src/main.ts"]}]);
      assert.deepEqual((await sql`select content from projects where id=${p.id}`)[0].content,content);
      const calls=aiCalls;const [current]=await sql`select * from projects where id=${p.id}`;
      await reviewDraft(id,1,"reject",false,new Date(current.updated_at).toISOString());
      assert.equal(aiCalls,calls);assert.deepEqual((await sql`select content from projects where id=${p.id}`)[0].content,content);
    });
    await t.test("추가형 편집 스키마를 반복 적용해도 초안·사실·기존 원문은 보존한다",async()=>{
      const before=await sql`select * from portfolio_content_drafts order by id`;
      await sql.unsafe(await readFile("db/002_editorial.sql","utf8"));
      assert.deepEqual(await sql`select * from portfolio_content_drafts order by id`,before);
      const original=await sql`select content from projects where github_repo_id is null`;
      for(const p of projects)assert.deepEqual(original.find(r=>r.content.slug===p.slug)?.content,p);
      assert.deepEqual((await sql`select content from portfolio_home_problem_solving order by display_order`).map(r=>r.content),problemSolving);
    });
    await t.test("기존 커밋 분석이 있어도 관리자 명시 요청으로 새 상세 초안을 만들 수 있다",async()=>{
      const [p]=await sql`select * from projects where github_repo_id=123`;
      const before=p.content,writing=aiCalls,technical=technicalCalls;
      const [cached]=await sql`select commit_sha from portfolio_technical_analysis where project_id=${p.id} order by created_at desc limit 1`;
      sha=cached.commit_sha;
      await sql`insert into project_analysis(project_id,commit_sha,analysis_result) values(${p.id},${sha},${sql.json(generated)}) on conflict(project_id,commit_sha) do nothing`;
      await enqueue("analyze","repo:123",{projectId:p.id,refreshTechnical:true});
      assert.equal((await runOne()).status,"done");
      assert.equal(aiCalls,writing+1);assert.equal(technicalCalls,technical);
      assert.deepEqual((await sql`select content from projects where id=${p.id}`)[0].content,before);
    });
    await t.test("승인된 로컬 원고만 수동 반영하며 기존 프로젝트·홈·분석·비용과 수동 보호를 보존한다",async()=>{
      const sample=JSON.parse(await readFile("docs/drafts/augment-alkkagi.json","utf8"));
      const expected={...sample.proposal,description:"배포 전 검토한 원문"};
      await sql`insert into projects(slug,github_repo_id,repo_name,content,visibility,locked_fields) values(${expected.slug},1431052115,'AugmentAlkkagi',${sql.json(expected)},'public',${["description"]})`;
      const calls=aiCalls,tech=technicalCalls;
      await assert.rejects(publishPreparedAugment(sample,{...expected,description:"다른 원문"}),/CONTENT_CHANGED_SINCE_REVIEW/);
      await assert.rejects(publishPreparedAugment({...sample,proposal:{...sample.proposal,period:"추정 기간"}},expected),/UNAPPROVED_METADATA_CHANGE/);
      const result=await publishPreparedAugment(sample,expected);
      assert.equal(result.alreadyApplied,false);
      const [p]=await sql`select * from projects where slug=${expected.slug}`;
      assert.deepEqual(p.content,sample.proposal);assert.equal(p.visibility,"public");assert.ok(p.locked_fields.includes("description"));
      assert.equal((await sql`select * from portfolio_content_drafts where project_id=${p.id}`)[0].status,"published");
      assert.equal((await sql`select * from project_problem_solving where project_id=${p.id}`).length,3);
      assert.equal((await publishPreparedAugment(sample,expected)).alreadyApplied,true);
      assert.equal((await sql`select * from portfolio_content_drafts where project_id=${p.id}`).length,1);
      assert.equal(aiCalls,calls);assert.equal(technicalCalls,tech);
      const originals=await sql`select content from projects where slug=any(${projects.map(p=>p.slug)})`;
      for(const p of projects)assert.deepEqual(originals.find(r=>r.content.slug===p.slug)?.content,p);
      assert.deepEqual((await sql`select content from portfolio_home_problem_solving order by display_order`).map(r=>r.content),problemSolving);
    });
  } finally {
    globalThis.fetch=originalFetch;await sql.end({timeout:2});await server.stop();await memory.close();
  }
});
