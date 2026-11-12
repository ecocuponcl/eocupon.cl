-- 0011_close_enumeration_and_lock_plan_type.sql
--
-- Cierra los dos hallazgos P0 de seguridad del plan de evolución del 2026-11-11.
--
-- 1) `user_exists(text)` era un oráculo de enumeración de correos: estaba
--    concedida a `anon` y el formulario de recuperación la llamaba desde el
--    navegador, así que cualquiera podía preguntar, correo por correo, quién
--    tiene cuenta en el sitio.
--
--    El código dejó de llamarla (app/auth/recuperar/page.tsx ahora responde
--    siempre lo mismo). Aquí se revoca el permiso.
--
--    Ojo con el arreglo que parece obvio: mover la comprobación a una ruta de
--    servidor NO cierra el oráculo, porque una ruta pública devuelve el mismo
--    dato al mismo visitante anónimo. Lo que lo cierra es dejar de preguntar.
--
-- 2) `profiles_update_own` permite al titular escribir cualquier columna de su
--    propia fila, incluida `plan_type`. Cualquier límite basado en esa columna
--    sería decorativo: el usuario podría subirse de plan por PostgREST.
--    Se revoca el UPDATE a nivel de columna, que es lo único que RLS no puede
--    expresar por sí sola.

revoke execute on function public.user_exists(text) from public, anon, authenticated;

revoke update (plan_type) on public.profiles from anon, authenticated;
