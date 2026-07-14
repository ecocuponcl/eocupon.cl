-- 0008_drop_unused_catalog_tables.sql
--
-- Elimina el modelo de catálogo que quedó sin uso.
--
-- Auditado 2026-07-14: las tablas products / categories / product_specs /
-- knasta_prices tienen 0 filas y ningún código del proyecto Next.js las referencia
-- (el catálogo de cupones se modela con la tabla coupons). Son remanentes del
-- prototipo previo ("knasta").
--
-- Se usan DROP ... CASCADE para soltar también las FKs entre ellas
-- (products_category_id_fkey, product_specs_product_id_fkey,
-- knasta_prices_product_id_fkey), todas sobre tablas vacías.

begin;

drop table if exists public.knasta_prices cascade;
drop table if exists public.product_specs cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;

commit;
