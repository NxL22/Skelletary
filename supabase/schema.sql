-- Skelletary - esquema base para Supabase
-- Este archivo define la separacion estricta entre:
-- 1. Biblioteca oficial del producto
-- 2. Biblioteca personal de cada usuario
-- Ninguna biblioteca debe quedar expuesta a usuarios anonimos.

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
  -- Antes existian 'csv', 'xlsx' e 'import' para soportar carga masiva.
  -- Ahora la importacion quedo fuera del producto, asi que solo se aceptan
  -- plantillas creadas a mano o promocionadas desde la biblioteca oficial.
  source_type text not null default 'manual' check (source_type in ('manual', 'duplicated_from_core')),
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

drop trigger if exists user_template_stats_set_updated_at on public.user_template_stats;
create trigger user_template_stats_set_updated_at
before update on public.user_template_stats
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.core_templates enable row level security;
alter table public.user_templates enable row level security;
alter table public.user_template_stats enable row level security;

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