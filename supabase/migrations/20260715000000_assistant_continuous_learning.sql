-- Skelly: memoria privada, versionada y de activacion automatica.
-- Ninguna tabla tiene politicas para authenticated: solo Edge Functions con
-- service role pueden leer o escribir este conocimiento clinico saneado.

set search_path = public;
create extension if not exists vector with schema extensions;

create table if not exists public.assistant_feedback_triplets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_hash text not null,
  version integer not null default 1,
  feedback_kind text not null check (feedback_kind in ('accepted', 'corrected')),
  template_code text,
  sanitized_input text not null,
  sanitized_skelly_output text not null,
  sanitized_approved_output text not null,
  variables jsonb not null default '[]'::jsonb,
  correction_summary jsonb not null default '{}'::jsonb,
  model text,
  prompt_version text not null default 'continuous-v1',
  validation_status text not null check (validation_status in ('active', 'quarantined')),
  validation_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, input_hash, version)
);

create table if not exists public.assistant_memories (
  id uuid primary key default gen_random_uuid(),
  signature text not null unique,
  template_code text,
  generalized_input text not null,
  generalized_output text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(384),
  confidence numeric(5,4) not null default 0.20 check (confidence between 0 and 1),
  support_count integer not null default 1,
  correction_count integer not null default 0,
  contradiction_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'quarantined', 'disabled')),
  source_feedback_id uuid references public.assistant_feedback_triplets(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assistant_memory_versions (
  id bigint generated always as identity primary key,
  memory_id uuid not null references public.assistant_memories(id) on delete cascade,
  feedback_id uuid references public.assistant_feedback_triplets(id) on delete set null,
  version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (memory_id, version)
);

create table if not exists public.assistant_ai_templates (
  source_template_id text primary key,
  source_hash text not null,
  title text not null,
  category text not null,
  normalized_content text not null,
  variables jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(384),
  status text not null default 'active' check (status in ('active', 'quarantined')),
  synced_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assistant_admin_sessions (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assistant_admin_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_count integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assistant_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assistant_eval_runs (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  prompt_version text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  metrics jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.assistant_eval_results (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.assistant_eval_runs(id) on delete cascade,
  case_key text not null,
  input text not null,
  expected_rules jsonb not null default '{}'::jsonb,
  output text,
  passed boolean,
  latency_ms integer,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists assistant_feedback_user_created_idx
  on public.assistant_feedback_triplets(user_id, created_at desc);
create index if not exists assistant_memories_status_confidence_idx
  on public.assistant_memories(status, confidence desc, updated_at desc);
create index if not exists assistant_memories_embedding_idx
  on public.assistant_memories using hnsw (embedding extensions.vector_cosine_ops);

alter table public.assistant_feedback_triplets enable row level security;
alter table public.assistant_memories enable row level security;
alter table public.assistant_memory_versions enable row level security;
alter table public.assistant_ai_templates enable row level security;
alter table public.assistant_admin_sessions enable row level security;
alter table public.assistant_admin_attempts enable row level security;
alter table public.assistant_audit_log enable row level security;
alter table public.assistant_eval_runs enable row level security;
alter table public.assistant_eval_results enable row level security;

-- Recuperacion semantica colectiva con una preferencia suave por la usuaria.
create or replace function public.match_assistant_memories(
  query_embedding extensions.vector(384),
  requesting_user_id uuid,
  requested_template_code text default null,
  match_count integer default 4
)
returns table (
  id uuid, generalized_input text, generalized_output text,
  confidence numeric, support_count integer, similarity double precision,
  personal_support boolean
)
language sql stable security definer set search_path = public, extensions as $$
  select m.id, m.generalized_input, m.generalized_output, m.confidence,
    m.support_count, 1 - (m.embedding <=> query_embedding) as similarity,
    exists (
      select 1 from public.assistant_feedback_triplets f
      where f.user_id = requesting_user_id and f.id = m.source_feedback_id
    ) as personal_support
  from public.assistant_memories m
  where m.status = 'active' and m.embedding is not null
    and (requested_template_code is null or m.template_code is null or m.template_code = requested_template_code)
    and (1 - (m.embedding <=> query_embedding)) >= case when m.support_count = 1 then 0.91 else 0.78 end
  order by ((1 - (m.embedding <=> query_embedding)) +
    case when exists (select 1 from public.assistant_feedback_triplets f where f.user_id = requesting_user_id and f.id = m.source_feedback_id) then 0.04 else 0 end) desc,
    m.confidence desc
  limit least(greatest(match_count, 1), 4);
$$;

revoke all on function public.match_assistant_memories(extensions.vector, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.match_assistant_memories(extensions.vector, uuid, text, integer) to service_role;

-- Si core_templates ya fue sincronizada, la biblioteca derivada nace completa.
insert into public.assistant_ai_templates (
  source_template_id, source_hash, title, category, normalized_content, variables
)
select id, encode(extensions.digest(content, 'sha256'), 'hex'), title, category, content,
  coalesce((
    select jsonb_agg(distinct match[1])
    from regexp_matches(content, '\{\{([^}]+)\}\}', 'g') as match
  ), '[]'::jsonb)
from public.core_templates
on conflict (source_template_id) do update set
  source_hash = excluded.source_hash,
  title = excluded.title,
  category = excluded.category,
  normalized_content = excluded.normalized_content,
  variables = excluded.variables,
  synced_at = timezone('utc', now());
