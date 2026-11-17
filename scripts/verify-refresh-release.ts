import { loadEnvConfig } from "@next/env";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { chromium } from "@playwright/test";
import { refreshProject } from "../data/project-content";
import { projectSchema } from "../lib/automation/schema";
import { signSession } from "../lib/automation/session";
import { contact } from "../data/contact";

loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
const origin="https://portfolio-iota-sage-3jin175bbg.vercel.app";
const plain=(value:unknown)=>JSON.parse(JSON.stringify(value));
async function main() {
  if(new URL(process.env.APP_URL ?? "").origin!==origin)throw new Error("APP_URL_MISMATCH");
  const baseline=JSON.parse(await readFile("artifacts/refresh/db-before-publication-20261118.json","utf8"));
  const sql=postgres(process.env.DATABASE_URL!,{max:1,prepare:false,connect_timeout:8,onnotice:()=>{}});
  let state;
  try {
    state=await sql.begin(async tx=>{
      await tx`set transaction read only`;
      return plain({projects:await tx`select * from projects order by display_order,created_at`,snapshot:await tx`select * from portfolio_public_snapshot order by id`,home:await tx`select * from portfolio_home_problem_solving order by display_order`,analyses:await tx`select * from project_analysis order by id`,usage:await tx`select * from ai_usage order by id`});
    });
  } finally {await sql.end();}
  const checks:Record<string,boolean>={
    projectCount:state.projects.length===baseline.projects.length,
    homePreserved:isDeepStrictEqual(state.home,baseline.home),
    analysesPreserved:isDeepStrictEqual(state.analyses,baseline.analyses),
    usagePreserved:isDeepStrictEqual(state.usage,baseline.usage),
  };
  for(const before of baseline.projects) {
    const current=state.projects.find((p:{id:string})=>p.id===before.id);
    checks[`${before.slug}:content`]=isDeepStrictEqual(current?.content,projectSchema.parse(refreshProject(before.content)));
    checks[`${before.slug}:metadata`]=!!current&&Object.keys(before).filter(k=>!["content","locked_fields","analysis_status","updated_at"].includes(k)).every(key=>isDeepStrictEqual(current[key],before[key]));
    checks[`${before.slug}:protection`]=!!current&&before.locked_fields.every((field:string)=>current.locked_fields.includes(field));
  }
  const publicProjects=state.projects.filter((p:{visibility:string})=>p.visibility==="public");
  checks.snapshotConsistent=isDeepStrictEqual(state.snapshot[0]?.content,publicProjects.map((p:{content:unknown})=>p.content));
  if(Object.values(checks).some(ok=>!ok))throw new Error("DB_PRESERVATION_FAILED");
  await mkdir("artifacts/refresh/publication",{recursive:true});
  await writeFile("artifacts/refresh/publication/db-after.json",JSON.stringify(state,null,2));
  const browser=await chromium.launch({headless:true});
  const errors:string[]=[];
  const pages:{path:string;status:number}[]=[];
  try {
    const context=await browser.newContext({reducedMotion:"reduce"});
    const page=await context.newPage();
    page.on("pageerror",error=>errors.push(error.message));
    for(const theme of ["light","dark"])for(const width of [375,768,1440]) {
      await page.setViewportSize({width,height:1000});
      await page.addInitScript(value=>localStorage.setItem("theme",value),theme);
      const response=await page.goto(origin,{waitUntil:"networkidle"});
      if(response?.status()!==200)throw new Error("HOME_HTTP_FAILED");
      if(await page.locator("#projects article").count()!==publicProjects.length)throw new Error("CARD_COUNT_FAILED");
      if(await page.locator("#problem-solving article").count()!==4)throw new Error("HOME_PROBLEM_COUNT_FAILED");
      if(await page.locator("#contact a[href^='mailto:']").getAttribute("href")!==`mailto:${contact.email}`)throw new Error("EMAIL_LINK_FAILED");
      if((await page.locator("main").innerText()).match(/기간 확인|개발 기간 확인/))throw new Error("UNVERIFIED_PERIOD_VISIBLE");
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error("HOME_OVERFLOW");
      for(const image of await page.locator("main img").all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(async(el:HTMLImageElement)=>{await el.decode();});
      }
      if(await page.locator("#projects img").count()!==6)throw new Error("PROJECT_IMAGES_MISSING");
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`artifacts/refresh/publication/live-home-${width}-${theme}.png`,fullPage:true});
    }
    for(const project of publicProjects) {
      const response=await page.goto(`${origin}/projects/${project.slug}`,{waitUntil:"networkidle"});
      pages.push({path:`/projects/${project.slug}`,status:response?.status() ?? 0});
      if(response?.status()!==200 || await page.locator("h1").innerText()!==project.content.title)throw new Error("DETAIL_PAGE_FAILED");
      if(["starlight-tarot","github-1407847850","github-1431052115"].includes(project.slug)) {
        if(!await page.locator(".architecture-flow").count())throw new Error("ARCHITECTURE_MISSING");
        for(const width of [375,1440]) {
          await page.setViewportSize({width,height:1000});
          for(const image of await page.locator("main img").all()) {await image.scrollIntoViewIfNeeded();await image.evaluate(async(el:HTMLImageElement)=>{await el.decode();});}
          if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error("DETAIL_OVERFLOW");
          await page.screenshot({path:`artifacts/refresh/publication/live-detail-${project.slug}-${width}.png`,fullPage:true});
        }
      }
    }
    await page.goto(`${origin}/problem-solving`,{waitUntil:"networkidle"});
    if(await page.locator("main article").count()!==10)throw new Error("ALL_PROBLEM_COUNT_FAILED");
    const preservedGameCases=state.projects.find((p:{slug:string})=>p.slug==="github-1431052115").content.detail.troubleshooting;
    const allCaseText=await page.locator("main").innerText();
    for(const item of preservedGameCases)if(!allCaseText.includes(item.title))throw new Error("REGRESSION_CASE_MISSING");
    const pdf=await page.request.get(`${origin}/resume.pdf`,{headers:{"Cache-Control":"no-cache"}});
    const localPdf=await readFile("public/resume.pdf");
    if(pdf.status()!==200 || !(await pdf.body()).equals(localPdf))throw new Error("RESUME_MISMATCH");
    const unauthorized=await page.request.get(`${origin}/api/admin`);
    if(unauthorized.status()!==401)throw new Error("ADMIN_AUTH_FAILED");
    const token=signSession(process.env.ADMIN_SESSION_SECRET!,process.env.ADMIN_PASSWORD_HASH!,Date.now()+5*60*1000);
    await context.addCookies([{name:"portfolio_admin",value:token,url:origin,httpOnly:true,secure:true,sameSite:"Strict"}]);
    const admin=await page.request.get(`${origin}/api/admin`);
    if(admin.status()!==200)throw new Error("ADMIN_READ_FAILED");
    await page.setViewportSize({width:375,height:1000});
    await page.goto(`${origin}/admin`,{waitUntil:"networkidle"});
    if(!await page.getByRole("button",{name:"로그아웃"}).isVisible())throw new Error("ADMIN_UI_FAILED");
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error("ADMIN_OVERFLOW");
    if(errors.length)throw new Error("BROWSER_RUNTIME_ERROR");
    const report={checkedAt:new Date().toISOString(),origin,checks,pages,publicProjects:publicProjects.length,mainCases:4,allCases:10,mainImages:6,email:contact.email,resumeSha256:createHash("sha256").update(localPdf).digest("hex"),adminUnauthorizedStatus:401,adminAuthorizedStatus:200,browserErrors:errors,productionVerificationWrites:0};
    await writeFile("artifacts/refresh/publication/verification.json",JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();}
}
main().catch(error=>{const message=error instanceof Error?error.message:"RELEASE_VERIFICATION_FAILED";console.error(/^[A-Z_0-9]+$/.test(message)?message:"RELEASE_VERIFICATION_FAILED");process.exitCode=1;});
