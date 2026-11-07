import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createServer } from "node:http";
import next from "next";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { hashPassword } from "../lib/automation/session";
import { projects } from "../data/projects";

async function main() {
  const memory=await PGlite.create();
  const server=new PGLiteSocketServer({db:memory,host:"127.0.0.1",port:0,maxConnections:6});
  await server.start();
  const connection=`postgres://postgres:postgres@${server.getServerConn()}/postgres`;
  const sql=postgres(connection,{max:1,prepare:false,onnotice:()=>{}});
  await sql.unsafe(await readFile("db/001_portfolio.sql","utf8"));
  for (const [index,p] of projects.entries()) {
    await sql`insert into projects(slug,content,visibility,display_order,analysis_status) values(${p.slug},${sql.json(p)},'public',${index},'manually_edited')`;
  }
  const pending={...projects[1],slug:"github-999",title:"검토 대기 프로젝트",description:"아직 공개하지 않은 설명",github:"https://github.com/peeta0126/mock-project"};
  const [row]=await sql`insert into projects(slug,github_repo_id,repo_name,content,visibility) values(${pending.slug},999,'mock-project',${sql.json(pending)},'private') returning id`;
  const generated={title:"Mock 새 프로젝트",subtitle:"라우팅 검증 프로젝트",description:"AI가 제안한 설명",projectType:"Web",tech:["TypeScript"],overview:"코드 기반 개요",features:["서버 라우팅"],implementation:["라우팅 처리"],architecture:"Next.js 서버",considerations:[],troubleshooting:[],evidence:[{claim:"라우팅",sources:["app/page.tsx"]}],reviewNotes:[]};
  await sql`insert into project_analysis(project_id,commit_sha,analysis_result,generated_content,analyzed_files) values(${row.id},${"e".repeat(40)},${sql.json(generated)},${sql.json({...pending,title:generated.title})},${sql.json([{path:"app/page.tsx",sha:"blob"}])})`;
  await sql`insert into portfolio_public_snapshot(id,content) values(1,${sql.json(projects)})`;
  for(const [kind,status] of [["discover","done"],["analyze","failed"],["analyze","queued"]]) {
    await sql`insert into portfolio_jobs(kind,dedupe_key,payload,status) values(${kind},${`browser-${kind}-${status}`},'{}',${status})`;
  }
  await sql.end();
  Object.assign(process.env,{PORTFOLIO_VERIFY_BUILD:"1",DATABASE_URL:connection,APP_URL:"http://127.0.0.1:3107",
      ADMIN_PASSWORD_HASH:hashPassword("test-password-for-isolated-browser"),ADMIN_SESSION_SECRET:"s".repeat(40),CRON_SECRET:"c".repeat(40),
      GITHUB_WEBHOOK_SECRET:"w".repeat(40),GITHUB_TOKEN:"",OPENAI_API_KEY:"",OPENAI_MODEL:"",VERCEL:"",
  });
  const app=next({dev:false,hostname:"127.0.0.1",port:3107});
  await app.prepare();
  const handler=app.getRequestHandler();
  const http=createServer((request,response)=>void handler(request,response));
  http.listen(3107,"127.0.0.1");
  const close=()=>{http.closeAllConnections();http.close();void app.close().finally(()=>process.exit());};
  process.once("SIGINT",close);
  process.once("SIGTERM",close);
}
main().catch(error=>{console.error(error instanceof Error ? error.message : "Test server failed");process.exit(1);});
