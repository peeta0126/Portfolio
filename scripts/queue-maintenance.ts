import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../lib/automation/db";
import { queueCounts, resetQueue } from "../lib/automation/queue";

loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
const mode=process.argv[2];
const protectedTables=["projects","project_analysis","project_problem_solving","portfolio_home_problem_solving","portfolio_public_snapshot","ai_usage","portfolio_settings","portfolio_images"];
async function fingerprints() {
  const result:Record<string,{count:number;sha256:string}>={};
  for(const table of protectedTables) {
    // Identifiers are hard-coded above. Do not print private table content.
    const rows=await db().unsafe(`select row_to_json(t)::text as value from ${table} t order by row_to_json(t)::text`);
    result[table]={count:rows.length,sha256:createHash("sha256").update(JSON.stringify(rows.map(r=>r.value))).digest("hex")};
  }
  return result;
}
async function main() {
  if(mode!=="inspect" && mode!=="reset") throw new Error("INVALID_MODE");
  const before=await queueCounts();
  const running=(await db()`select id,kind,status,attempts,lease_until from portfolio_jobs where status='running'`).map(row=>({...row}));
  console.log(JSON.stringify({mode,before,running},null,2));
  if(mode==="inspect") return;
  if(running.length) throw new Error("QUEUE_RUNNING");
  const protectedBefore=await fingerprints();
  const logsBefore=await db()`select * from sync_logs order by id`;
  const jobs=await db()`select * from portfolio_jobs order by created_at,id`;
  await mkdir("artifacts",{recursive:true});
  const backup=`artifacts/queue-before-reset-${Date.now()}.json`;
  await writeFile(backup,JSON.stringify(jobs,null,2),{flag:"wx"});
  const result=await resetQueue();
  const protectedAfter=await fingerprints();
  const logsAfter=await db()`select * from sync_logs order by id`;
  const protectedUnchanged=JSON.stringify(protectedBefore)===JSON.stringify(protectedAfter);
  const previousLogsPreserved=logsBefore.every(old=>logsAfter.some(row=>JSON.stringify(row)===JSON.stringify(old)));
  const report={checkedAt:new Date().toISOString(),...result,backup,protectedBefore,protectedAfter,protectedUnchanged,previousLogsPreserved};
  await writeFile("artifacts/queue-reset.json",JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(!protectedUnchanged || !previousLogsPreserved) process.exitCode=1;
}
main().catch(error=>{
  const code=error?.code ?? error?.message;
  console.error(JSON.stringify({error:typeof code==="string" && /^[A-Z0-9_]+$/.test(code) ? code : "QUEUE_MAINTENANCE_FAILED"}));
  process.exitCode=1;
}).finally(async()=>{await db().end({timeout:2});});
