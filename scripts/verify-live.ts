import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { projects } from "../data/projects";
import { problemSolving } from "../data/problem-solving";
import { z } from "zod";

loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
const phase=process.argv[2];
const targets=["portfolio_settings","projects","project_analysis","project_problem_solving","sync_logs","portfolio_jobs","ai_usage","admin_attempts","portfolio_public_snapshot","portfolio_images","portfolio_home_problem_solving"];
function code(error:unknown) {
  const value=(error as {code?:string})?.code ?? (error instanceof Error ? error.message : undefined);
  return value && /^[A-Z0-9_]{2,50}$/.test(value) ? value : "CHECK_FAILED";
}
async function report(value:object) {
  if("ok" in value && value.ok===false)process.exitCode=1;
  const path="artifacts/live-check.json";
  await mkdir("artifacts",{recursive:true});
  let previous:Record<string,unknown>={};
  try {previous=JSON.parse(await readFile(path,"utf8"));}catch{}
  await writeFile(path,JSON.stringify({...previous,[phase]:{checkedAt:new Date().toISOString(),...value}},null,2));
  console.log(JSON.stringify({phase,...value},null,2));
}
const validators:Record<string,(v:string)=>boolean>={
  DATABASE_URL:v=>{try{const u=new URL(v);return ["postgres:","postgresql:"].includes(u.protocol)&&!!u.hostname&&!!u.username;}catch{return false;}},
  APP_URL:v=>{try{const u=new URL(v);return (u.protocol==="https:" || u.protocol==="http:" && ["localhost","127.0.0.1"].includes(u.hostname)) && u.pathname==="/" && !u.search && !u.hash && !u.username;}catch{return false;}},
  GITHUB_OWNER:v=>/^[a-zA-Z0-9-]{1,39}$/.test(v),
  GITHUB_TOKEN:v=>/^(github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,}$/.test(v),
  GITHUB_WEBHOOK_SECRET:v=>v.length>=32,
  OPENAI_API_KEY:v=>/^sk-[A-Za-z0-9_-]{20,}$/.test(v),
  OPENAI_MODEL:v=>/^[a-zA-Z0-9][a-zA-Z0-9._/-]{1,120}$/.test(v),
  OPENAI_INPUT_USD_PER_MILLION:v=>Number.isFinite(Number(v))&&Number(v)>0,
  OPENAI_OUTPUT_USD_PER_MILLION:v=>Number.isFinite(Number(v))&&Number(v)>0,
  ADMIN_PASSWORD_HASH:v=>/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(v),
  ADMIN_SESSION_SECRET:v=>v.length>=32,
  CRON_SECRET:v=>v.length>=32,
};
function connect() {
  if (!validators.DATABASE_URL(process.env.DATABASE_URL ?? ""))throw new Error("INVALID_DB_CONFIG");
  return postgres(process.env.DATABASE_URL!,{max:1,prepare:false,connect_timeout:8,idle_timeout:3,onnotice:()=>{},connection:{statement_timeout:15000}});
}
async function main() {
  if(phase==="public") {
    const {getProjects,getProblems}=await import("../lib/portfolio");
    const {db}=await import("../lib/automation/db");
    try {
      const saved=await getProjects();
      const home=await getProblems();
      const projectsEqual=isDeepStrictEqual(saved,projects);
      const homeEqual=isDeepStrictEqual(home,problemSolving);
      await report({ok:projectsEqual&&homeEqual,renderableProjectCount:saved.length,renderableHomeProblemSolvingCount:home.length,publicProjectContentEqual:projectsEqual,publicHomeContentEqual:homeEqual});
    }finally{await db().end({timeout:2});}return;
  }
  if(phase==="db-baseline"||phase==="db-integrity") {
    const sql=connect();
    try {
      const relations=await sql<{schema:string;name:string;kind:string;rls:boolean}[]>`select n.nspname as schema,c.relname as name,c.relkind as kind,c.relrowsecurity as rls
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname not in ('information_schema') and n.nspname not like 'pg_%' and c.relkind in ('r','p','v','m','f') order by n.nspname,c.relname`;
      const columns=await sql`select table_schema,table_name,column_name,data_type,is_nullable,ordinal_position
        from information_schema.columns where table_schema not in ('information_schema') and table_schema not like 'pg_%' order by table_schema,table_name,ordinal_position`;
      const inventory=relations.map(r=>({...r,columns:columns.filter(c=>c.table_schema===r.schema&&c.table_name===r.name)}));
      const path="artifacts/db-before-migration.json";
      if(phase==="db-baseline") {
        if(inventory.some(r=>targets.includes(r.name)))throw new Error("TARGET_TABLE_COLLISION");
        await mkdir("artifacts",{recursive:true});
        await writeFile(path,JSON.stringify(inventory,null,2),{flag:"wx"});
        await report({ok:true,existingRelationCount:inventory.length,baselineSha256:createHash("sha256").update(JSON.stringify(inventory)).digest("hex"),targetNameCollisions:0});
      } else {
        const before=JSON.parse(await readFile(path,"utf8")) as typeof inventory;
        const unchanged=before.every(original=>isDeepStrictEqual(inventory.find(r=>r.schema===original.schema&&r.name===original.name),original));
        const created=inventory.filter(r=>r.schema==="public"&&targets.includes(r.name));
        const policies=await sql`select count(*)::int as count from pg_policies where schemaname='public' and tablename=any(${targets})`;
        const queues=await sql`select count(*)::int as count from portfolio_jobs`;
        const analyses=await sql`select count(*)::int as count from project_analysis`;
        await report({ok:unchanged&&created.length===targets.length&&created.every(r=>r.rls)&&policies[0].count===0,existingRelationsUnchanged:unchanged,existingRelationCount:before.length,createdTableCount:created.length,allCreatedTablesRlsEnabled:created.every(r=>r.rls),createdTablePolicyCount:policies[0].count,queuedJobs:queues[0].count,projectAnalysisCount:analyses[0].count});
      }
    }finally{await sql.end({timeout:2});}return;
  }
  if(phase==="db-format") {
    const raw=await readFile(".env.local","utf8");
    const assignment=raw.match(/^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/m)?.[1]?.trim() ?? "";
    const unquoted=/^(["']).*\1$/.test(assignment) ? assignment.slice(1,-1) : assignment;
    const value=process.env.DATABASE_URL ?? "";
    if(!validators.DATABASE_URL(value))throw new Error("INVALID_DB_CONFIG");
    const url=new URL(value);
    let password="";try{password=decodeURIComponent(url.password);}catch{throw new Error("INVALID_PASSWORD_URL_ENCODING");}
    const pooler=/\.pooler\.supabase\.com$/i.test(url.hostname);
    const expansionRisk=unquoted.includes("$")&&!unquoted.includes("\\$")&&unquoted!==value;
    const placeholder=/\[.*password.*\]|<.*password.*>|YOUR[-_ ]?(?:DB[-_ ]?)?PASSWORD|CHANGEME|REPLACE_ME/i.test(password);
    await report({ok:!!password&&!expansionRisk&&!placeholder&&!url.hash,postgresUrlFormat:true,passwordPresent:!!password,passwordPlaceholderDetected:placeholder,passwordEncodingValid:true,dotenvExpansionRisk:expansionRisk,unexpectedUrlFragment:!!url.hash,supabasePooler:pooler,poolerUsernameShapeValid:pooler ? /^[^.\s]+\.[a-z0-9]+$/i.test(decodeURIComponent(url.username)) : null,portFormatValid:!url.port||Number(url.port)>0&&Number(url.port)<=65535});
    return;
  }
  if(phase==="env") {
    const file=await readFile(".env.local","utf8");
    const keys=[...file.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map(m=>m[1]);
    const optional=new Set(["GITHUB_TOKEN","GITHUB_WEBHOOK_SECRET"]);
    const checks=Object.entries(validators).map(([name,validate])=>{
      const value=process.env[name] ?? "";
      return {name,required:!optional.has(name),declaredInLocal:keys.includes(name),presentInLocal:keys.includes(name)&&!!value,format:!value ? "missing" : validate(value)&&!/(YOUR[-_ ]|CHANGEME|REPLACE_ME|\[.*password.*\])/i.test(value) ? "valid" : "invalid"};
    });
    const publicSecrets=keys.filter(k=>/^NEXT_PUBLIC_.*(?:SECRET|TOKEN|API_KEY|PASSWORD|DATABASE)/i.test(k));
    const alternativeDbVariables=keys.filter(k=>/^(POSTGRES.*URL|SUPABASE.*(?:DB|DATABASE).*URL|DATABASE_.*URL|DB_URL)$/.test(k)).map(name=>({name,nonEmpty:!!process.env[name],postgresUrlFormat:validators.DATABASE_URL(process.env[name]??"")}));
    await report({ok:checks.every(c=>!c.required||c.presentInLocal&&c.format==="valid")&&publicSecrets.length===0,checks,alternativeDbVariables,publicSecretVariableCount:publicSecrets.length,duplicateVariableNames:keys.filter((k,i)=>keys.indexOf(k)!==i)});
    return;
  }
  if(phase==="db") {
    const sql=connect();
    try {
      const [connection]=await sql`select current_schema() as schema,has_schema_privilege(current_schema(),'CREATE') as can_create,
        (select rolsuper or rolbypassrls from pg_roles where rolname=current_user) as bypass_rls`;
      const tables=await sql`select n.nspname as schema,c.relname as name,c.relkind as kind,c.relrowsecurity as rls,
        pg_has_role(c.relowner,'USAGE') as owned_by_role from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname not in ('information_schema') and n.nspname not like 'pg_%' and c.relkind in ('r','p','v','m','f') order by n.nspname,c.relname`;
      const collisions=tables.filter(t=>targets.includes(t.name));
      const details=[];
      for(const table of collisions) {
        const columns=await sql`select column_name,data_type,udt_name from information_schema.columns where table_schema=${table.schema} and table_name=${table.name} order by ordinal_position`;
        details.push({...table,columns});
      }
      await report({ok:true,connected:true,schema:connection.schema,canCreate:connection.can_create,bypassRls:connection.bypass_rls,totalUserRelations:tables.length,otherRelationCount:tables.length-collisions.length,targetCollisions:details,
        safeForFreshMigration:collisions.length===0&&connection.can_create&&connection.schema==="public"});
    }finally{await sql.end({timeout:2});}return;
  }
  if(phase==="compare") {
    const sql=connect();try {
      const rows=await sql`select id,slug,content,locked_fields from projects order by display_order,created_at`;
      const home=await sql`select content from portfolio_home_problem_solving order by display_order`;
      const detail=await sql`select count(*)::int as count from project_problem_solving`;
      const [snapshot]=await sql`select content from portfolio_public_snapshot where id=1`;
      const checks=projects.map(p=>({slug:p.slug,matches:rows.filter(r=>r.slug===p.slug).length,contentEqual:isDeepStrictEqual(rows.find(r=>r.slug===p.slug)?.content,p),protectedFieldCount:rows.find(r=>r.slug===p.slug)?.locked_fields.length ?? 0}));
      const homeEqual=isDeepStrictEqual(home.map(r=>r.content),problemSolving);
      const snapshotEqual=isDeepStrictEqual(snapshot?.content,projects);
      await report({ok:rows.length===3&&home.length===4&&checks.every(c=>c.matches===1&&c.contentEqual)&&homeEqual&&snapshotEqual,projectCount:rows.length,homeProblemSolvingCount:home.length,detailTroubleshootingCount:detail[0].count,checks,homeContentEqual:homeEqual,publicSnapshotEqual:snapshotEqual});
    }finally{await sql.end({timeout:2});}return;
  }
  if(phase==="github") {
    const owner=process.env.GITHUB_OWNER ?? "peeta0126";
    if(!validators.GITHUB_OWNER(owner))throw new Error("INVALID_OWNER");
    const headers:Record<string,string>={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
    if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
    const response=await fetch(`https://api.github.com/users/${owner}/repos?type=owner&per_page=1&page=1`,{headers,redirect:"error",signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    const valid=response.ok&&Array.isArray(result)&&result.every(r=>Number.isSafeInteger(r.id)&&r.private===false&&typeof r.full_name==="string");
    await report({ok:valid,httpStatus:response.status,authenticatedRequest:!!process.env.GITHUB_TOKEN,sampleRepositoryCount:valid ? result.length : 0,publicRepositoryMetadataValid:valid,hasNextPage:!!response.headers.get("link")?.includes('rel="next"'),rateLimitRemaining:response.headers.get("x-ratelimit-remaining"),analysisJobsCreated:0});return;
  }
  if(phase==="openai") {
    if(!validators.OPENAI_API_KEY(process.env.OPENAI_API_KEY ?? "")||!validators.OPENAI_MODEL(process.env.OPENAI_MODEL ?? ""))throw new Error("INVALID_OPENAI_CONFIG");
    const probeSchema=z.object({ok:z.boolean()}).strict();
    const schema=z.toJSONSchema(probeSchema);
    const input='Connection test only. Return {"ok":true}.';
    const cap=64;
    const inputRate=Number(process.env.OPENAI_INPUT_USD_PER_MILLION),outputRate=Number(process.env.OPENAI_OUTPUT_USD_PER_MILLION);
    if(!(inputRate>0)||!(outputRate>0))throw new Error("INVALID_MODEL_PRICING");
    const reserved=(Buffer.byteLength(JSON.stringify(schema)+input)+4096)*inputRate/1e6+cap*outputRate/1e6;
    if(reserved>0.05)throw new Error("PROBE_COST_CAP_EXCEEDED");
    const sql=validators.DATABASE_URL(process.env.DATABASE_URL ?? "") ? connect() : undefined;
    const localReservation="artifacts/openai-connect.reservation.json";
    let usageId:string|undefined;
    try {
      if(sql) usageId=await sql.begin(async tx=>{
        await tx`select pg_advisory_xact_lock(913528)`;
        const [settings]=await tx`select value from portfolio_settings where id=1`;
        const config={monthlyBudget:5,monthlyCalls:30,...settings?.value};
        const [used]=await tx`select count(*)::int as calls,coalesce(sum(coalesce(actual_cost,reserved_cost)),0)::float as cost from ai_usage where created_at>=date_trunc('month',now())`;
        if(used.calls>=config.monthlyCalls||used.cost+reserved>config.monthlyBudget)throw new Error("BUDGET_BLOCKED");
        const [row]=await tx`insert into ai_usage(project_id,reserved_cost,status) values(null,${reserved},'connection_test_reserved') returning id`;
        return row.id as string;
      });
      else {
        await mkdir("artifacts",{recursive:true});
        // One explicit connection probe only. A timeout retains this reservation to prevent accidental duplicate charging.
        await writeFile(localReservation,JSON.stringify({status:"reserved",createdAt:new Date().toISOString(),reservedUsd:reserved,maxOutputTokens:cap}),{flag:"wx"});
      }
      const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},redirect:"error",signal:AbortSignal.timeout(25000),body:JSON.stringify({model:process.env.OPENAI_MODEL,store:false,max_output_tokens:cap,input,text:{format:{type:"json_schema",name:"portfolio_connection_test",strict:true,schema}}})});
      const raw=await response.json();
      const usage=z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().nonnegative()}).safeParse(raw.usage);
      let actual:number|undefined;
      if(usage.success) {
        actual=(usage.data.input_tokens*inputRate+usage.data.output_tokens*outputRate)/1e6;
        if(sql)await sql`update ai_usage set actual_cost=${actual},input_tokens=${usage.data.input_tokens},output_tokens=${usage.data.output_tokens},status='connection_test_charged' where id=${usageId!}`;
        else await writeFile(localReservation,JSON.stringify({status:"charged",createdAt:new Date().toISOString(),estimatedUsd:actual,usage:usage.data,maxOutputTokens:cap}));
      }
      const output=Array.isArray(raw.output) ? raw.output.flatMap((o:{content?:{type:string;text?:string}[]})=>o.content ?? []).filter((c:{type:string})=>c.type==="output_text").map((c:{text?:string})=>c.text ?? "").join("") : "";
      let structured=false;try{const parsed=probeSchema.safeParse(JSON.parse(output));structured=parsed.success&&parsed.data.ok;}catch{}
      await report({ok:response.ok&&raw.status==="completed"&&structured,httpStatus:response.status,responseStatus:typeof raw.status==="string"?raw.status:null,errorCode:typeof raw.error?.code==="string"&&/^[A-Za-z0-9_]+$/.test(raw.error.code)?raw.error.code:null,structuredOutputValid:structured,schemaScope:"minimal_connection_probe",maxOutputTokens:cap,attempts:1,usage:usage.success?usage.data:null,estimatedUsd:actual ?? null,costRecord:sql ? "database" : "local_only_database_not_configured",analysisJobsCreated:0});
    }finally{if(sql)await sql.end({timeout:2});}return;
  }
  throw new Error("UNKNOWN_PHASE");
}
main().catch(async error=>{await report({ok:false,errorCode:code(error),errorType:error instanceof Error ? error.name : "UnknownError"});process.exitCode=1;});
