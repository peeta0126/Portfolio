export type ProjectDetail = {
  overview?: string; problem?: string; goal?: string; architecture?: string;
  erd?: string; api?: string; features?: string[]; process?: string;
  userFlow?: string[]; implementation?: string[];
  troubleshooting?: { title: string; problem: string; solution: string; result?: string }[];
  performance?: string; retrospective?: string;
};
export type Project = {
  slug: string; title: string; subtitle: string; period: string; tech: string[];
  github?: string; demo?: string; thumbnail?: string; description: string;
  featured?: boolean; detail?: ProjectDetail;
};
export type ProblemSolving = { project: string; title: string; problem: string; cause: string; solution: string; result: string };
