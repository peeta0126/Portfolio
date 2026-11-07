export type ProjectMetric = {
  label: string;
  before: string;
  after: string;
  change: string;
  evidence: string;
};

export type ArchitectureLayer = {
  name: string;
  items: string[];
};

export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
};

export type ProjectDetail = {
  overview?: string;
  problem?: string;
  goal?: string;
  roleSummary?: string;
  contributionNote?: string;
  architecture?: string;
  architectureLayers?: ArchitectureLayer[];
  erd?: string;
  api?: string;
  features?: string[];
  responsibilities?: string[];
  collaboration?: string[];
  process?: string;
  userFlow?: string[];
  implementation?: string[];
  troubleshooting?: {
    title: string;
    problem: string;
    solution: string;
    result?: string;
  }[];
  metrics?: ProjectMetric[];
  gallery?: ProjectImage[];
  performance?: string;
  result?: string;
  retrospective?: string;
  limitations?: string[];
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  period: string;
  kind: "Team Project" | "Personal Project" | "Project";
  tech: string[];
  cardTech?: string[];
  github?: string;
  demo?: string;
  thumbnail?: string;
  description: string;
  featured?: boolean;
  detail?: ProjectDetail;
};

export type ProblemSolving = {
  project: string;
  title: string;
  problem: string;
  solution: string;
  result: string;
  metric?: {
    before: string;
    after: string;
    change: string;
  };
};
