-- 0009_drop_product_images_bucket_upload_code.sql
--
-- Elimina el código de subida asociado al bucket "product-images", que quedó
-- sin uso. El proyecto sube logos vía /api/upload-logo al bucket "logos"
-- (público); el bucket "product-images" está vacío y no es referenciado por
-- ningún código del proyecto.
--
-- Auditado 2026-07-14: funciones check_upload_limit / record_upload /
-- get_image_url, triggers enforce_upload_limit / track_upload, y las políticas
-- Storage de product-images no tienen consumidores vivos.
--
-- Nota: la tabla storage.objects y el bucket se manejan vía Storage API; aquí
-- solo se quita el código SQL (funciones, triggers, políticas RLS). El bucket
-- puede borrarse luego desde el dashboard de Storage si se desea.

begin;

-- 1) Políticas Storage del bucket product-images (esquema storage)
drop policy if exists "Public can view images" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Authenticated users can delete images" on storage.objects;

-- 2) Triggers sobre storage.objects (dependen de las funciones)
drop trigger if exists enforce_upload_limit on storage.objects;
drop trigger if exists track_upload on storage.objects;

-- 3) Funciones SECURITY DEFINER asociadas
drop function if exists public.check_upload_limit() cascade;
drop function if exists public.record_upload() cascade;
drop function if exists public.get_image_url(text) cascade;

-- 4) Tabla de seguimiento de uploads (sin uso)
drop table if exists public.upload_tracking cascade;

commit;
