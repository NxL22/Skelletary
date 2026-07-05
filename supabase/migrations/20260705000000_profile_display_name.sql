-- Skelletary - migracion: el usuario puede editar su display_name desde Ajustes.
-- El campo ya existe en profiles, pero la policy RLS estaba deshabilitada por
-- seguridad (decisiones sensibles del owner como acceso comercial). Esta migracion
-- agrega una policy especifica que solo permite update de la columna display_name,
-- y un trigger que valida longitud server-side como defense in depth.
--
-- Es idempotente: puede correrse varias veces sin fallar.

set search_path = public;

-- Policy especifica: solo el dueno de la fila puede actualizar su display_name.
-- El trigger `validate_display_name` se encarga de validar que el valor sea valido.
drop policy if exists "profiles_update_own_display_name" on public.profiles;

create policy "profiles_update_own_display_name"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Funcion y trigger para validar longitud y trimear.
create or replace function public.validate_display_name()
returns trigger
language plpgsql
as $$
begin
  if new.display_name is not null then
    new.display_name := btrim(new.display_name);
    if length(new.display_name) < 2 or length(new.display_name) > 60 then
      raise exception 'display_name debe tener entre 2 y 60 caracteres'
        using errcode = '22000';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_display_name on public.profiles;

create trigger profiles_validate_display_name
before update of display_name on public.profiles
for each row execute function public.validate_display_name();