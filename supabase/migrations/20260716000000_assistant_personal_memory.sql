-- Skelly Redactor: memoria personal por defecto.
-- Las memorias globales existen solo cuando el owner las promueve desde Lab.

set search_path = public;

alter table public.assistant_memories
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.assistant_memories
  add column if not exists scope text not null default 'personal';

alter table public.assistant_memories
  drop constraint if exists assistant_memories_scope_check;

alter table public.assistant_memories
  add constraint assistant_memories_scope_check
  check (scope in ('personal', 'global'));

-- Vinculamos la memoria antigua con la usuaria que genero su feedback.
update public.assistant_memories memory
set user_id = feedback.user_id,
    scope = 'personal'
from public.assistant_feedback_triplets feedback
where memory.source_feedback_id = feedback.id
  and memory.user_id is null;

-- Sin origen demostrable no debe convertirse accidentalmente en conocimiento global.
update public.assistant_memories
set status = 'quarantined', scope = 'personal'
where user_id is null;

alter table public.assistant_memories
  drop constraint if exists assistant_memories_signature_key;

create unique index if not exists assistant_memories_personal_signature_idx
  on public.assistant_memories(user_id, signature)
  where scope = 'personal' and user_id is not null;

create unique index if not exists assistant_memories_global_signature_idx
  on public.assistant_memories(signature)
  where scope = 'global';

create index if not exists assistant_memories_user_status_idx
  on public.assistant_memories(user_id, status, confidence desc, updated_at desc);

-- PostgreSQL no permite cambiar el tipo/numero de columnas OUT con
-- `create or replace function`. La migracion anterior tenia otra forma de
-- retorno, por eso la eliminamos primero y la recreamos con el contrato nuevo.
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
  id uuid,
  generalized_input text,
  generalized_output text,
  confidence numeric,
  support_count integer,
  similarity double precision,
  personal_support boolean,
  memory_scope text
)
language sql stable security definer set search_path = public, extensions as $$
  select
    memory.id,
    memory.generalized_input,
    memory.generalized_output,
    memory.confidence,
    memory.support_count,
    1 - (memory.embedding <=> query_embedding) as similarity,
    memory.scope = 'personal' and memory.user_id = requesting_user_id as personal_support,
    memory.scope as memory_scope
  from public.assistant_memories memory
  where memory.status = 'active'
    and memory.embedding is not null
    and (
      (memory.scope = 'personal' and memory.user_id = requesting_user_id)
      or memory.scope = 'global'
    )
    and (requested_template_code is null or memory.template_code = requested_template_code)
    and (1 - (memory.embedding <=> query_embedding)) >=
      case
        when memory.support_count <= 1 then 0.93
        when memory.support_count = 2 then 0.88
        else 0.82
      end
  order by
    (memory.scope = 'personal' and memory.user_id = requesting_user_id) desc,
    (1 - (memory.embedding <=> query_embedding)) desc,
    memory.confidence desc
  limit least(greatest(match_count, 1), 3);
$$;

revoke all on function public.match_assistant_memories(extensions.vector, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.match_assistant_memories(extensions.vector, uuid, text, integer)
  to service_role;
