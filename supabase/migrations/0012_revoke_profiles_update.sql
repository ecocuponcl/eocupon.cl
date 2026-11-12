-- 0012_revoke_profiles_update.sql
--
-- Cierra el P0-5 del plan de evolución del 2026-11-11, que 0011 intentó y no
-- logró: `revoke update (plan_type)` a nivel de columna no quita nada mientras
-- exista un GRANT UPDATE a nivel de tabla, porque el permiso de tabla cubre
-- todas las columnas. Verificado después de aplicar 0011:
--
--   has_column_privilege('authenticated', 'public.profiles', 'plan_type', 'UPDATE') = true
--
-- Por qué se puede revocar entero y no hace falta devolver permisos columna a
-- columna: **la aplicación no referencia la tabla `profiles` en ninguna línea**
-- (ni select, ni update, ni upsert, en app/, lib/ ni components/). La única
-- escritura es la del trigger `handle_new_user`, que corre como SECURITY DEFINER
-- y por lo tanto no depende de estos permisos.
--
-- Con esto, `plan_type` deja de ser escribible por su propio titular. Importa
-- porque la política `profiles_update_own` sí permite al usuario escribir su
-- fila: cualquier límite futuro basado en `plan_type` habría sido decorativo.

revoke update on public.profiles from anon, authenticated;
