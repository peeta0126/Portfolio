import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { mkdir, writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);
const sql=postgres(process.env.DATABASE_URL!,{max:1,prepare:false,connect_timeout:8,onnotice:()=>{}});
async function main() { try {
  const data=await sql.begin(async tx=>{
    await tx`set transaction read only`;
    return {
      projects:await tx`select id,slug,github_repo_id,repo_name,repository,content,visibility,locked_fields,analysis_status,last_commit,source_manifest from projects order by display_order,created_at`,
      analyses:await tx`select * from project_analysis order by created_at desc`,
      home:await tx`select * from portfolio_home_problem_solving order by display_order`,
      logs:await tx`select event_type,status,error_message,created_at from sync_logs order by created_at desc limit 20`,
      usage:await tx`select count(*)::int as count,coalesce(sum(coalesce(actual_cost,reserved_cost)),0) as cost from ai_usage`,
    };
  });
  await mkdir("artifacts",{recursive:true});await writeFile(process.argv[2]??"artifacts/portfolio-research.json",JSON.stringify(data,null,2));
  console.log(JSON.stringify({projects:data.projects.map(p=>({id:p.id,slug:p.slug,github:p.content.github,repository:p.repository?.html_url,visibility:p.visibility,locked:p.locked_fields,title:p.content.title,description:p.content.description})),analysisCount:data.analyses.length,homeCount:data.home.length,usage:data.usage},null,2));
}catch(error){console.error((error as {code?:string}).code ?? "INSPECT_FAILED");process.exitCode=1;}
finally{await sql.end();} }
void main();
