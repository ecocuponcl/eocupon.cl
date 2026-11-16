# Pruebas funcionales (Playwright)

Suite de flujos de EcoCupon. `playwright.config.ts` levanta el servidor con
`pnpm dev` y reutiliza uno ya en marcha en `http://localhost:3000`.

## Ejecutar

```bash
pnpm exec playwright install chromium   # una sola vez
pnpm test:e2e                           # toda la suite
pnpm test:e2e -- e2e/login-invalido.spec.ts   # un archivo
pnpm test:e2e:report                    # abre el informe HTML
```

## Qué pasa sin configuración adicional

Se ejecutan y pasan sin credenciales:

| Archivo | Qué verifica |
|---|---|
| `acceso-login.spec.ts` | la pantalla de login carga con sus campos y enlaces |
| `login-invalido.spec.ts` | credenciales falsas → mensaje de error y `400` real de Supabase Auth |
| `validacion-registro.spec.ts` | el registro existe y valida el correo en el navegador (no envía) |
| `recuperacion-correo-inexistente.spec.ts` | correo inexistente → pantalla "Este correo no está registrado" |
| `proteccion-dashboard.spec.ts` | `/dashboard*` sin sesión termina en `/auth/login` |
| `cuponera-publica.spec.ts` | la cuponera carga sin sesión |
| `cupon-publico.spec.ts` | un UUID inexistente devuelve 404 |
| `google-oauth.spec.ts` | la app pide `/authorize?provider=google` con el callback correcto |
| `compartir-enlace.spec.ts` | un cupón inexistente no expone acciones de compartir |
| `confirmacion-correo.spec.ts` | la pantalla `/auth/verificar` responde |
| `crear-cupon.spec.ts` | `/dashboard/crear` exige sesión |

El resto se salta solo con un motivo legible.

## Qué necesita credenciales o autorización

Los flujos completos requieren una **cuenta de prueba autorizada**. El proyecto
Supabase configurado hoy es **producción**: no se crean usuarios ni se escriben
datos sin permiso explícito.

| Variable | Para qué |
|---|---|
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | login exitoso, persistencia de sesión, logout |
| `E2E_GOOGLE_EMAIL` | login con Google (además, hoy bloqueado por `redirect_uri_mismatch`) |
| `E2E_NEW_USER_EMAIL` | registro real (crea usuario: requiere autorización) |
| `E2E_CONFIRMATION_URL` | enlace de confirmación de correo |
| `E2E_COUPON_ID` | cupón de prueba para compartir y medir contadores |
| `E2E_USER_EMAIL_2` / `E2E_USER_PASSWORD_2` | segundo comercio para tests de separación de datos |

Ejemplo:

```bash
E2E_USER_EMAIL=cuenta-de-prueba@ejemplo.cl \
E2E_USER_PASSWORD='...' \
E2E_COUPON_ID='uuid-del-cupón-de-prueba' \
pnpm test:e2e
```

Nunca escribas estas credenciales en un archivo versionado.

**Para ejecutar el flujo E2E completo:** usar el proyecto de staging con
`SUPABASE_SERVICE_ROLE_KEY` configurada. Ver `supabase/seed.staging.sql` para
preparar los datos de prueba.

## Pendientes marcados con `fixme`

`registro-real.spec.ts`, `crear-cupon.spec.ts`, `compartir-enlace.spec.ts`,
`contadores-vistas-compartidos.spec.ts`, `codigo-individual.spec.ts`,
`flujo-canje.spec.ts`, `doble-canje.spec.ts` y `separacion-comercios.spec.ts`
escriben en la base de datos (usuarios, cupones, instancias, canjes o
contadores). Están escritos pero **no se ejecutan** hasta que exista un
proyecto de staging configurado con `SUPABASE_SERVICE_ROLE_KEY` y los datos de
prueba del seed.
