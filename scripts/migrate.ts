import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { loadEnvConfig } from "@next/env";
async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = postgres(process.env.DATABASE_URL, { max:1,prepare:false });
  try { await sql.begin(async tx => { await tx`select pg_advisory_xact_lock(913529)`; for(const file of ["db/001_portfolio.sql","db/002_editorial.sql"])await tx.unsafe(await readFile(file,"utf8")); }); console.log("Additive schema migration complete."); }
  finally { await sql.end(); }
}
main().catch(()=>{console.error("Migration failed; verify DB connectivity and role permissions.");process.exitCode=1;});
