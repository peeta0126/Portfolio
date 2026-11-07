import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { technicalSchema, writingSchema, validateTechnical, validateWriting, separateLegacyEvidence, type SourcePacket } from "../lib/automation/editorial";
import { mergeProposal, selectFiles } from "../lib/automation/core";
import { projects } from "../data/projects";
import { mockWriting } from "./fixtures/editorial";

const source:SourcePacket={sha:"a".repeat(40),files:[{path:"src/main.ts",sha:"file",content:"export const routing = true;"},{path:"tests/main.test.ts",sha:"test",content:"assert.equal(routing, true);"}],commits:[{id:"b".repeat(40),message:"fix: retain local targeting during host snapshots"}],prs:[],tree:["src/main.ts","tests/main.test.ts","unread.ts"]};
const facts=technicalSchema.parse({facts:[{id:"routing",category:"implementation",statement:"라우팅 기능",evidence:[{source:"src/main.ts",quote:"export const routing = true;"}]}],unknowns:["개인 동기·기여·기간 미확인"]});
const generated={title:"라우팅 프로젝트",subtitle:"경로 처리",description:"화면의 경로를 처리하는 프로젝트",projectType:"Web",tech:["TypeScript"],overview:"라우팅 기능을 제공합니다.",features:["경로별 화면 분리"],implementation:["경로 처리를 모듈로 나눕니다."],architecture:"모듈에서 경로를 처리합니다.",considerations:[],troubleshooting:[],evidence:[{claim:"라우팅",sources:["src/main.ts"]}],reviewNotes:[]};

