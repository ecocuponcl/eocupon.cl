# archive/ — código histórico (NO USAR EN PRODUCCIÓN)

Este directorio contiene SQL de creación de esquema que se aplicó manualmente en
su momento a la base de datos de Supabase. **Es histórico y está obsoleto.**

La fuente de verdad del esquema ahora es:

    supabase/migrations/

Aplicar siempre con:

    supabase db push

## Qué había aquí (y por qué quedó obsoleto)

- `scripts/001_create_coupons_table.sql` — creaba `public.coupons` con el esquema
  VIEJO (`is_published`, `shares`, sin columna `views`) y `public.profiles`.
- `scripts/002_create_increment_function.sql` — creaba `increment_shares` apuntando
  a la columna `shares` (ya inexistente tras la migración).

El código de la aplicación espera el esquema NUEVO (`is_public`, `shares_count`,
`views`). Esa transición —y toda la seguridad (RLS, policies, índices, RPCs)—
ahora vive en `supabase/migrations/0001_init.sql` y `0002_security.sql`.

No ejecutes estos scripts: están desincronizados del esquema actual y romperían
la base de datos.
