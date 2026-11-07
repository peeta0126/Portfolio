import type { Project } from "../../types";
import type { Generated } from "./schema";

export function mergeProposal(current: Project, generated: Generated, locked: string[]): Project {
  const next: Project = { ...current, title: generated.title, subtitle: generated.subtitle,
    description: generated.description, tech: generated.tech,
    detail: { ...current.detail, overview: generated.overview, features: generated.features,
      implementation: generated.implementation, architecture: generated.architecture,
      process: generated.considerations.join(" "),
      troubleshooting: generated.troubleshooting.map(({ title, problem, solution, result }) => ({ title, problem, solution, result })) } };
  for (const field of locked) {
    if (field.startsWith("detail.")) {
      const key = field.slice(7) as keyof NonNullable<Project["detail"]>;
      Object.assign(next.detail!, { [key]: current.detail?.[key] });
    } else Object.assign(next, { [field]: current[field as keyof Project] });
  }
  return next;
}
