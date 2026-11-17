import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { refreshProject, privateProjectDraft, additionalProjects } from "../data/project-content";
import { editedFields } from "../lib/automation/core";
import { projectSchema } from "../lib/automation/schema";
import type { Project } from "../types";

// Files only. No DB client, API call, or publication step.
async function main() {
  const baseline=JSON.parse(await readFile(process.argv[2]??"artifacts/refresh/db-before.json","utf8"));
  const proposals=baseline.projects.map((row:{id:string;github_repo_id:string|null;slug:string;content:Project;locked_fields:string[];visibility:string;display_order:number})=>{
    const content=projectSchema.parse(refreshProject(row.content));
    if(content.slug!==row.slug) throw new Error("SLUG_CHANGED");
    const changed=editedFields(row.content,content);
    return {projectId:row.id,slug:row.slug,repositoryId:row.github_repo_id,baseHash:createHash("sha256").update(JSON.stringify(row.content)).digest("hex"),visibility:row.visibility,displayOrder:row.display_order,changedFields:changed,protectedChanges:changed.filter(f=>row.locked_fields.includes(f)),baseContent:row.content,proposedContent:content};
  });
  await mkdir("artifacts/refresh/review",{recursive:true});
  await writeFile("artifacts/refresh/review/manifest.json",JSON.stringify({status:"local_review_only",proposals,newProjects:[{visibility:"private",reason:"private_repository_requires_approval",content:privateProjectDraft},{visibility:"private",reason:"manual_registration_requires_approval",content:additionalProjects.find(p=>p.slug==="tarot-shorts-automation")} ]},null,2));
  for(const proposal of proposals) await writeFile(`artifacts/refresh/review/${proposal.slug}.json`,JSON.stringify(proposal.proposedContent,null,2));
  console.log(JSON.stringify({prepared:proposals.map((p:{slug:string;changedFields:string[];protectedChanges:string[]})=>({slug:p.slug,changed:p.changedFields.length,protected:p.protectedChanges.length})),dbWrites:0}));
}
main().catch(()=>{console.error("LOCAL_REVIEW_PREPARATION_FAILED");process.exitCode=1;});
