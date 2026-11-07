import "server-only";
import { db } from "./db";

export type QueueCount = { kind: string; status: string; count: number };
export class QueueRunningError extends Error {
  constructor() { super("QUEUE_RUNNING"); }
}
export async function queueCounts() {
  return [...await db()<QueueCount[]>`select kind,status,count(*)::int as count from portfolio_jobs group by kind,status order by kind,status`];
}

export async function resetQueue() {
  return db().begin(async tx => {
    await tx`set local lock_timeout='5s'`;
    // Serialize with every enqueue/claim/retry, including older deployed workers.
    // A worker doing external I/O has committed its running row, so reject it below.
    await tx`lock table portfolio_jobs in exclusive mode`;
    const before = [...await tx<QueueCount[]>`select kind,status,count(*)::int as count from portfolio_jobs group by kind,status order by kind,status`];
    if (before.some(row => row.status === "running")) throw new QueueRunningError();
    const deleted = await tx`delete from portfolio_jobs where kind in ('discover','analyze') and status in ('queued','done','failed') returning id`;
    const after = [...await tx<QueueCount[]>`select kind,status,count(*)::int as count from portfolio_jobs group by kind,status order by kind,status`];
    const result = { before, after, deleted:deleted.length };
    // Preserve existing logs; append only this reset's counts in the same transaction.
    await tx`insert into sync_logs(event_type,status,error_message) values ('queue_reset','success',${JSON.stringify(result)})`;
    return result;
  });
}
