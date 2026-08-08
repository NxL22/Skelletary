-- Skelletary - esquema base para Supabase
-- Este archivo define la separacion estricta entre:
-- 1. Biblioteca oficial del producto
-- 2. Biblioteca personal de cada usuario
-- Ninguna biblioteca debe quedar expuesta a usuarios anonimos.

create extension if not exists "pgcrypto";
create extension if not exists vector with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text default '',
  has_core_library boolean not null default true,
  -- Habilita el modulo Skelly Asistente (redactor de informes con LLM).
  -- El owner lo activa por usuaria al crearla o actualizarla via create-user.mjs.
  has_assistant_access boolean not null default false,
  access_status text not null default 'pending' check (access_status in ('pending', 'trial', 'active', 'expired')),
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Si el proyecto ya tenia una version anterior de profiles, estas sentencias
-- la alinean con el esquema actual sin obligar a recrear la tabla.
alter table public.profiles
add column if not exists has_core_library boolean not null default true;

-- El modulo Skelly Asistente (redactor de informes) es opt-in por usuaria.
-- El default `false` protege a cuentas existentes: nadie recibe acceso sin
-- que el owner lo habilite explicitamente al crearla o actualizarla.
alter table public.profiles
add column if not exists has_assistant_access boolean not null default false;

alter table public.profiles
alter column access_status set default 'pending';

alter table public.profiles
drop constraint if exists profiles_access_status_check;

alter table public.profiles
add constraint profiles_access_status_check
check (access_status in ('pending', 'trial', 'active', 'expired'));

create table if not exists public.core_templates (
  id text primary key,
  title text not null,
  category text not null,
  shortcut text not null default '',
  content text not null,
  is_published boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  shortcut text not null default '',
  content text not null,
  -- Antes existian 'csv', 'xlsx' e 'import' para soportar carga masiva.
  -- Ahora la importacion quedo fuera del producto, asi que solo se aceptan
  -- plantillas creadas a mano o promocionadas desde la biblioteca oficial.
  source_type text not null default 'manual' check (source_type in ('manual', 'duplicated_from_core')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_templates_user_id_idx on public.user_templates(user_id);

-- Botones Eco es una herramienta separada de la biblioteca de informes. Sus
-- personalizaciones viven en una tabla propia para que nunca se mezclen con
-- las plantillas oficiales o personales de Skelletary.
create table if not exists public.user_eco_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  group_id text not null default 'mis-tarjetas',
  name text not null,
  copy_text text not null,
  visual_key text not null default 'general',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, card_id)
);

create index if not exists user_eco_cards_user_id_idx on public.user_eco_cards(user_id);

-- Tabla de rate limiting del modulo Asistente.
-- Lleva el conteo de envios por usuaria dentro de una ventana movil de 12h.
-- El Edge Function hace el UPSERT con service role al validar cada request.
create table if not exists public.assistant_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default timezone('utc', now()),
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistant_usage_window_idx
  on public.assistant_usage(window_start);

drop trigger if exists assistant_usage_set_updated_at on public.assistant_usage;
create trigger assistant_usage_set_updated_at
before update on public.assistant_usage
for each row execute function public.set_updated_at();

alter table public.assistant_usage enable row level security;

-- El usuario puede leer su propio contador para mostrarlo en la UI.
-- El backend (service role) es el unico que escribe.
drop policy if exists "assistant_usage_read_own" on public.assistant_usage;
create policy "assistant_usage_read_own"
on public.assistant_usage
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.user_template_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  template_origin text not null check (template_origin in ('core', 'personal')),
  favorite boolean not null default false,
  copy_count integer not null default 0,
  last_copied_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, template_origin, template_id)
);

-- Limpieza de tablas obsoletas: la importacion masiva ya no forma parte del
-- producto, asi que retiramos import_jobs e import_rows si todavia existen.
drop table if exists public.import_rows;
drop table if exists public.import_jobs;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, has_core_library, access_status)
  values (new.id, coalesce(new.email, ''), true, 'pending')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.user_has_app_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = target_user_id
      and (
        (
          profile.access_status = 'trial'
          and (profile.trial_ends_at is null or profile.trial_ends_at > timezone('utc', now()))
        )
        or
        (
          profile.access_status = 'active'
          and (
            profile.subscription_ends_at is null
            or profile.subscription_ends_at > timezone('utc', now())
          )
        )
      )
  );
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

drop trigger if exists core_templates_set_updated_at on public.core_templates;
create trigger core_templates_set_updated_at
before update on public.core_templates
for each row execute function public.set_updated_at();

drop trigger if exists user_templates_set_updated_at on public.user_templates;
create trigger user_templates_set_updated_at
before update on public.user_templates
for each row execute function public.set_updated_at();

drop trigger if exists user_eco_cards_set_updated_at on public.user_eco_cards;
create trigger user_eco_cards_set_updated_at
before update on public.user_eco_cards
for each row execute function public.set_updated_at();

drop trigger if exists user_template_stats_set_updated_at on public.user_template_stats;
create trigger user_template_stats_set_updated_at
before update on public.user_template_stats
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.core_templates enable row level security;
alter table public.user_templates enable row level security;
alter table public.user_template_stats enable row level security;
alter table public.user_eco_cards enable row level security;

