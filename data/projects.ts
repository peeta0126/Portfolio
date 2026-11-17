import { projects as archived } from "./project-archive";
import { additionalProjects, refreshProject } from "./project-content";
import type { Project } from "../types";

// Static preview/fallback only. DATABASE_URL uses the approved DB snapshot instead.
export const projects: Project[] = [...archived, ...additionalProjects].map(refreshProject);
