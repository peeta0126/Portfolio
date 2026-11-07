import { writeFile, mkdir } from "node:fs/promises";
import { projects } from "../data/projects";
import { problemSolving } from "../data/problem-solving";
import postgres from "postgres";
import { loadEnvConfig } from "@next/env";
async function main() {
loadEnvConfig(process.cwd());
await mkdir("backups", { recursive:true });
await writeFile("backups/legacy-data.json",JSON.stringify({projects,problemSolving},null,2));
if (!process.env.DATABASE_URL) { console.log("Backup created; no DB connection configured."); process.exit(0); }
const sql = postgres(process.env.DATABASE_URL, { max:1,prepare:false });
try {
  await sql.begin(async tx => {
    for (const [order,p] of projects.entries()) {
      const [row] = await tx`insert into projects(slug,repo_name,content,visibility,display_order,published_at,locked_fields,analysis_status)
        values (${p.slug},${p.github?.split('/').pop() ?? null},${tx.json(p)},'public',${order},now(),${Object.keys(p).filter(k=>k!=="detail").concat(Object.keys(p.detail ?? {}).map(k=>`detail.${k}`))},'manually_edited') on conflict(slug) do update set slug=excluded.slug returning id`;
      for (const t of p.detail?.troubleshooting ?? []) await tx`insert into project_problem_solving(project_id,title,problem,approach,result,manually_edited)
        values (${row.id},${t.title},${t.problem},${t.solution},${t.result ?? null},true) on conflict(project_id,title) do nothing`;
    }
    for (const [order,item] of problemSolving.entries()) {
      const original=projects.find(p=>p.title===item.project);
      if(!original)throw new Error("LEGACY_PROJECT_NOT_FOUND");
      await tx`insert into portfolio_home_problem_solving(legacy_key,project_slug,content,display_order)
        values(${`legacy:${order}`},${original.slug},${tx.json(item)},${order}) on conflict(legacy_key) do nothing`;
    }
    const rows = await tx`select content from projects where visibility='public' order by display_order,created_at`;
    await tx`insert into portfolio_public_snapshot(id,content) values(1,${tx.json(rows.map(r=>r.content))}) on conflict(id) do update set content=excluded.content,updated_at=now()`;
  });
  console.log("Legacy projects preserved; seed is idempotent.");
} finally { await sql.end(); }
}
main().catch(()=>{console.error("Seed failed; verify schema and DB connectivity. Existing data was not replaced.");process.exitCode=1;});
