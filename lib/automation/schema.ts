import { z } from "zod";

export const safeUrl = z.string().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password &&
      !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[|0\.)/i.test(u.hostname) && u.hostname.includes(".");
  } catch { return false; }
}, "공개 HTTPS URL을 입력하세요.");
export const imageUrl = z.string().refine(v => !v || /^\/projects\/[a-zA-Z0-9._-]+$/.test(v) || /^\/api\/images\/[a-f0-9]{64}$/.test(v) || (safeUrl.safeParse(v).success && /\.(png|webp|jpe?g)(\?.*)?$/i.test(v)), "PNG, JPEG, WebP 경로가 필요합니다.");
const text = z.string().max(6000);
const list = z.array(z.string().max(1000)).max(30);
export const troubleSchema = z.object({ title: text, problem: text, solution: text, result: text });
export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,100}$/), title: z.string().min(1).max(200), subtitle: text,
  period: text, kind: z.enum(["Team Project", "Personal Project", "Project"]), tech: list, cardTech: list.optional(),
  github: safeUrl.optional(), demo: safeUrl.optional(), thumbnail: imageUrl.optional(), description: text,
  featured: z.boolean().optional(),
  detail: z.object({
    overview: text.optional(), problem: text.optional(), goal: text.optional(), roleSummary: text.optional(),
    contributionNote: text.optional(), architecture: text.optional(), erd: text.optional(), api: text.optional(),
    architectureLayers: z.array(z.object({ name: text, items: list })).optional(),
    features: list.optional(), responsibilities: list.optional(), collaboration: list.optional(), process: text.optional(),
    userFlow: list.optional(), implementation: list.optional(), troubleshooting: z.array(troubleSchema.extend({ result: text.optional() })).max(15).optional(),
    metrics: z.array(z.object({ label: text, before: text, after: text, change: text, evidence: text })).optional(),
    gallery: z.array(z.object({ src: imageUrl, alt: text, caption: text })).optional(),
    performance: text.optional(), result: text.optional(), retrospective: text.optional(),
  }).strict().optional(),
}).strict();
export const generatedSchema = z.object({
  title: z.string().min(1).max(200), subtitle: z.string().max(300), description: z.string().max(600),
  projectType: z.string().max(100), tech: z.array(z.string().max(80)).max(20),
  overview: z.string().max(1800), features: z.array(z.string().max(300)).max(12),
  implementation: z.array(z.string().max(400)).max(12), architecture: z.string().max(1800),
  considerations: z.array(z.string().max(400)).max(10),
  troubleshooting: z.array(troubleSchema.extend({ evidence: z.array(z.string()).min(1).max(8) })).max(5),
  evidence: z.array(z.object({ claim: z.string().max(600), sources: z.array(z.string()).min(1).max(8) })).min(1).max(40),
  reviewNotes: z.array(z.string().max(600)).max(15),
}).strict();
export type Generated = z.infer<typeof generatedSchema>;
export const settingsSchema = z.object({
  autoPublish: z.boolean(), includeForks: z.boolean(), includeArchived: z.boolean(),
  excludedPattern: z.string().max(200), monthlyBudget: z.number().min(0).max(1000),
  monthlyCalls: z.number().int().min(0).max(10000),
}).strict();
export type Settings = z.infer<typeof settingsSchema>;
export const defaults: Settings = { autoPublish: false, includeForks: false, includeArchived: false, excludedPattern: "test,practice,tutorial,exercise", monthlyBudget: 5, monthlyCalls: 30 };
