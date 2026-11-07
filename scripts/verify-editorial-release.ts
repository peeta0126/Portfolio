import { loadEnvConfig } from "@next/env";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { chromium } from "@playwright/test";
import postgres from "postgres";
import { signSession } from "../lib/automation/session";

async function main() {
  loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
  const origin="https://portfolio-iota-sage-3jin175bbg.vercel.app";
  const baseline=JSON.parse(await readFile("artifacts/portfolio-after-editorial.json","utf8"));
  const sample=JSON.parse(await readFile("docs/drafts/augment-alkkagi.json","utf8"));
  await mkdir("artifacts/release",{recursive:true});
  const pages=[];
  for(const path of ["/",...baseline.projects.map((p:{slug:string})=>`/projects/${p.slug}`)]) {
    const response=await fetch(origin+path,{redirect:"manual",signal:AbortSignal.timeout(20000)});
    pages.push({path,status:response.status});
    if(response.status!==200)throw new Error("PUBLIC_PAGE_NOT_READY");
  }
  const unauthorized=await fetch(`${origin}/api/admin`,{redirect:"manual"});
  if(unauthorized.status!==401)throw new Error("ADMIN_AUTH_NOT_ENFORCED");
  const token=signSession(process.env.ADMIN_SESSION_SECRET!,process.env.ADMIN_PASSWORD_HASH!,Date.now()+5*60*1000);
  const adminResponse=await fetch(`${origin}/api/admin`,{redirect:"manual",headers:{cookie:`portfolio_admin=${token}`}});
  if(adminResponse.status!==200)throw new Error("ADMIN_CONNECTION_FAILED");
  const admin=await adminResponse.json();
  if(!admin.editorialReady||!admin.technicalAnalyses.length||!admin.contentDrafts.some((d:{status:string})=>d.status==="published"))throw new Error("EDITORIAL_ADMIN_NOT_READY");
  const sql=postgres(process.env.DATABASE_URL!,{max:1,prepare:false,connect_timeout:8,onnotice:()=>{}});
  let preserved;
  try {
    const projects=await sql`select id,slug,github_repo_id,repo_name,repository,content,visibility,locked_fields,analysis_status,last_commit,source_manifest from projects order by display_order,created_at`;
    const home=await sql`select * from portfolio_home_problem_solving order by display_order`;
    const analyses=await sql`select * from project_analysis order by created_at desc`;
    const usage=await sql`select count(*)::int as count,coalesce(sum(coalesce(actual_cost,reserved_cost)),0) as cost from ai_usage`;
    const plain=(value:unknown)=>JSON.parse(JSON.stringify(value));
    preserved={otherProjects:baseline.projects.filter((p:{slug:string})=>p.slug!==sample.proposal.slug).every((old:{id:string})=>isDeepStrictEqual(old,plain(projects.find(p=>p.id===old.id)))),home:isDeepStrictEqual(plain(home),baseline.home),analyses:isDeepStrictEqual(plain(analyses),baseline.analyses),usage:isDeepStrictEqual(plain(usage),baseline.usage),publishedProposal:isDeepStrictEqual(projects.find(p=>p.slug===sample.proposal.slug)?.content,sample.proposal)};
    if(Object.values(preserved).some(ok=>!ok)){console.log(JSON.stringify({preserved}));throw new Error("PRESERVATION_CHECK_FAILED");}
  }finally{await sql.end();}
  const browser=await chromium.launch({headless:true});
  const errors:string[]=[];
  try {
    const context=await browser.newContext();const page=await context.newPage();
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(origin,{waitUntil:"networkidle"});
    const cardCount=await page.locator("#projects a[href^='/projects/']").count();
    const problemCount=await page.locator("#problem-solving article").count();
    if(cardCount!==6||problemCount!==7)throw new Error("HOME_CONTENT_COUNT_MISMATCH");
    for(const width of [1440,375]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(`${origin}/projects/${sample.proposal.slug}`,{waitUntil:"networkidle"});
      if(await page.locator("h1").innerText()!=="증강 알까기")throw new Error("PROJECT_TITLE_MISMATCH");
      const text=await page.locator("main").innerText();
      if(text.includes("[근거:")||text.includes("확인용 회고 제안"))throw new Error("PRIVATE_EVIDENCE_IN_PUBLIC_CONTENT");
      for(const item of sample.generated.troubleshooting)if(!text.includes(item.title))throw new Error("TROUBLESHOOTING_MISSING");
      if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error("PUBLIC_MOBILE_OVERFLOW");
      await page.screenshot({path:`artifacts/release/live-augment-${width}.png`,fullPage:true});
    }
    await context.addCookies([{name:"portfolio_admin",value:token,url:origin,httpOnly:true,secure:true,sameSite:"Strict"}]);
    await page.goto(`${origin}/admin`,{waitUntil:"networkidle"});
    await page.getByRole("button",{name:/증강 알까기/}).click();
    if(!await page.getByRole("button",{name:"설명만 다시 생성",exact:true}).isEnabled())throw new Error("REWRITE_NOT_AVAILABLE");
    await page.getByRole("button",{name:/AI 검토/}).click();
    await page.getByText(/상세 초안 버전 기록/).click();
    await page.getByRole("heading",{name:"증강 알까기 · 상세 초안",exact:true}).waitFor();
    if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error("ADMIN_MOBILE_OVERFLOW");
    await page.screenshot({path:"artifacts/release/live-admin-mobile.png",fullPage:true});
    if(errors.length)throw new Error("BROWSER_RUNTIME_ERROR");
    const report={checkedAt:new Date().toISOString(),origin,pages,adminStatus:adminResponse.status,unauthorizedStatus:unauthorized.status,editorialReady:admin.editorialReady,projectCards:cardCount,homeProblemSolving:problemCount,apiUsageRecords:baseline.usage[0].count,preserved,browserErrors:errors,openaiCalls:0};
    await writeFile("artifacts/release/verification.json",JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{const code=error?.cause?.code??error?.message;console.error(typeof code==="string"&&/^[A-Z0-9_]+$/.test(code)?code:"RELEASE_VERIFICATION_FAILED");process.exitCode=1;});
