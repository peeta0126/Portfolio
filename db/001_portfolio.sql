-- Additive migration; never drops or overwrites existing portfolio content.
create table if not exists portfolio_settings (
  id integer primary key check (id=1), value jsonb not null default '{}'::jsonb
);
insert into portfolio_settings (id) values (1) on conflict do nothing;
create table if not exists projects (
  id uuid primary key default gen_random_uuid(), github_repo_id bigint unique,
  slug text not null unique, repo_name text, repository jsonb, content jsonb not null,
  visibility text not null default 'private' check (visibility in ('public','private')),
  display_order integer not null default 100, auto_register boolean not null default true,
  locked_fields text[] not null default '{}', analysis_status text not null default 'pending',
  last_commit text, source_hash text, project_type text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  last_synced_at timestamptz, published_at timestamptz
);
create table if not exists project_analysis (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
  commit_sha text not null, analyzed_files jsonb not null default '[]', analysis_result jsonb,
  generated_content jsonb, token_usage jsonb, estimated_cost numeric not null default 0,
  status text not null default 'pending', created_at timestamptz not null default now(),
  unique(project_id,commit_sha)
);
alter table projects add column if not exists source_manifest jsonb not null default '[]';
create table if not exists project_problem_solving (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
  title text not null, problem text not null, approach text not null, result text,
  evidence jsonb not null default '[]', source_type text not null default 'legacy', manually_edited boolean not null default false,
  unique(project_id,title)
);
create table if not exists sync_logs (
  id bigint generated always as identity primary key, repository_id bigint, event_type text not null,
  status text not null, error_message text, created_at timestamptz not null default now()
);
create table if not exists portfolio_jobs (
  id uuid primary key default gen_random_uuid(), kind text not null, dedupe_key text not null unique,
  payload jsonb not null, status text not null default 'queued', attempts integer not null default 0,
  available_at timestamptz not null default now(), lease_until timestamptz, lease_token uuid,
  error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists portfolio_jobs_pending on portfolio_jobs(status,available_at);
create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(), project_id uuid references projects(id),
  reserved_cost numeric not null, actual_cost numeric, input_tokens integer, output_tokens integer,
  status text not null default 'reserved', created_at timestamptz not null default now()
);
create table if not exists admin_attempts (
  fingerprint text primary key, attempts integer not null default 1, reset_at timestamptz not null
);
create table if not exists portfolio_public_snapshot (
  id integer primary key check(id=1), content jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists portfolio_images (
  id text primary key, data bytea not null, content_type text not null, created_at timestamptz not null default now()
);
-- Preserve the four home-page entries separately from the six detail-page troubleshooting entries.
create table if not exists portfolio_home_problem_solving (
  legacy_key text primary key, project_slug text not null references projects(slug),
  content jsonb not null, display_order integer not null,
  manually_edited boolean not null default true
);
-- No browser/anon access. Only the server DB role accesses these tables.
alter table projects enable row level security;
alter table project_analysis enable row level security;
alter table project_problem_solving enable row level security;
alter table sync_logs enable row level security;
alter table portfolio_jobs enable row level security;
alter table portfolio_settings enable row level security;
alter table ai_usage enable row level security;
alter table admin_attempts enable row level security;
alter table portfolio_public_snapshot enable row level security;
alter table portfolio_images enable row level security;
alter table portfolio_home_problem_solving enable row level security;
