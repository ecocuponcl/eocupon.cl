# Entorno de staging y E2E

## Estado actual

- Los e2e **no** corren contra producción: `e2e/global-setup.ts` aborta la corrida
  si `.env.local` o `NEXT_PUBLIC_SUPABASE_URL` apuntan al proyecto de producción,
  salvo que se exporte `E2E_ALLOW_PROD=1`.
- En CI el job `e2e` existe pero está desactivado: los secretos `STAGING_*` están
  comentados en `.github/workflows/ci.yml`.
- No hay proyecto Supabase de staging. Crear uno es una decisión de costo y
  requiere autorización.

## Qué tests escriben datos

| Spec | Escribe | Estado |
| --- | --- | --- |
| `registro-real.spec.ts` | Crea usuario real | Bloqueado con `test.fixme` |
| `crear-cupon.spec.ts` | Crea cupones | Requiere cuenta de prueba |
| `separacion-comercios.spec.ts` | Crea comercios y cupones | Requiere cuenta de prueba |
| `activacion-cupon.spec.ts` | Activa instancias | Salta sin credenciales |
| `compartir-enlace.spec.ts` | Suma contadores | Bloqueado con `test.fixme` |
| `contadores-vistas-compartidos.spec.ts` | Suma contadores | Requiere cupón autorizado |
| `acceso-login.spec.ts` | Solo lee | Seguro |
| `codigo-individual.spec.ts` | Lee y valida | Requiere cupón |
| `confirmacion-correo.spec.ts` | Solo lee | Seguro |

## Opción recomendada: proyecto Supabase de staging

1. Crear un proyecto Supabase (`ecocupon-staging`) — costo y autorización.
2. Aplicar `supabase/migrations/0001..0019` contra ese proyecto.
3. Configurar en `.env.local` (copia local para pruebas) o en los secretos del CI:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
E2E_USER_EMAIL / E2E_USER_PASSWORD      # cuenta de prueba en staging
E2E_NEW_USER_EMAIL                      # registro; correo desechable
E2E_COUPON_ID                           # cupón de staging
```

4. Habilitar el job `e2e` en `.github/workflows/ci.yml` descomentando los
   secretos `STAGING_*` y pasándolos al paso de Playwright.
5. Nunca cargar esos secretos como `NEXT_PUBLIC_*` de producción.

## Opción sin costo: Supabase local

`supabase start` levanta Postgres, Auth y REST en Docker, y `db reset` aplica las
migraciones. Requiere Docker en marcha (hoy no lo está en este equipo) y descarga
imágenes la primera vez. Con ese entorno bastan `PLAYWRIGHT_BASE_URL` y las
variables locales; el guard deja de dispararse porque la URL ya no es producción.