-- La biblioteca oficial solo se comparte en lectura con usuarios autenticados
-- cuyo perfil tenga habilitada esa biblioteca y acceso comercial vigente.
drop policy if exists "core_templates_read_authenticated" on public.core_templates;
create policy "core_templates_read_authenticated"
on public.core_templates
for select
to authenticated
using (
  is_published = true
  and public.user_has_app_access(auth.uid())
  and exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.has_core_library = true
  )
);

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- El perfil contiene decisiones sensibles del owner, como acceso comercial y
-- biblioteca oficial compartida. Por eso no dejamos updates directos del usuario.
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "user_templates_read_own" on public.user_templates;
create policy "user_templates_read_own"
on public.user_templates
for select
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_templates_insert_own" on public.user_templates;
create policy "user_templates_insert_own"
on public.user_templates
for insert
to authenticated
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_templates_update_own" on public.user_templates;
create policy "user_templates_update_own"
on public.user_templates
for update
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()))
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_templates_delete_own" on public.user_templates;
create policy "user_templates_delete_own"
on public.user_templates
for delete
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_template_stats_read_own" on public.user_template_stats;
create policy "user_template_stats_read_own"
on public.user_template_stats
for select
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_template_stats_insert_own" on public.user_template_stats;
create policy "user_template_stats_insert_own"
on public.user_template_stats
for insert
to authenticated
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_template_stats_update_own" on public.user_template_stats;
create policy "user_template_stats_update_own"
on public.user_template_stats
for update
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()))
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_eco_cards_read_own" on public.user_eco_cards;
create policy "user_eco_cards_read_own"
on public.user_eco_cards
for select
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_eco_cards_insert_own" on public.user_eco_cards;
create policy "user_eco_cards_insert_own"
on public.user_eco_cards
for insert
to authenticated
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_eco_cards_update_own" on public.user_eco_cards;
create policy "user_eco_cards_update_own"
on public.user_eco_cards
for update
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()))
with check (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

drop policy if exists "user_eco_cards_delete_own" on public.user_eco_cards;
create policy "user_eco_cards_delete_own"
on public.user_eco_cards
for delete
to authenticated
using (auth.uid() = user_id and public.user_has_app_access(auth.uid()));

-- Memoria privada de Skelly Redactor. Estas tablas no tienen politicas para
-- authenticated: el cliente nunca accede al conocimiento directamente.
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
  user_id uuid references auth.users(id) on delete cascade,
  scope text not null default 'personal' check (scope in ('personal', 'global')),
  signature text not null,
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

create unique index if not exists assistant_memories_personal_signature_idx
  on public.assistant_memories(user_id, signature)
  where scope = 'personal' and user_id is not null;
create unique index if not exists assistant_memories_global_signature_idx
  on public.assistant_memories(signature)
  where scope = 'global';
create index if not exists assistant_memories_user_status_idx
  on public.assistant_memories(user_id, status, confidence desc, updated_at desc);

-- La forma de retorno incluye el alcance de la memoria. Si el esquema se
-- aplica sobre una base que ya tenia la funcion antigua, hay que eliminarla
-- antes porque PostgreSQL no permite cambiar columnas OUT con replace.
drop function if exists public.match_assistant_memories(
  extensions.vector,
  uuid,
  text,
  integer
);

create function public.match_assistant_memories(
  query_embedding extensions.vector(384),
  requesting_user_id uuid,
  requested_template_code text default null,
  match_count integer default 3
)
returns table (
  id uuid, generalized_input text, generalized_output text,
  confidence numeric, support_count integer, similarity double precision,
  personal_support boolean, memory_scope text
)
language sql stable security definer set search_path = public, extensions as $$
  select memory.id, memory.generalized_input, memory.generalized_output,
    memory.confidence, memory.support_count,
    1 - (memory.embedding <=> query_embedding) as similarity,
    memory.scope = 'personal' and memory.user_id = requesting_user_id as personal_support,
    memory.scope as memory_scope
  from public.assistant_memories memory
  where memory.status = 'active' and memory.embedding is not null
    and ((memory.scope = 'personal' and memory.user_id = requesting_user_id) or memory.scope = 'global')
    and (requested_template_code is null or memory.template_code = requested_template_code)
    and (1 - (memory.embedding <=> query_embedding)) >=
      case when memory.support_count <= 1 then 0.93 when memory.support_count = 2 then 0.88 else 0.82 end
  order by (memory.scope = 'personal' and memory.user_id = requesting_user_id) desc,
    (1 - (memory.embedding <=> query_embedding)) desc, memory.confidence desc
  limit least(greatest(match_count, 1), 3);
$$;

revoke all on function public.match_assistant_memories(extensions.vector, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.match_assistant_memories(extensions.vector, uuid, text, integer)
  to service_role;

alter table public.assistant_feedback_triplets enable row level security;
alter table public.assistant_memories enable row level security;
alter table public.assistant_memory_versions enable row level security;
alter table public.assistant_ai_templates enable row level security;
alter table public.assistant_admin_sessions enable row level security;
alter table public.assistant_admin_attempts enable row level security;
alter table public.assistant_audit_log enable row level security;
alter table public.assistant_eval_runs enable row level security;
alter table public.assistant_eval_results enable row level security;
