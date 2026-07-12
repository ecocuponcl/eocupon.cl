-- ============================================================================
-- EcoCupon — Migración 0003: cupones accesibles por link (share-by-link)
--
-- Problema: la política SELECT solo permitía ver un cupón al dueño o si
-- is_public = true. Pero "privado" (botón "Guardar") no debe significar
-- "el link 404 para quien lo recibe". Los cupones son material de marketing
-- pensado para compartirse por link, y los UUID son inguessables, así que
-- exponerlos por link es efectivamente privado (no hay forma de enumerarlos).
--
-- Cambio: ANYONE (anon/authenticated) puede hacer SELECT de cualquier cupón.
-- La cuponera sigue filtrando solo is_public = true en la consulta de la app,
-- por lo que un cupón "Guardado" (privado) NO aparece en la cuponera pero su
-- link directo sí funciona.
-- ============================================================================

drop policy if exists coupons_select_own_or_public on public.coupons;

create policy coupons_select_own_or_public on public.coupons
  for select
  using (true);
