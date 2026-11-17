import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { mkdir, writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
async function main() {
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connect_timeout:8,onnotice:()=>{}});
  try {
    const data=await sql.begin(async tx=>{
      await tx`set transaction read only`;
      return {projects:await tx`select * from projects order by display_order,created_at`,snapshot:await tx`select * from portfolio_public_snapshot order by id`,home:await tx`select * from portfolio_home_problem_solving order by display_order`,analyses:await tx`select * from project_analysis order by id`,usage:await tx`select * from ai_usage order by id`};
    });
    await mkdir("artifacts/refresh",{recursive:true});
    await writeFile(process.argv[2]??"artifacts/refresh/db-before.json",JSON.stringify(data,null,2));
    const published=data.projects.filter(p=>p.visibility==="public").map(p=>p.content);
    const consistent=JSON.stringify(published)===JSON.stringify(data.snapshot[0]?.content);
    console.log(JSON.stringify({projects:data.projects.map(p=>({slug:p.slug,repoId:p.github_repo_id,visibility:p.visibility,order:p.display_order})),snapshotConsistent:consistent,homeCount:data.home.length,usageCount:data.usage.length}));
    if(!consistent) process.exitCode=2;
  } finally {await sql.end();}
}
main().catch(()=>{console.error("READ_ONLY_AUDIT_FAILED");process.exitCode=1;});
