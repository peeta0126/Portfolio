import "server-only";
import postgres from "postgres";
import { defaults, settingsSchema } from "./schema";

let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return connection ??= postgres(process.env.DATABASE_URL, { max: 3, prepare: false, idle_timeout: 20, connect_timeout: 5 });
}
export async function settings() {
  const [row] = await db()`select value from portfolio_settings where id = 1`;
  return settingsSchema.parse({ ...defaults, ...row?.value });
}
export async function log(event: string, status: string, repoId?: number, message?: string) {
  await db()`insert into sync_logs (repository_id,event_type,status,error_message) values (${repoId ?? null},${event},${status},${message ?? null})`;
}
export async function enqueue(kind: "discover" | "analyze" | "rewrite", key: string, payload: object) {
  if (kind==="discover" && key==="discover") {
    await db().begin(async tx=>{
      await tx`select pg_advisory_xact_lock(913530)`;
      const [active]=await tx`select 1 from portfolio_jobs where kind='discover' and status in ('queued','running') limit 1`;
      if (active) return;
      await tx`insert into portfolio_jobs(kind,dedupe_key,payload) values('discover','discover',${tx.json(payload)})
        on conflict(dedupe_key) do update set status='queued',attempts=0,available_at=now(),updated_at=now()
        where portfolio_jobs.status in ('done','failed')`;
    });
    return;
  }
  await db()`insert into portfolio_jobs (kind,dedupe_key,payload) values (${kind},${key},${db().json(payload)})
    on conflict (dedupe_key) do update set status='queued', attempts=0, available_at=now(), updated_at=now()
    where portfolio_jobs.status in ('done','failed')`;
}
