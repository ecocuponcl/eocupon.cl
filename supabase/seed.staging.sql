-- ---------------------------------------------------------------------------
-- Seed de staging para pruebas E2E
--
-- IMPORTANTE:
--   Este archivo NO debe contener UUIDs ni contraseñas reales.
--   El UUID del comercio de prueba se reemplaza manualmente después de crear
--   la cuenta vía el flujo de registro normal de la app.
--
-- Pasos para usar:
--   1. Crear cuenta de comercio de prueba en la app de staging
--      (ir a /auth/registro con email: comercio-qa@test.eocupon.cl)
--   2. Confirmar el email (el staging puede tener email confirmation desactivado)
--   3. Obtener el UUID del usuario:
--      SELECT id FROM auth.users WHERE email = 'comercio-qa@test.eocupon.cl';
--   4. Reemplazar <UUID_COMERCIO_QA> con ese UUID
--   5. Ejecutar este script en el SQL Editor del proyecto de staging:
--      supabase db execute --project-ref <staging_ref> < supabase/seed.staging.sql
--
-- ---------------------------------------------------------------------------

-- Limpiar datos de prueba anteriores (si los hay)
DELETE FROM public.coupons
  WHERE coupon_code LIKE 'QA-%' OR title LIKE '%E2E%' OR title LIKE '%QA%';

-- ---------------------------------------------------------------------------
-- Cupón de prueba principal
-- Reemplazar <UUID_COMERCIO_QA> con el UUID real del comercio de prueba
-- ---------------------------------------------------------------------------
INSERT INTO public.coupons (
  user_id,
  title,
  business_name,
  coupon_code,
  discount_percentage,
  description,
  conditions,
  is_public,
  redemption_period,
  generated_image_url
) VALUES (
  '<UUID_COMERCIO_QA>',                           -- reemplazar
  'Cupón E2E de prueba QA',
  'Comercio de Prueba QA',
  'QA-TEST-2026',
  25,
  'Cupón exclusivo para pruebas E2E de la suite de aceptación',
  'Solo para uso en entorno de staging. No válido en producción.',
  true,                                           -- público: aparece en la cuponera
  'unlimited',                                    -- sin límite: los tests no se bloquean entre sí
  '/api/coupon-image?title=Cup%C3%B3n+E2E&business=Comercio+QA&code=QA-TEST-2026&discount=25'
) ON CONFLICT (user_id, coupon_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Verificar el UUID del cupón creado (para usarlo en E2E_COUPON_ID)
-- ---------------------------------------------------------------------------
SELECT id, title, coupon_code, is_public
  FROM public.coupons
  WHERE coupon_code = 'QA-TEST-2026';

-- Copiar el `id` que aparece en el resultado y asignarlo a E2E_COUPON_ID en .env.test
