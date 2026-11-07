import "server-only";
import { cache } from "react";
import { projects as legacy } from "../data/projects";
import { problemSolving as legacyProblems } from "../data/problem-solving";
import { db } from "./automation/db";
import { projectSchema } from "./automation/schema";
import type { Project, ProblemSolving } from "../types";

export const getProjects = cache(async (): Promise<Project[]> => {
  if (!process.env.DATABASE_URL) return legacy;
  try {
    // Snapshot is updated atomically with publish/hide/edit operations. A failed read cannot expose private content.
    const [row] = await db()`select content from portfolio_public_snapshot where id=1`;
    if (!row) {
      const [state]=await db()`select exists(select 1 from projects limit 1) as configured`;
      return state.configured ? [] : legacy;
    }
    return projectSchema.array().parse(row.content);
  } catch {
    // Fail closed: never restore hidden legacy projects from a hardcoded backup during an outage.
    return [];
  }
});
export async function getProblems(): Promise<ProblemSolving[]> {
  if (!process.env.DATABASE_URL) return legacyProblems;
  const projects = await getProjects();
  let home:{project_slug:string;content:ProblemSolving}[]=[];
  try { home=await db()`select project_slug,content from portfolio_home_problem_solving order by display_order`; }
  catch { /* Compatibility during the additive migration; visible project filtering still applies below. */ }
  return projects.flatMap(p=>{
    const original=legacy.find(l=>l.slug===p.slug);
    if (original && JSON.stringify(original.detail?.troubleshooting)===JSON.stringify(p.detail?.troubleshooting)) {
      const saved=home.filter(item=>item.project_slug===p.slug).map(item=>item.content);
      return (saved.length ? saved : legacyProblems.filter(item=>item.project===original.title)).map(item=>({...item,project:p.title}));
    }
    return (p.detail?.troubleshooting ?? []).map(t=>({project:p.title,...t,result:t.result ?? ""}));
  });
}
