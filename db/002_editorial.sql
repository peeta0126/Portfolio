-- Additive only. No updates to published content, usage, logs, or manual locks.
create table if not exists portfolio_technical_analysis (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
  commit_sha text not null, source_hash text not null, pipeline_version text not null,
  facts jsonb not null, source_packet jsonb not null, token_usage jsonb not null default '{}',
  estimated_cost numeric not null default 0, created_at timestamptz not null default now(),
  unique(project_id,commit_sha,source_hash,pipeline_version)
);
create table if not exists portfolio_content_drafts (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
  technical_id uuid references portfolio_technical_analysis(id),
  parent_id uuid references portfolio_content_drafts(id),
  commit_sha text not null, analyzed_files jsonb not null default '[]',
  analysis_result jsonb not null, generated_content jsonb not null, base_content jsonb not null,
  status text not null default 'pending' check(status in ('pending','reviewed','published','rejected')),
  token_usage jsonb not null default '{}', estimated_cost numeric not null default 0,
  edited_fields text[] not null default '{}', revision integer not null default 1,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table portfolio_technical_analysis enable row level security;
alter table portfolio_content_drafts enable row level security;
