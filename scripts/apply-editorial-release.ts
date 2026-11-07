import { loadEnvConfig } from "@next/env";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { db } from "../lib/automation/db";
import { validateTechnical, validateWriting } from "../lib/automation/editorial";
import { publishPreparedAugment } from "../lib/automation/prepared-release";

async function main() {
  loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
  const mode=process.argv[2];if(!["inspect","migrate","publish"].includes(mode))throw new Error("INVALID_MODE");
  const sample=JSON.parse(await readFile("docs/drafts/augment-alkkagi.json","utf8"));
  validateWriting(sample.generated,validateTechnical(sample.technical,sample.sourcePacket),sample.sourcePacket);
  const baseline=JSON.parse(await readFile("artifacts/portfolio-after-editorial.json","utf8"));
  const expected=baseline.projects.find((p:{slug:string})=>p.slug===sample.proposal.slug)?.content;
  if(!expected)throw new Error("REVIEW_BASELINE_MISSING");
  const sql=db();
  const [current]=await sql`select * from projects where slug=${sample.proposal.slug}`;
  const running=await sql`select kind,count(*)::int as count from portfolio_jobs where status='running' group by kind`;
  if(running.length)throw new Error("QUEUE_RUNNING");
  if(!current||(!isDeepStrictEqual(current.content,expected)&&!isDeepStrictEqual(current.content,sample.proposal)))throw new Error("CONTENT_CHANGED_SINCE_REVIEW");
  const tables=await sql`select table_name,column_name from information_schema.columns where table_schema='public' and table_name in ('portfolio_technical_analysis','portfolio_content_drafts') order by table_name,ordinal_position`;
  console.log(JSON.stringify({mode,project:current.slug,reviewedContentMatches:isDeepStrictEqual(current.content,expected),alreadyPublished:isDeepStrictEqual(current.content,sample.proposal),running,existingEditorialColumns:tables.length},null,2));
  if(mode==="inspect")return;
  const backup:Record<string,unknown>={capturedAt:new Date().toISOString()};
  for(const name of ["projects","project_analysis","project_problem_solving","portfolio_home_problem_solving","portfolio_public_snapshot","ai_usage","portfolio_settings","sync_logs"])backup[name]=await sql.unsafe(`select * from ${name}`);
  await mkdir("artifacts/release",{recursive:true});
  await writeFile(`artifacts/release/db-before-${mode}-${Date.now()}.json`,JSON.stringify(backup,null,2),{flag:"wx"});
  if(mode==="migrate") {
    // Stop on a naming collision instead of silently reusing an unrelated existing table.
    for(const [name,required] of Object.entries({portfolio_technical_analysis:["id","project_id","facts","source_packet","pipeline_version"],portfolio_content_drafts:["id","project_id","technical_id","analysis_result","generated_content","base_content","revision"]})) {
      const found=tables.filter(row=>row.table_name===name).map(row=>row.column_name);
      if(found.length&&required.some(column=>!found.includes(column)))throw new Error("EDITORIAL_SCHEMA_COLLISION");
    }
    await sql.begin(async tx=>{await tx`select pg_advisory_xact_lock(913529)`;await tx.unsafe(await readFile("db/002_editorial.sql","utf8"));});
    console.log("Additive editorial migration complete. Existing content was not updated.");
  } else {
    const result=await publishPreparedAugment(sample,expected);
    await writeFile("artifacts/release/content-publication.json",JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
  }
}
main().catch(error=>{const code=error?.code??error?.message;console.error(typeof code==="string"&&/^[A-Z0-9_]+$/.test(code)?code:"RELEASE_FAILED");process.exitCode=1;}).finally(async()=>{if(process.env.DATABASE_URL)await db().end({timeout:2});});
