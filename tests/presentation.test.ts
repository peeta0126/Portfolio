import test from "node:test";
import assert from "node:assert/strict";
import { projects } from "../data/projects";
import { projects as archived } from "../data/project-archive";
import { problemSolving } from "../data/problem-solving";
import { groupProjects, collectProblems, publicPeriod, selectHomeProblems } from "../lib/presentation";
import { projectSchema } from "../lib/automation/schema";

test("대표 순서와 기타 프로젝트를 분리하며 입력 및 관리자 상대 순서를 보존한다",()=>{
  const before=structuredClone(projects);
  const {featured,other}=groupProjects(projects);
  assert.deepEqual(featured.map(p=>p.title),["별빛 타로","Focus Hub","증강 알까기"]);
  assert.equal(other.length+featured.length,projects.length);
  assert.deepEqual(other.map(p=>p.slug),projects.filter(p=>!featured.some(f=>f.slug===p.slug)).map(p=>p.slug));
  assert.deepEqual(projects,before);
  assert.equal(groupProjects([]).featured.length,0);
});
test("주어진 공개 목록 밖의 프로젝트·문제 해결 사례를 복원하지 않는다",()=>{
  const hidden=projects.find(p=>p.title==="별빛 타로")!;
  const publicProjects=projects.filter(p=>p.slug!==hidden.slug);
  const saved=[{project_slug:hidden.slug,content:{project:hidden.title,title:"숨긴 사례",problem:"private",solution:"private",result:"private"}}];
  assert.ok(!collectProblems(publicProjects,saved).some(p=>p.slug===hidden.slug));
  assert.ok(!groupProjects(publicProjects).featured.some(p=>p.slug===hidden.slug));
});
test("기존 홈 사례를 보존하고 새 사례는 프로젝트별 제목으로 중복을 제거한다",()=>{
  const saved=problemSolving.map(content=>({project_slug:archived.find(p=>p.title===content.project)!.slug,content}));
  const problems=collectProblems(projects,saved,archived);
  for(const original of saved) assert.ok(problems.some(p=>p.title===original.content.title&&p.slug===original.project_slug));
  assert.equal(new Set(problems.map(p=>`${p.slug}:${p.title}`)).size,problems.length);
  assert.equal(problems[0].title,"AI 평균 응답시간 33.2% 단축");
  assert.equal(problems.length,10);
});
test("기존 slug·이미지를 보존하며 공개 정적 데이터에 비공개 신규 저장소를 추가하지 않는다",()=>{
  assert.equal(projectSchema.array().parse(projects).length,7);
  for(const original of archived) assert.ok(projects.some(p=>p.slug===original.slug&&p.github===original.github));
  assert.deepEqual(projects[0].detail?.gallery,archived[0].detail?.gallery);
  assert.ok(!projects.some(p=>p.title==="MAKEGROUND"));
  assert.equal(projects.find(p=>p.title==="CREW SPACE")?.tech.includes("Next.js"),false);
});
test("선택 근거 링크는 이전 콘텐츠와 호환되며 위험 URL은 거부한다",()=>{
  const p=projects.find(p=>p.title==="별빛 타로")!;
  assert.ok(projectSchema.safeParse(p).success);
  const bad=structuredClone(p);
  bad.detail!.troubleshooting![0].evidence![0].url="javascript:alert(1)";
  assert.equal(projectSchema.safeParse(bad).success,false);
  for(const original of archived) assert.ok(projectSchema.safeParse(original).success);
});

test("홈 4개 요약 선택은 기존 전체 사례와 회귀 테스트 기록을 변경하지 않는다",()=>{
  const saved=problemSolving.map(content=>({project_slug:archived.find(p=>p.title===content.project)!.slug,content}));
  const all=collectProblems(projects,saved,archived);
  const before=structuredClone(all);
  assert.deepEqual(selectHomeProblems(all).map(p=>p.project),["별빛 타로","Focus Hub","증강 알까기","Voyager Atelier"]);
  assert.deepEqual(all,before);
  assert.equal(all.length,10);
  assert.ok(all.some(p=>p.title==="발사력 UI 초기화"));
  assert.ok(all.some(p=>p.title==="동결 상태에서 턴 진행"));
  assert.deepEqual(selectHomeProblems(all.filter(p=>p.project!=="Focus Hub")).map(p=>p.project),["별빛 타로","증강 알까기","Voyager Atelier"]);
});

test("미확인 기간은 공개 표시에서만 숨기고 원본 및 검증된 기간은 보존한다",()=>{
  for(const period of ["기간 확인 필요","개발 기간 확인 중","미정",""]) assert.equal(publicPeriod(period),undefined);
  assert.equal(publicPeriod("2026.10 — 현재"),"2026.10 — 현재");
  assert.equal(projects.find(p=>p.slug==="tarot-shorts-automation")?.period,"개발 기간 확인 중");
});
