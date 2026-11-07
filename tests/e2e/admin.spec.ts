import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { projects } from "../../data/projects";

const origin="http://127.0.0.1:3107";
test.describe.configure({mode:"serial"});
test("데스크톱·모바일 공개 페이지와 기존 3개 프로젝트를 유지한다",async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  for(const width of [1440,375]) {
    await page.setViewportSize({width,height:900});await page.goto("/");
    await expect(page.locator("#projects a[href^='/projects/']")).toHaveCount(3);
    for(const p of projects)await expect(page.locator("#projects")).toContainText(p.title);
    await expect(page.locator("#problem-solving article")).toHaveCount(4);
    await expect(page.locator("body")).not.toContainText("검토 대기 프로젝트");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`artifacts/public-${width}.png`,fullPage:true});
  }
  await page.getByRole("button",{name:"다크 테마로 변경"}).click();
  await page.screenshot({path:"artifacts/public-dark-mobile.png",fullPage:true});
  for(const p of projects) {
    await page.goto(`/projects/${p.slug}`);await expect(page.locator("h1")).toHaveText(p.title);
    await expect(page.locator("main")).toContainText(p.detail!.overview!);
  }
  await page.goto("/projects/github-999");await expect(page.getByRole("heading",{name:"Page not found."})).toBeVisible();
  expect(errors).toEqual([]);
});
test("인증 없는 관리자 API·업로드·Cron·위조 Webhook을 차단한다",async({request})=>{
  expect((await request.get("/api/admin")).status()).toBe(401);
  expect((await request.post("/api/admin",{data:{action:"sync"},headers:{origin}})).status()).toBe(401);
  expect((await request.post("/api/admin",{data:{action:"resetQueue",confirmed:true},headers:{origin}})).status()).toBe(401);
  expect((await request.post("/api/admin/upload",{data:"file",headers:{origin}})).status()).toBe(401);
  expect((await request.get("/api/cron")).status()).toBe(401);
  expect((await request.post("/api/github/webhook",{data:{},headers:{"x-hub-signature-256":"sha256=fake"}})).status()).toBe(401);
  const payload=JSON.stringify({});const signature=`sha256=${createHmac("sha256","w".repeat(40)).update(payload).digest("hex")}`;
  expect((await request.post("/api/github/webhook",{data:payload,headers:{"x-hub-signature-256":signature,"x-github-event":"ping"}})).status()).toBe(200);
});
test("관리자 로그인·수정·승인 시 수동 필드 보호·공개 전환을 수행한다",async({page})=>{
  await page.goto("/admin");await page.getByLabel("비밀번호",{exact:true}).fill("test-password-for-isolated-browser");await page.getByRole("button",{name:"로그인",exact:true}).click();
  await expect(page.getByRole("button",{name:"로그아웃"})).toBeVisible();
  await page.getByRole("button",{name:/검토 대기 프로젝트/}).click();
  const editor=page.getByLabel("프로젝트 데이터",{exact:true});await expect(editor).toBeVisible();
  await page.setViewportSize({width:375,height:812});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:"artifacts/admin-editor-mobile.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});
  const content=JSON.parse(await editor.inputValue());content.description="관리자가 직접 작성하고 보호한 설명";
  await editor.fill(JSON.stringify(content,null,2));await page.getByRole("button",{name:"변경 저장"}).click();
  await expect(page.getByRole("status")).toContainText("저장되었습니다");
  await page.getByRole("button",{name:/AI 검토/}).click();await expect(page.getByText("승인 후 내용",{exact:true})).toBeVisible();
  await page.screenshot({path:"artifacts/admin-review-desktop.png",fullPage:true});
  await page.getByRole("button",{name:"승인 후 게시",exact:true}).click();await expect(page.getByRole("status")).toContainText("저장되었습니다");
  await page.goto("/projects/github-999");await expect(page.locator("h1")).toHaveText("Mock 새 프로젝트");await expect(page.locator("main")).toContainText("관리자가 직접 작성하고 보호한 설명");
  await page.goto("/admin");await page.getByRole("button",{name:/Mock 새 프로젝트/}).click();await page.getByLabel("공개 상태").selectOption("private");
  await page.getByRole("button",{name:"변경 저장"}).click();await expect(page.getByRole("status")).toContainText("저장되었습니다");
  await page.goto("/");await expect(page.locator("#projects a[href^='/projects/']")).toHaveCount(3);
  await page.goto("/projects/github-999");expect(await page.locator("h1").textContent()).not.toContain("Mock 새 프로젝트");
});
test("관리자 API가 CSRF·수정 충돌·위험 URL을 검증하고 업로드를 보호한다",async({request})=>{
  const login=await request.post("/api/admin/session",{data:{password:"test-password-for-isolated-browser"},headers:{origin}});expect(login.status()).toBe(200);
  const cookies=login.headers()["set-cookie"];expect(cookies).toContain("HttpOnly");expect(cookies).toContain("SameSite=strict");
  expect((await request.post("/api/admin",{data:{action:"sync"},headers:{origin:"https://evil.example.com"}})).status()).toBe(403);
  const state=await (await request.get("/api/admin")).json();const p=state.projects[0];
  const body={action:"edit",projectId:p.id,content:p.content,visibility:p.visibility,displayOrder:p.display_order,autoRegister:p.auto_register,revision:p.updated_at};
  expect((await request.post("/api/admin",{data:{...body,revision:"2000-01-01T00:00:00.000Z"},headers:{origin}})).status()).toBe(409);
  expect((await request.post("/api/admin",{data:{...body,content:{...p.content,demo:"javascript:alert(1)"}},headers:{origin}})).status()).toBe(400);
  expect((await request.post("/api/admin/upload",{data:"<svg onload='alert(1)'></svg>",headers:{origin}})).status()).toBe(400);
  const image=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=","base64");
  const upload=await request.post("/api/admin/upload",{data:image,headers:{origin,"Content-Type":"image/png"}});expect(upload.status()).toBe(200);
  const {url}=await upload.json();expect((await request.get(url)).status()).toBe(200);
  await request.delete("/api/admin/session",{headers:{origin}});expect((await request.get(url)).status()).toBe(404);expect((await request.get("/api/admin")).status()).toBe(401);
});
test("작업 큐 초기화 확인·인증·CSRF·보존과 새 수동 예약을 검증한다",async({page})=>{
  await page.goto("/admin");await page.getByLabel("비밀번호",{exact:true}).fill("test-password-for-isolated-browser");await page.getByRole("button",{name:"로그인",exact:true}).click();
  await expect(page.getByRole("button",{name:"로그아웃"})).toBeVisible();
  const request=page.request;
  const before=await (await request.get("/api/admin")).json();
  expect(before.jobs).toHaveLength(3);
  expect((await request.post("/api/admin",{data:{action:"resetQueue",confirmed:true},headers:{origin:"https://evil.example.com"}})).status()).toBe(403);
  expect((await request.post("/api/admin",{data:{action:"resetQueue"},headers:{origin}})).status()).toBe(400);
  await page.getByRole("button",{name:"동기화",exact:true}).click();
  const reset=page.getByRole("button",{name:"작업 큐 초기화",exact:true});
  page.once("dialog",async dialog=>{expect(dialog.message()).toContain("API 사용량·비용");await dialog.dismiss();});
  await reset.click();
  expect((await (await request.get("/api/admin")).json()).jobs).toHaveLength(3);
  page.once("dialog",dialog=>dialog.accept());await reset.click();
  await expect(page.getByRole("status")).toContainText("3건 → 0건");await expect(reset).toBeDisabled();
  const after=await (await request.get("/api/admin")).json();
  expect(after.jobs).toHaveLength(0);expect(after.queueSummary).toEqual([]);
  expect(after.projects).toEqual(before.projects);expect(after.analyses).toEqual(before.analyses);expect(after.usage).toEqual(before.usage);
  for(const log of before.logs)expect(after.logs).toContainEqual(log);
  await page.getByRole("button",{name:"수동 동기화",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("저장되었습니다");
  const reserved=await (await request.get("/api/admin")).json();
  expect(reserved.jobs).toHaveLength(1);expect(reserved.jobs[0]).toMatchObject({kind:"discover",status:"queued",attempts:0});
  expect(reserved.usage).toEqual(before.usage);
});

test("모바일 관리자 화면과 로그인 시도 제한을 검증한다",async({page,request})=>{
  await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/admin");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:"artifacts/admin-mobile.png",fullPage:true});
  let code=0;for(let i=0;i<6;i++)code=(await request.post("/api/admin/session",{data:{password:"wrong"},headers:{origin}})).status();expect(code).toBe(429);
});
