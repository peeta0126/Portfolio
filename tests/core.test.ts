import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { projects } from "../data/projects";
import { problemSolving } from "../data/problem-solving";
import { defaults, generatedSchema, imageUrl, projectSchema, safeUrl } from "../lib/automation/schema";
import { editedFields, eligible, isSource, meaningfulHash, mergeProposal, redact, selectFiles } from "../lib/automation/core";
import { hashPassword, checkPassword, signSession, validSession } from "../lib/automation/session";
import { imageType } from "../lib/automation/images";
import { validateEvidence } from "../lib/automation/evidence";

const generated=generatedSchema.parse({title:"새 제목",subtitle:"구현 요약",description:"코드에 근거한 설명",projectType:"Web",tech:["TypeScript"],overview:"개요",features:["라우팅"],implementation:["서버 입력 검증"],architecture:"서버와 클라이언트 분리",considerations:[],troubleshooting:[],evidence:[{claim:"라우팅",sources:["app/page.tsx"]}],reviewNotes:[]});

const evidenceSource = { sha:"a".repeat(40), files:[{path:"app/page.tsx",sha:"file-sha",content:"line one\nline two"}], commits:[{id:"b".repeat(40)}], prs:[{id:"pr:3"}], tree:["app/page.tsx","src/unread.ts"] };
test("실제 분석 파일의 표기 차이와 유효한 줄 범위만 정규화한다",()=>{
  for (const ref of ["app/page.tsx","./app/page.tsx","app\\page.tsx","app/page.tsx:1-2","app/page.tsx#L1-L2","pr:3","b".repeat(40)]) {
    const result=validateEvidence({...generated,evidence:[{claim:"근거",sources:[ref]}]},evidenceSource);
    assert.equal(result.basicInvalid,false,ref);
    assert.equal(result.diagnostics.issues.length,0);
    assert.ok(result.generated.evidence[0].sources[0]);
  }
});
test("읽지 않은 파일·없는 파일·모호한 경로·범위·SHA를 승인하지 않는다",()=>{
  for (const ref of ["src/unread.ts","missing.ts","page.tsx","APP/page.tsx","repo/app/page.tsx","../app/page.tsx","/app/page.tsx","app/page.tsx:0","app/page.tsx:3","app/page.tsx:2-1","a".repeat(7),evidenceSource.sha,"pr:99"]) {
    const result=validateEvidence({...generated,evidence:[{claim:"근거",sources:[ref]}]},evidenceSource);
    assert.equal(result.basicInvalid,true,ref);
    assert.deepEqual(result.diagnostics.analyzedFiles,[{path:"app/page.tsx",sha:"file-sha"}]);
    assert.equal(result.diagnostics.issues[0].reason,ref==="src/unread.ts" ? "FILE_NOT_ANALYZED" : "UNKNOWN_OR_INVALID_REFERENCE");
  }
});
test("Problem Solving만 근거가 부족하면 제외하고 기본 설명과 유효한 항목은 보존한다",()=>{
  const trouble={title:"라우팅 오류",problem:"실패 기록",solution:"수정 기록",result:"검증 기록"};
  const result=validateEvidence({...generated,troubleshooting:[
    {...trouble,evidence:["app/page.tsx"]},
    {...trouble,evidence:["pr:3","missing.ts"]},
    {...trouble,evidence:["pr:3","./app/page.tsx"]},
    {...trouble,result:" ",evidence:["pr:3"]},
  ]},evidenceSource);
  assert.equal(result.basicInvalid,false);assert.equal(result.generated.description,generated.description);
  assert.equal(result.generated.troubleshooting.length,1);
  assert.deepEqual(result.generated.troubleshooting[0].evidence,["pr:3","app/page.tsx"]);
  assert.ok(result.generated.reviewNotes.length);
});
test("기존 데이터와 백업을 바이트 단위로 보존한다",async()=>{
  for(const file of ["projects.ts","problem-solving.ts"])assert.deepEqual(await readFile(`data/${file}`),await readFile(`backups/original/${file}`));
  assert.equal(projects.length,3);assert.equal(problemSolving.length,4);
  assert.equal(projectSchema.array().parse(projects).length,3);
});
test("원본 코드·설정은 포함하고 비밀정보·산출물·바이너리는 제외한다",()=>{
  for(const path of ["app/page.tsx","server/auth.ts","prisma/schema.prisma","project.godot","scripts/player.gd","src/main.rs","game/clock.ts"])assert.equal(isSource(path),true,path);
  for(const path of [".env.local","server/.env.production","credentials.json","config/private-key.json","node_modules/x/index.ts",".godot/export.gd","dist/bundle.js","package-lock.json","image.png","a.pem"])assert.equal(isSource(path),false,path);
});
test("파일 수·크기 상한 및 심볼릭 링크 제외",()=>{
  const files=Array.from({length:80},(_,i)=>({path:`src/file${i}.ts`,sha:String(i),size:100,type:"blob",mode:"100644"}));
  files.push({path:"package.json",sha:"p",size:100,type:"blob",mode:"100644"},{path:"src/large.ts",sha:"l",size:200000,type:"blob",mode:"100644"},{path:"src/link.ts",sha:"s",size:10,type:"blob",mode:"120000"});
  const selected=selectFiles(files);assert.equal(selected.length,18);assert.equal(selected[0].path,"package.json");assert.ok(!selected.some(f=>f.path.includes("large")||f.path.includes("link")));
});
test("README·포맷만 바뀌면 분석 캐시를 재사용한다",()=>{
  const original=[{path:"src/main.ts",content:"const value = 1;"},{path:"README.md",content:"원본"}];
  assert.equal(meaningfulHash(original),meaningfulHash([{path:"src/main.ts",content:"const  value = 1;\n"},{path:"README.md",content:"오타 수정"}]));
  assert.notEqual(meaningfulHash(original),meaningfulHash([{path:"src/main.ts",content:"const value = 2;"}]));
});
test("새 저장소 기본 정책은 공개·비 Fork·비 실습",()=>{
  const repo={name:"portfolio",private:false,fork:false,archived:false};
  assert.ok(eligible(repo,defaults));assert.equal(defaults.autoPublish,false);
  for(const change of [{private:true},{fork:true},{archived:true},{name:"test-project"}])assert.equal(eligible({...repo,...change},defaults),false);
  assert.ok(eligible({...repo,fork:true},{...defaults,includeForks:true}));
});
test("수동 수정은 필드별로 보호하고 기존 상세·이미지·기여도는 유지한다",()=>{
  const current=projects[0];const next=mergeProposal(current,generated,["description","detail.overview","detail.troubleshooting"]);
  assert.equal(next.description,current.description);assert.equal(next.detail?.overview,current.detail?.overview);assert.deepEqual(next.detail?.troubleshooting,current.detail?.troubleshooting);
  assert.equal(next.title,generated.title);assert.equal(next.github,current.github);assert.equal(next.thumbnail,current.thumbnail);assert.deepEqual(next.detail?.gallery,current.detail?.gallery);assert.equal(next.detail?.contributionNote,current.detail?.contributionNote);
  assert.deepEqual(editedFields(current,{...current,detail:{...current.detail,overview:"수동 수정"}}),["detail.overview"]);
  const reordered={...current,detail:{...current.detail,troubleshooting:current.detail?.troubleshooting?.map(t=>({result:t.result,solution:t.solution,problem:t.problem,title:t.title}))}};
  assert.deepEqual(editedFields(current,reordered),[]);
});
test("Structured Output은 근거 없는 필드·잘못된 타입을 거부한다",()=>{
  assert.equal(generatedSchema.safeParse({...generated,tech:"React"}).success,false);
  assert.equal(generatedSchema.safeParse({...generated,evidence:[]}).success,false);
  assert.equal(generatedSchema.safeParse({...generated,unverifiedScore:95}).success,false);
  assert.equal(generatedSchema.safeParse({...generated,troubleshooting:[{title:"추정",problem:"문제",solution:"해결",result:"결과",evidence:[]}]}).success,false);
});
test("외부 URL 및 이미지 입력을 검증한다",()=>{
  for(const url of ["javascript:alert(1)","http://example.com","https://localhost/a","https://127.0.0.1/a","https://2130706433/a","https://user:pass@example.com"])assert.equal(safeUrl.safeParse(url).success,false,url);
  assert.ok(safeUrl.safeParse("https://github.com/peeta0126/CrewSpace").success);
  assert.ok(imageUrl.safeParse("/projects/starlight-tarot.webp").success);
  assert.equal(imageUrl.safeParse("//evil.example.com/a.png").success,false);assert.equal(imageUrl.safeParse("https://example.com/a.svg").success,false);
});
test("키 패턴과 소스 내 자격 증명을 마스킹한다",()=>{
  const value=redact('const token = "github_pat_abc123456789012345"; const apiKey = "supersecret"; sk-12345678901234567890');
  assert.ok(!value.includes("supersecret"));assert.ok(!value.includes("github_pat_"));assert.ok(!value.includes("sk-"));
});
test("관리자 비밀번호는 scrypt 검증하고 세션 변조·만료·키 교체를 거부한다",()=>{
  const secret="s".repeat(40),hash=hashPassword("long-private-test-password"),now=Date.now();
  assert.ok(checkPassword("long-private-test-password",hash));assert.equal(checkPassword("wrong",hash),false);
  const token=signSession(secret,hash,now+1000);assert.ok(validSession(token,secret,hash,now));
  assert.equal(validSession(`${token}x`,secret,hash,now),false);assert.equal(validSession(token,secret,hash,now+2000),false);
  assert.equal(validSession(token,"other".repeat(10),hash,now),false);assert.equal(validSession(token,secret,hashPassword("changed"),now),false);
});
test("이미지 매직 바이트 검증으로 SVG·HTML을 거부한다",()=>{
  assert.equal(imageType(Buffer.from('<svg onload="alert(1)"></svg>')),null);
  assert.equal(imageType(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(20)])),"image/png");
  assert.equal(imageType(Buffer.from("RIFF1234WEBPsomepayload")),"image/webp");
});