test("사실의 참조·원문 발췌·ID를 검증하고 코드에서 개인 경험을 추정하지 않는다",()=>{
  assert.deepEqual(validateTechnical(facts,source),facts);
  for(const evidence of [{source:"unread.ts",quote:"exists"},{source:"src/main.ts",quote:"fabricated"}])assert.throws(()=>validateTechnical({...facts,facts:[{...facts.facts[0],evidence:[evidence]}]},source),/INVALID_FACT_EVIDENCE/);
  assert.throws(()=>validateTechnical({...facts,facts:[facts.facts[0],facts.facts[0]]},source),/DUPLICATE_FACT_ID/);
  assert.throws(()=>validateTechnical({...facts,facts:[{...facts.facts[0],category:"contribution"}]},source),/UNVERIFIED_EXPERIENCE/);
});
test("본문의 근거 표식·없는 사실·누락된 필드 근거를 거부한다",()=>{
  const valid=mockWriting(generated);
  assert.equal(validateWriting(valid,facts,source).title,generated.title);
  assert.throws(()=>validateWriting({...valid,description:"설명 [근거: src/main.ts]"},facts,source),/INLINE_EVIDENCE_IN_PROSE/);
  assert.throws(()=>validateWriting({...valid,fieldEvidence:[]},facts,source),/MISSING_FIELD_EVIDENCE/);
  assert.throws(()=>validateWriting({...valid,fieldEvidence:[{field:"title",factIds:["invented"]}]},facts,source),/UNKNOWN_FACT_REFERENCE/);
});
test("근거 없는 개발 동기·직접 기여·학습 경험·측정 성과를 차단한다",()=>{
  for(const [key,value,error] of [["goal","개인 경험을 해결하려고 만들었습니다.","UNVERIFIED_INTENT"],["roleSummary","전체 기능을 개발했습니다.","UNVERIFIED_CONTRIBUTION"],["result","속도를 95% 개선했습니다.","UNVERIFIED_MEASUREMENT"]]) {
    const base=mockWriting(generated);
    const candidate=mockWriting({...base,portfolio:{...base.portfolio,[key]:value},fieldEvidence:undefined});
    assert.throws(()=>validateWriting(candidate,facts,source),new RegExp(error));
  }
  assert.throws(()=>validateWriting(mockWriting({...generated,overview:"저는 상태 관리의 중요성을 배웠습니다."}),facts,source),/UNVERIFIED_EXPERIENCE/);
});
test("미확인 회고는 비공개 초안으로 남고 병합은 기존 역할·기간·유형·이미지·수동 필드를 보존한다",()=>{
  const raw=mockWriting(generated);raw.portfolio={...raw.portfolio,retrospectiveDraft:"상태 경계를 나눈 경험에 대한 본인의 회고를 확인하세요."};
  const validated=validateWriting(raw,facts,source);
  const old=projects[0],next=mergeProposal(old,validated,["title","description","detail.overview"]);
  assert.equal(next.title,old.title);assert.equal(next.description,old.description);assert.equal(next.period,old.period);assert.equal(next.kind,old.kind);
  assert.equal(next.detail?.retrospective,old.detail?.retrospective);assert.equal(next.detail?.roleSummary,old.detail?.roleSummary);
  assert.deepEqual(next.detail?.gallery,old.detail?.gallery);assert.ok(!JSON.stringify(next).includes(raw.portfolio.retrospectiveDraft));
});
test("Problem Solving은 변경 이력과 검증 근거가 있는 항목만 남기고 인덱스별 근거도 함께 옮긴다",()=>{
  const trouble={title:"타기팅 보존",problem:"스냅샷이 로컬 입력을 취소",solution:"로컬 선택 상태를 분리",result:"선택 유지 조건을 검사하는 회귀 테스트가 추가됨",evidence:["b".repeat(40),"tests/main.test.ts"]};
  const extended=validateTechnical({...facts,facts:[...facts.facts,{id:"history",category:"history",statement:"타기팅 변경 이력",evidence:[{source:"b".repeat(40),quote:"retain local targeting"}]},{id:"tested",category:"test",statement:"테스트 코드 확인",evidence:[{source:"tests/main.test.ts",quote:"assert.equal(routing, true);"}]}]},source);
  const candidate=mockWriting({...generated,troubleshooting:[{...trouble,evidence:["missing.ts"]},trouble]});
  candidate.fieldEvidence=candidate.fieldEvidence.map(e=>e.field.startsWith("troubleshooting.1.")?{...e,factIds:["history","tested"]}:e);
  const result=validateWriting(candidate,extended,source);
  assert.equal(result.troubleshooting.length,1);assert.equal(result.description,generated.description);
  assert.ok(result.fieldEvidence?.some(e=>e.field==="troubleshooting.0.result"&&e.factIds.includes("tested")));
});
test("기존 근거 분리 제안은 원문을 수정하지 않고 출처 목록과 검토 필요 상태를 남긴다",()=>{
  const old={description:"프로젝트 소개 [근거: README.md, src/main.ts]",detail:{overview:"개요 [source: missing.ts]"}};
  const preview=separateLegacyEvidence(old);
  assert.equal(old.description,"프로젝트 소개 [근거: README.md, src/main.ts]");assert.equal(preview.original,old);
  assert.deepEqual(preview.proposal,{description:"프로젝트 소개",detail:{overview:"개요"}});
  assert.deepEqual(preview.citations[0].references,["README.md","src/main.ts"]);assert.equal(preview.requiresReview,true);
});
test("이펙트 Scene이 많아도 핵심 게임·네트워크 코드와 문서·테스트를 함께 선별한다",()=>{
  const paths=["project.godot","README.md","docs/NETWORK_ARCHITECTURE.md","docs/TEST_REPORT.md","scripts/core/game_manager.gd","scripts/network/network_manager.gd","scripts/augments/augment_manager.gd","tests/test_network.gd",...Array.from({length:40},(_,i)=>`scenes/effects/${i}.tscn`)];
  const selected=selectFiles(paths.map(path=>({path,size:path.includes("game_manager")?80000:100,sha:"sha",type:"blob",mode:"100644"})));
  for(const path of paths.slice(0,8))assert.ok(selected.some(f=>f.path===path),path);
  assert.equal(selected.length,18);
});
test("새 OpenAI 응답 스키마는 중첩 객체까지 required 및 additionalProperties=false를 만족한다",()=>{
  for(const schema of [technicalSchema,writingSchema]) {
    function walk(node:unknown) {
      if(!node||typeof node!=="object")return;
      const value=node as Record<string,unknown>;
      if(value.type==="object") {
        assert.equal(value.additionalProperties,false);
        assert.deepEqual([...(value.required as string[])].sort(),Object.keys(value.properties as object).sort());
      }
      for(const child of Object.values(value))if(Array.isArray(child))child.forEach(walk);else walk(child);
    }
    walk(z.toJSONSchema(schema));
  }
});
