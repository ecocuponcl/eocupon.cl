-- ---------------------------------------------------------------------------
-- 0014_staging_compat_and_track_rpc.sql
--
-- Dos objetivos:
--
-- 1) Compatibilidad con el esquema de staging (ecocupon-cl).
--    El proyecto de staging tiene `profiles.plan` en lugar de `plan_type`.
--    La migración 0011 intentó `revoke update (plan_type)` que falla cuando
--    la columna no existe. Este bloque añade `plan_type` si falta y lo sincroniza
--    con el valor de `plan`, de forma idempotente.
--
-- 2) Crear la RPC `revoke_counters_anon` que revoca el acceso anónimo a
--    `increment_shares` e `increment_views`. Los incrementos ahora pasan por
--    el Route Handler /api/track (introducido en la Fase 7), que corre en el
--    servidor. Revocar el GRANT a anon cierra el vector de inflación de
--    contadores documentado en la auditoría de aceptación.
--
-- Idempotente: todos los pasos usan IF NOT EXISTS o DO $$ ... IF EXISTS $$.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- 1) Añadir plan_type a profiles si no existe (staging compat)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'plan_type'
  ) then
    alter table public.profiles add column plan_type text default 'free';

    -- Si existe la columna `plan` (nombre legacy del staging), copiar sus valores
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name   = 'profiles'
        and column_name  = 'plan'
    ) then
      update public.profiles set plan_type = plan where plan is not null;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Revocar acceso anónimo a las RPCs de contadores
--    Ahora que /api/track maneja los incrementos desde el servidor,
--    ya no es necesario que el browser llame a Supabase directamente.
--
--    Nota: hay que revocar de PUBLIC (no solo de anon) porque un GRANT to PUBLIC
--    cubre todos los roles incluyendo anon. Verificado con has_function_privilege.
-- ---------------------------------------------------------------------------
-- Revocar el grant genérico a PUBLIC primero
revoke execute on function public.increment_shares(uuid) from public;
revoke execute on function public.increment_views(uuid) from public;
-- También revocar explícitamente de anon por si acaso
revoke execute on function public.increment_shares(uuid) from anon;
revoke execute on function public.increment_views(uuid) from anon;
-- Re-grant solo a los roles que lo necesitan (server-side y service_role)
grant execute on function public.increment_shares(uuid) to authenticated, service_role;
grant execute on function public.increment_views(uuid) to authenticated, service_role;

commit;
