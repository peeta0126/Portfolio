import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/automation/auth";
import { db, enqueue, settings, log } from "@/lib/automation/db";
import { projectSchema, settingsSchema } from "@/lib/automation/schema";
import { editedFields, mergeProposal } from "@/lib/automation/core";
import { snapshot } from "@/lib/automation/publish";
import { generatedSchema } from "@/lib/automation/schema";
import { runOne } from "@/lib/automation/worker";
import { queueCounts, resetQueue, QueueRunningError } from "@/lib/automation/queue";

export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request: NextRequest) {
  const denied=await requireAdmin(request); if (denied) return denied;
  try {
    const [projects,analyses,jobs,logs,usage,config,queueSummary]=await Promise.all([
      db()`select * from projects order by display_order,created_at`,
      db()`select * from project_analysis order by created_at desc limit 150`,
      db()`select id,kind,status,attempts,error_message,updated_at from portfolio_jobs order by updated_at desc limit 100`,
      db()`select * from sync_logs order by created_at desc limit 100`,
      db()`select count(*)::int as calls,coalesce(sum(input_tokens),0)::int as input_tokens,coalesce(sum(output_tokens),0)::int as output_tokens,
        coalesce(sum(coalesce(actual_cost,reserved_cost)),0)::float as cost from ai_usage where created_at>=date_trunc('month',now())`,
      settings(),
      queueCounts(),
    ]);
    return Response.json({projects,analyses,jobs,logs,queueSummary,usage:usage[0],settings:config,connection:{
      githubOwner:process.env.GITHUB_OWNER ?? "peeta0126",githubToken:!!process.env.GITHUB_TOKEN,openai:!!process.env.OPENAI_API_KEY,
      model:process.env.OPENAI_MODEL ?? null,
    }},{headers:{"Cache-Control":"private, no-store"}});
  } catch { return Response.json({error:"DB 연결과 마이그레이션을 확인하세요."},{status:503}); }
}
const id=z.string().uuid();
const command=z.discriminatedUnion("action",[
  z.object({action:z.literal("sync")}), z.object({action:z.literal("work")}),
  z.object({action:z.literal("resetQueue"),confirmed:z.literal(true)}),
  z.object({action:z.literal("settings"),value:settingsSchema}),
  z.object({action:z.literal("analyze"),projectId:id}),
  z.object({action:z.literal("retry"),jobId:id}),
  z.object({action:z.literal("edit"),projectId:id,content:projectSchema,visibility:z.enum(["public","private"]),displayOrder:z.number().int().min(-10000).max(10000),autoRegister:z.boolean(),revision:z.string()}),
  z.object({action:z.literal("review"),analysisId:id,decision:z.enum(["approve","reject"]),publish:z.boolean()}),
]);
export async function POST(request: NextRequest) {
  const denied=await requireAdmin(request); if (denied) return denied;
  try {
    const raw=await request.text();
    if (raw.length>150000) return Response.json({error:"요청이 너무 큽니다."},{status:413});
    const parsed=command.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({error:"입력 형식이 잘못되었습니다.",details:parsed.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`)},{status:400});
    const input=parsed.data;
    if (input.action==="resetQueue") return Response.json({ok:true,queueReset:await resetQueue()});
    if (input.action==="sync") await enqueue("discover","discover",{});
    if (input.action==="work") return Response.json(await runOne());
    if (input.action==="settings") await db()`update portfolio_settings set value=${db().json(input.value)} where id=1`;
    if (input.action==="analyze") {
      const [p]=await db()`select github_repo_id from projects where id=${input.projectId}`;
      if (!p?.github_repo_id) return Response.json({error:"먼저 GitHub 동기화로 저장소를 연결하세요."},{status:400});
      await enqueue("analyze",`repo:${p.github_repo_id}`,{projectId:input.projectId});
    }
    if (input.action==="retry") await db()`update portfolio_jobs set status='queued',attempts=0,available_at=now(),updated_at=now() where id=${input.jobId} and status='failed'`;
    if (input.action==="edit") {
      await db().begin(async tx => {
        const [p]=await tx`select * from projects where id=${input.projectId} for update`;
        if (!p) throw new Error("NOT_FOUND");
        if (new Date(p.updated_at).toISOString()!==input.revision) throw new Error("EDIT_CONFLICT");
        if (p.slug!==input.content.slug) throw new Error("SLUG_IMMUTABLE");
        const locked=[...new Set([...p.locked_fields,...editedFields(p.content,input.content)])];
        await tx`update projects set content=${tx.json(input.content)},visibility=${input.visibility},display_order=${input.displayOrder},
          auto_register=${input.autoRegister},locked_fields=${locked},analysis_status='manually_edited',updated_at=now() where id=${p.id}`;
        if (locked.includes("detail.troubleshooting")) for (const t of input.content.detail?.troubleshooting ?? []) {
          await tx`insert into project_problem_solving(project_id,title,problem,approach,result,source_type,manually_edited)
            values(${p.id},${t.title},${t.problem},${t.solution},${t.result ?? null},'manual',true)
            on conflict(project_id,title) do update set problem=excluded.problem,approach=excluded.approach,result=excluded.result,source_type='manual',manually_edited=true`;
        }
        await snapshot(tx);
      });
      await log("manual_edit","success");
    }
    if (input.action==="review") {
      await db().begin(async tx => {
        const [a]=await tx`select * from project_analysis where id=${input.analysisId} for update`;
        if (!a || a.status!=="pending") throw new Error("ALREADY_REVIEWED");
        if (input.decision==="reject") { await tx`update project_analysis set status='rejected' where id=${a.id}`; return; }
        const [p]=await tx`select * from projects where id=${a.project_id} for update`;
        const next=projectSchema.parse(mergeProposal(p.content,generatedSchema.parse(a.analysis_result),p.locked_fields));
        await tx`update projects set content=${tx.json(next)},analysis_status=${input.publish ? "published" : "reviewed"},visibility=${input.publish ? "public" : p.visibility},
          published_at=case when ${input.publish} then now() else published_at end,updated_at=now() where id=${p.id}`;
        await tx`update project_analysis set status=${input.publish ? "published" : "reviewed"} where id=${a.id}`;
        for (const t of generatedSchema.parse(a.analysis_result).troubleshooting) {
          await tx`insert into project_problem_solving(project_id,title,problem,approach,result,evidence,source_type)
            values (${p.id},${t.title},${t.problem},${t.solution},${t.result},${tx.json(t.evidence)},'ai')
            on conflict(project_id,title) do update set problem=excluded.problem,approach=excluded.approach,result=excluded.result,evidence=excluded.evidence where not project_problem_solving.manually_edited`;
        }
        await snapshot(tx);
      });
      await log("analysis_review","success");
    }
    return Response.json({ok:true});
  } catch (error) {
    if (error instanceof QueueRunningError) return Response.json({error:"실행 중인 작업이 있어 초기화할 수 없습니다. 작업 종료 후 다시 시도하세요."},{status:409});
    if ((error as {code?:string})?.code==="55P03") return Response.json({error:"다른 작업이 큐를 변경하고 있습니다. 잠시 후 다시 시도하세요."},{status:409});
    const message=error instanceof Error ? error.message : "";
    if (["EDIT_CONFLICT","ALREADY_REVIEWED","SLUG_IMMUTABLE"].includes(message)) return Response.json({error:"다른 작업으로 변경되었거나 수정할 수 없는 항목입니다. 새로고침 후 다시 확인하세요."},{status:409});
    return Response.json({error:"처리에 실패했습니다. DB 설정과 작업 대상을 확인하세요."},{status:503});
  }
}
