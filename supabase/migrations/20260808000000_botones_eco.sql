-- Botones Eco: persistencia separada para las tarjetas personalizadas de cada
-- usuaria. Las tarjetas oficiales siguen viviendo en el repositorio, mientras
-- que esta tabla guarda solo overrides y tarjetas nuevas.

set search_path = public;

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

drop trigger if exists user_eco_cards_set_updated_at on public.user_eco_cards;
create trigger user_eco_cards_set_updated_at
before update on public.user_eco_cards
for each row execute function public.set_updated_at();

alter table public.user_eco_cards enable row level security;

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
