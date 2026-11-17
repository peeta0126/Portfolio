import { loadEnvConfig } from "@next/env";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { signSession } from "../lib/automation/session";
import { projectSchema } from "../lib/automation/schema";
import { refreshProject } from "../data/project-content";
import type { Project } from "../types";

const origin="https://portfolio-iota-sage-3jin175bbg.vercel.app";
loadEnvConfig(process.cwd(),false,{info:()=>{},error:()=>{}},true);

async function main() {
  const mode=process.argv[2];
  if(!["inspect","publish"].includes(mode)) throw new Error("INVALID_MODE");
  if(new URL(process.env.APP_URL ?? "").origin!==origin) throw new Error("APP_URL_MISMATCH");
  const baseline=JSON.parse(await readFile("artifacts/refresh/db-before-publication-20261118.json","utf8"));
  const manifest=JSON.parse(await readFile("artifacts/refresh/review/manifest.json","utf8"));
  const token=signSession(process.env.ADMIN_SESSION_SECRET!,process.env.ADMIN_PASSWORD_HASH!,Date.now()+15*60*1000);
  const headers={cookie:`portfolio_admin=${token}`,origin,"Content-Type":"application/json"};
  const getAdmin=async()=>{
    const response=await fetch(`${origin}/api/admin`,{headers,signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`ADMIN_READ_${response.status}`);
    return response.json();
  };
  const state=await getAdmin();
  if(state.projects.length!==baseline.projects.length)throw new Error("PROJECT_INVENTORY_CHANGED");
  if(state.jobs.some((job:{status:string})=>job.status==="running"))throw new Error("QUEUE_RUNNING");
  const plan=manifest.proposals.map((proposal:{projectId:string;slug:string;baseHash:string;proposedContent:Project})=>{
    const current=state.projects.find((p:{id:string})=>p.id===proposal.projectId);
    const before=baseline.projects.find((p:{id:string})=>p.id===proposal.projectId);
    if(!current||!before||current.slug!==proposal.slug)throw new Error("PROJECT_IDENTITY_CHANGED");
    const expected=projectSchema.parse(refreshProject(before.content));
    if(!isDeepStrictEqual(expected,proposal.proposedContent))throw new Error("PROPOSAL_CHANGED");
    if(createHash("sha256").update(JSON.stringify(before.content)).digest("hex")!==proposal.baseHash)throw new Error("BASE_HASH_MISMATCH");
    const alreadyPublished=isDeepStrictEqual(current.content,expected);
    if(!alreadyPublished&&!isDeepStrictEqual(current.content,before.content))throw new Error("CONTENT_CHANGED_SINCE_REVIEW");
    for(const key of ["visibility","display_order","auto_register"])if(current[key]!==before[key])throw new Error("PUBLICATION_POLICY_CHANGED");
    return {id:current.id,slug:current.slug,content:expected,visibility:current.visibility,displayOrder:current.display_order,autoRegister:current.auto_register,revision:new Date(current.updated_at).toISOString(),alreadyPublished};
  });
  console.log(JSON.stringify({mode,origin,projects:plan.map(({slug,alreadyPublished}:typeof plan[number])=>({slug,alreadyPublished})),newProjects:0}));
  if(mode==="inspect")return;
  await mkdir("artifacts/refresh/publication",{recursive:true});
  await writeFile(`artifacts/refresh/publication/admin-before-${Date.now()}.json`,JSON.stringify(state,null,2),{flag:"wx"});
  const published:string[]=[];
  for(const item of plan) {
    if(!item.alreadyPublished) {
      const {alreadyPublished:_,slug:__,id,...edit}=item;
      void _;void __;
      const response=await fetch(`${origin}/api/admin`,{method:"POST",headers,body:JSON.stringify({action:"edit",projectId:id,...edit}),signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error(`EDIT_FAILED_${response.status}`);
      const current=(await getAdmin()).projects.find((p:{id:string})=>p.id===id);
      if(!isDeepStrictEqual(current.content,item.content))throw new Error("CONTENT_VERIFICATION_FAILED");
    }
    published.push(item.slug);
    await writeFile("artifacts/refresh/publication/result.json",JSON.stringify({origin,published,checkedAt:new Date().toISOString()},null,2));
  }
  console.log(JSON.stringify({published,preservedVisibilityAndOrder:true,method:"existing authenticated admin edit API",newProjects:0,aiCalls:0}));
}
main().catch(error=>{
  const message=error instanceof Error?error.message:"PUBLICATION_FAILED";
  console.error(/^[A-Z_0-9]+$/.test(message)?message:"PUBLICATION_FAILED");process.exitCode=1;
});
