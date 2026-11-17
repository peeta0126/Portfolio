import "server-only";
import { collectProblems } from "./presentation";
import { cache } from "react";
import { projects as archived } from "../data/project-archive";
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
  const projects = await getProjects();
  let saved: {project_slug:string;content:ProblemSolving}[]=[];
  if (!process.env.DATABASE_URL) {
    saved = legacyProblems.flatMap(content => {
      const original=archived.find(p=>p.title===content.project);
      return original ? [{project_slug:original.slug,content}] : [];
    });
  } else {
    try { saved=await db()`select project_slug,content from portfolio_home_problem_solving order by display_order`; }
    catch { /* Missing home table must not expose anything outside the public snapshot. */ }
  }
  return collectProblems(projects,saved,archived);
}
