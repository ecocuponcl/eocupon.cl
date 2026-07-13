-- Logo Storage RLS: eliminar políticas (upload server-side vía service_role).
--
-- Histórico: 0005_coupon_logo creó el bucket `logos` (público) con políticas que
-- forzaban aislamiento por carpeta (storage.foldername(name)[1] = auth.uid()).
-- En este proyecto auth.uid() NO se resuelve en el contexto de RLS de Storage
-- (supabase/supabase#46262: Storage RLS evaluaba requests autenticados como anon
-- cuando el proyecto usa JWT Signing Keys). Esas políticas fallaban con
-- "new row violates row-level security policy" pese a sesión y ruta correctas.
--
-- Solución adoptada: subir logos desde el servidor con SUPABASE_SERVICE_ROLE_KEY
-- en /api/upload-logo, que bypassea la RLS de Storage y nombra la ruta como
-- logos/<user.id>/... (aislamiento impuesto por la app, no por RLS).
--
-- Por tanto estas políticas ya no se usan:
--   - escritura: service_role (ignora RLS de Storage)
--   - lectura:   bucket público, servido por URL de CDN (no pasa por RLS)
-- Se eliminan para no dejar políticas muertas/engañosas. El bucket queda público
-- sin políticas: el acceso por SDK queda denegado por defecto, que es lo correcto
-- para este flujo.

drop policy if exists "Users can upload their own logo" on storage.objects;
drop policy if exists "Users can update their own logo" on storage.objects;
drop policy if exists "Users can delete their own logo" on storage.objects;
