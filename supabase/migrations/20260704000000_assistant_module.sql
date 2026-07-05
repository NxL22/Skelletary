-- Skelletary - migracion del modulo Asistente de informes (Skelly)
-- Esta migracion agrega el flag `has_assistant_access` a `profiles` y la
-- tabla `assistant_usage` para rate limiting (300 envios / 12h).
--
-- Es idempotente: puede correrse varias veces sin fallar. Si los objetos
-- ya existen, los deja como estan.

set search_path = public;

alter table public.profiles
add column if not exists has_assistant_access boolean not null default false;

-- El default `false` protege a usuarias existentes: nadie recibe acceso
-- al asistente sin que el owner lo habilite explicitamente al crear el usuario.

create table if not exists public.assistant_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default timezone('utc', now()),
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistant_usage_window_idx
  on public.assistant_usage(window_start);

-- Trigger para mantener updated_at sincronizado en cada UPSERT.
drop trigger if exists assistant_usage_set_updated_at on public.assistant_usage;
create trigger assistant_usage_set_updated_at
before update on public.assistant_usage
for each row execute function public.set_updated_at();

alter table public.assistant_usage enable row level security;

-- Solo el backend (service role) escribe en assistant_usage. El usuario
-- no necesita acceso directo: el Edge Function hace el UPSERT con service role.
drop policy if exists "assistant_usage_read_own" on public.assistant_usage;
create policy "assistant_usage_read_own"
on public.assistant_usage
for select
to authenticated
using (auth.uid() = user_id);