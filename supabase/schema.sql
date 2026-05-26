-- Skelletary - esquema base para Supabase
-- Este archivo define la separacion estricta entre:
-- 1. Biblioteca oficial del producto
-- 2. Biblioteca personal de cada usuario

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text default '',
  has_core_library boolean not null default true,
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
  source_type text not null default 'manual' check (source_type in ('manual', 'csv', 'xlsx', 'duplicated_from_core', 'import')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_templates_user_id_idx on public.user_templates(user_id);

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

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('csv', 'xlsx', 'manual')),
  status text not null check (status in ('pending', 'completed', 'failed')),
  filename text not null,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  title text,
  category text,
  shortcut text,
  content text,
  status text not null check (status in ('pending', 'imported', 'invalid', 'duplicate')),
  created_at timestamptz not null default timezone('utc', now())
);

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

drop trigger if exists user_template_stats_set_updated_at on public.user_template_stats;
create trigger user_template_stats_set_updated_at
before update on public.user_template_stats
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.core_templates enable row level security;
alter table public.user_templates enable row level security;
alter table public.user_template_stats enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;

-- La biblioteca oficial solo se comparte en lectura con usuarios autenticados
-- cuyo perfil tenga habilitada esa biblioteca.
drop policy if exists "core_templates_read_authenticated" on public.core_templates;
create policy "core_templates_read_authenticated"
on public.core_templates
for select
to authenticated
using (
  is_published = true
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

drop policy if exists "profiles_update_own" on public.profiles;
-- El perfil contiene decisiones sensibles del owner, como acceso comercial y
-- biblioteca oficial compartida. Por eso no dejamos updates directos del usuario.

drop policy if exists "user_templates_read_own" on public.user_templates;
create policy "user_templates_read_own"
on public.user_templates
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_templates_insert_own" on public.user_templates;
create policy "user_templates_insert_own"
on public.user_templates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_templates_update_own" on public.user_templates;
create policy "user_templates_update_own"
on public.user_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_templates_delete_own" on public.user_templates;
create policy "user_templates_delete_own"
on public.user_templates
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_template_stats_read_own" on public.user_template_stats;
create policy "user_template_stats_read_own"
on public.user_template_stats
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_template_stats_insert_own" on public.user_template_stats;
create policy "user_template_stats_insert_own"
on public.user_template_stats
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_template_stats_update_own" on public.user_template_stats;
create policy "user_template_stats_update_own"
on public.user_template_stats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "import_jobs_read_own" on public.import_jobs;
create policy "import_jobs_read_own"
on public.import_jobs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "import_jobs_insert_own" on public.import_jobs;
create policy "import_jobs_insert_own"
on public.import_jobs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "import_rows_read_own" on public.import_rows;
create policy "import_rows_read_own"
on public.import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.import_jobs jobs
    where jobs.id = import_job_id
      and jobs.user_id = auth.uid()
  )
);

drop policy if exists "import_rows_insert_own" on public.import_rows;
create policy "import_rows_insert_own"
on public.import_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.import_jobs jobs
    where jobs.id = import_job_id
      and jobs.user_id = auth.uid()
  )
);
