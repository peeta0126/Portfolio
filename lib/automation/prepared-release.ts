import "server-only";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { db } from "./db";
import { projectSchema } from "./schema";
import { validateTechnical, validateWriting, type SourcePacket } from "./editorial";
import { editedFields } from "./core";
import { snapshot } from "./publish";
import type { Project } from "../../types";

export type PreparedRelease={repository:string;commit:string;technical:unknown;sourcePacket:SourcePacket;generated:unknown;proposal:Project};
export async function publishPreparedAugment(sample:PreparedRelease,expected:Project) {
  if(sample.repository!=="https://github.com/peeta0126/AugmentAlkkagi"||sample.proposal.slug!=="github-1431052115")throw new Error("RELEASE_TARGET_MISMATCH");
  const facts=validateTechnical(sample.technical,sample.sourcePacket);
  const generated=validateWriting(sample.generated,facts,sample.sourcePacket);
  const proposal=projectSchema.parse(sample.proposal);
  if(proposal.github!==sample.repository)throw new Error("RELEASE_REPOSITORY_MISMATCH");
  return db().begin(async tx=>{
    await tx`set local lock_timeout='5s'`;
    const before=await tx`select * from projects order by id for update`;
    const current=before.find(p=>p.slug===proposal.slug);
    if(!current||Number(current.github_repo_id)!==1431052115)throw new Error("RELEASE_TARGET_MISMATCH");
    if(isDeepStrictEqual(current.content,proposal))return {alreadyApplied:true,projectId:current.id,slug:proposal.slug};
    if(!isDeepStrictEqual(current.content,expected))throw new Error("CONTENT_CHANGED_SINCE_REVIEW");
    if(proposal.period!==current.content.period||proposal.kind!==current.content.kind||proposal.thumbnail!==current.content.thumbnail||proposal.demo!==current.content.demo)throw new Error("UNAPPROVED_METADATA_CHANGE");
    const protectedBefore=await tx`select * from portfolio_home_problem_solving order by legacy_key`;
    const usageBefore=await tx`select * from ai_usage order by id`;
    const legacyBefore=await tx`select * from project_analysis order by id`;
    const sourceHash=createHash("sha256").update(JSON.stringify(sample.sourcePacket)).digest("hex");
    const [technical]=await tx`insert into portfolio_technical_analysis(project_id,commit_sha,source_hash,pipeline_version,facts,source_packet,token_usage)
      values(${current.id},${sample.commit},${sourceHash},'manual-reviewed-release-v1',${tx.json(facts)},${tx.json(sample.sourcePacket)},${tx.json({source:"local_research",paidCalls:0})})
      on conflict(project_id,commit_sha,source_hash,pipeline_version) do update set project_id=excluded.project_id returning id`;
    const changed=editedFields(current.content,proposal);
    const [draft]=await tx`insert into portfolio_content_drafts(project_id,technical_id,commit_sha,analyzed_files,analysis_result,generated_content,base_content,status,edited_fields,token_usage)
      values(${current.id},${technical.id},${sample.commit},${tx.json(sample.sourcePacket.files.map(({path,sha})=>({path,sha})))},${tx.json(generated)},${tx.json(proposal)},${tx.json(current.content)},${current.visibility==="public"?"published":"reviewed"},${changed},${tx.json({source:"user_approved_local_manuscript",paidCalls:0})}) returning id`;
    // Explicit user-approved manual release; existing locks remain and changed fields become protected.
    const locked=[...new Set([...current.locked_fields,...changed])];
    await tx`update projects set content=${tx.json(proposal)},locked_fields=${locked},analysis_status=${current.visibility==="public"?"published":"reviewed"},updated_at=now() where id=${current.id}`;
    for(const item of proposal.detail?.troubleshooting??[]) {
      const evidence=generated.troubleshooting.find(t=>t.title===item.title)?.evidence??[];
      await tx`insert into project_problem_solving(project_id,title,problem,approach,result,evidence,source_type,manually_edited)
        values(${current.id},${item.title},${item.problem},${item.solution},${item.result??null},${tx.json(evidence)},'manual',true)
        on conflict(project_id,title) do nothing`;
    }
    await snapshot(tx);
    const after=await tx`select * from projects order by id`;
    if(!isDeepStrictEqual(before.filter(p=>p.id!==current.id),after.filter(p=>p.id!==current.id)))throw new Error("OTHER_PROJECT_CHANGED");
    if(!isDeepStrictEqual(protectedBefore,await tx`select * from portfolio_home_problem_solving order by legacy_key`))throw new Error("HOME_CONTENT_CHANGED");
    if(!isDeepStrictEqual(usageBefore,await tx`select * from ai_usage order by id`))throw new Error("USAGE_CHANGED");
    if(!isDeepStrictEqual(legacyBefore,await tx`select * from project_analysis order by id`))throw new Error("LEGACY_ANALYSIS_CHANGED");
    const report={alreadyApplied:false,projectId:current.id,slug:proposal.slug,draftId:draft.id,technicalId:technical.id,changedFields:changed,otherProjectsPreserved:before.length-1,homeEntriesPreserved:protectedBefore.length,usageRecordsPreserved:usageBefore.length,legacyAnalysesPreserved:legacyBefore.length};
    await tx`insert into sync_logs(event_type,status,error_message) values('manual_editorial_release','success',${JSON.stringify(report)})`;
    return report;
  });
}
