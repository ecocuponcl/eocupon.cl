-- 0007_consolidate_coupon_image_column.sql
--
-- Consolida el modelo de imágenes del cupón en un único campo con nombre honesto.
--
-- Contexto (auditado 2026-07-14):
--   * public.coupons tenía DOS columnas para "la imagen":
--       - image_url            -> en la práctica almacena la URL de la imagen
--                                 final generada por /api/coupon-image
--                                 (todas las filas existentes: '/api/coupon-image?...').
--       - generated_image_url  -> declarada desde 0001_init.sql pero NUNCA usada
--                                 por ningún código; 100% NULL en todas las filas.
--   * No existen vistas, triggers, índices, políticas RLS ni funciones SQL que
--     dependan de estas columnas. get_image_url() pertenece al bucket
--     product-images y NO referencia coupons.image_url.
--   * El proyecto Next.js es el único consumidor de la columna.
--
-- Objetivo: dejar un solo campo, correctamente nombrado, que represente la
-- imagen final generada del cupón.
--
-- Estrategia: NO se copian datos. RENAME COLUMN conserva los valores existentes,
-- por lo que primero se elimina la columna muerta y luego se renombra la real.

begin;

-- 1) Elimina la columna muerta (sin datos, sin dependencias).
alter table public.coupons
  drop column if exists generated_image_url;

-- 2) Renombra la columna real a su nombre honesto. Conserva todos los datos.
alter table public.coupons
  rename column image_url to generated_image_url;

-- 3) Documenta el significado del campo para el "yo del futuro".
comment on column public.coupons.generated_image_url is
  'URL de la imagen final del cupón generada por /api/coupon-image (compuesta con logo y QR). Valor derivado de title/business_name/coupon_code/discount_percentage/logo_url/id.';

commit;
