import "server-only";
import type { TransactionSql } from "postgres";
import { db } from "./db";

export async function snapshot(tx: TransactionSql) {
  const rows = await tx`select content from projects where visibility='public' order by display_order,created_at`;
  await tx`insert into portfolio_public_snapshot(id,content) values (1,${tx.json(rows.map(r=>r.content))})
    on conflict(id) do update set content=excluded.content,updated_at=now()`;
}
export async function refreshSnapshot() { await db().begin(snapshot); }
