-- ============================================================================
-- EcoCupon — Migración 0004: RPC user_exists (oráculo de registro para recovery)
--
-- Problema: resetPasswordForEmail NO revela si un email está registrado
-- (anti-enumeración). El formulario de recuperación mostraba "te enviamos el
-- correo" aunque la cuenta no existiera, lo que es engañoso.
--
-- Solución: RPC que devuelve boolean según exista el email en auth.users.
-- El formulario la consulta antes de llamar a resetPasswordForEmail:
--   - existe  -> envía el reset (un solo correo, al usuario correcto)
--   - no existe -> redirige a /auth/registro
--
-- NOTA DE SEGURIDAD: al ser ejecutable por anon, esta función es un oráculo de
-- enumeración de emails (cualquiera puede saber si un correo tiene cuenta).
-- Es una decisión de producto deliberada (prioriza UX/conversión sobre ocultar
-- la existencia de cuentas). Devuelve SOLO un booleano, sin filas ni PII.
-- ============================================================================

create or replace function public.user_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(p_email)
  );
$$;

grant execute on function public.user_exists(text) to anon, authenticated;
