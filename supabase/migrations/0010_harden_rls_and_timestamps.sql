-- 0010_harden_rls_and_timestamps.sql
--
-- Cierra hallazgos de la auditoría del 2026-11-09. NO aplicada todavía:
-- requiere autorización porque cambia qué datos puede leer el rol anónimo.
--
-- 1) `coupons` tenía una policy de SELECT con `using (true)`: cualquiera con la
--    clave publicable podía listar TODOS los cupones, incluidos los privados.
--    Se acota a "público o propio".
--
--    El enlace directo a un cupón privado SIGUE funcionando: `app/cupon/[id]`
--    ahora lee ese cupón con service role tras validar el formato del UUID
--    (`lib/supabase/admin.ts`), así que el UUID actúa como capacidad y ya no hace
--    falta abrir la tabla entera.
--
--    PRECONDICIÓN: `SUPABASE_SERVICE_ROLE_KEY` debe estar configurada en el
--    entorno (Vercel). Si falta, el código cae al cliente con RLS y los enlaces
--    a cupones privados dejarían de funcionar. Verificar ANTES de aplicar.
--
-- 2) `profiles` tiene RLS y 4 policies en producción, pero ninguna migración las
--    crea. Se versionan aquí (idempotente) para que la base sea reproducible.
--
-- 3) Se revocan privilegios innecesarios: TRUNCATE a los roles de API (no pasa
--    por RLS) y EXECUTE sobre la función de trigger.
--
-- 4) `updated_at` nunca cambiaba porque no había trigger. Se añade.

begin;

-- ---------------------------------------------------------------------------
-- 1) SELECT de coupons: público o propio
-- ---------------------------------------------------------------------------
drop policy if exists coupons_select_own_or_public on public.coupons;

create policy coupons_select_own_or_public on public.coupons
  for select
  using (is_public = true or auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) profiles: RLS + policies de dueño (reproduce el estado real de producción)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3) Privilegios innecesarios
-- ---------------------------------------------------------------------------
revoke truncate on public.coupons, public.profiles from anon, authenticated;

-- Postgres concede EXECUTE a PUBLIC por defecto en toda función nueva, así que
-- revocar solo a anon/authenticated no cambia nada: hay que quitar PUBLIC.
-- Las funciones de trigger no necesitan EXECUTE para quien dispara el INSERT.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) updated_at automático
-- ---------------------------------------------------------------------------
-- `security invoker` (por defecto) + search_path fijo: sin esto la función
-- quedaría ejecutable por cualquiera y con búsqueda dependiente del llamante.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

commit;

-- Pendiente (fuera de esta migración, requiere cambio de código):
--   * `user_exists(text)` es un oráculo de enumeración de correos abierto a anon.
--     Para cerrarlo hay que mover la comprobación a una ruta de servidor y
--     revocar EXECUTE, o aceptar el riesgo de forma explícita.
--   * `increment_views` / `increment_shares` siguen expuestas a anon sin límite:
--     las métricas se pueden inflar. Cerrarlo exige rate limiting en servidor.