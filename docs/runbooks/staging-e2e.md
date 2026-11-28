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
migraciones. Con ese entorno bastan `PLAYWRIGHT_BASE_URL` y las variables
locales; el guard deja de dispararse porque la URL ya no es producción.

En este equipo el intento del 2026-11-28 no llegó a estado healthy: analytics,
storage, realtime y studio agotaron sus health checks y el CLI detuvo los
contenedores. Antes de eso sí aplicó las migraciones `0001–0019`, así que el
esquema quedó correcto; falta un Docker con más recursos o usar un proyecto de
staging. También se corrigió `[db.seed] enabled = false` en `supabase/config.toml`:
apuntaba a `./seed.sql`, que no existe, y `seed.staging.sql` es una plantilla con
placeholders que no se puede ejecutar tal cual.

## Suite de pagos (`e2e/pago-suscripcion.spec.ts`)

Cubre, contra Flow Sandbox:

| Caso | Qué verifica |
| --- | --- |
| Suscripción | login, plan, tarjeta, retorno 303, plan Pro y `plan_ends_at` |
| Reintento | volver a pulsar el plan no crea una segunda suscripción |
| Re-suscripción | cancelar en Flow y volver a contratar crea una nueva |
| Aviso de pago | registra el cobro y el duplicado no extiende el periodo |
| Pago rechazado | `status: 3`, sin cobro y sin cambio de fecha |
| Importe distinto | se ignora (`ignored: "amount"`) |
| Token desconocido | responde 500 |
| Sin token | responde 400 |

Variables: `E2E_STAGING=1`, `E2E_USER_EMAIL/PASSWORD`,
`E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `FLOW_E2E_API_KEY`,
`FLOW_E2E_SECRET_KEY` y `PLAYWRIGHT_BASE_URL`. La app bajo prueba debe correr con
`FLOW_ENV=sandbox`, las llaves de Sandbox y `NEXT_PUBLIC_SITE_URL` apuntando a la
URL de pruebas.

Diferencia importante: el aviso de Flow se **inyecta** llamando al mismo endpoint
que Flow usa, porque el callback real llega de servidor a servidor y necesita una
URL pública que en CI no existe. El endpoint y su lógica son los mismos; lo que
no se ejercita es la entrega desde Flow.

## CI

El job `e2e-pagos` de `.github/workflows/ci.yml` detecta si están los secretos de
staging y de Flow Sandbox. Si faltan, escribe un `warning` y termina sin ejecutar
pruebas (no finge una corrida). Secretos: `STAGING_*`, `STAGING_E2E_USER_*`,
`FLOW_E2E_API_KEY`, `FLOW_E2E_SECRET_KEY`.

**No usar `E2E_ALLOW_PROD=1`**: la suite nunca debe correr contra producción.