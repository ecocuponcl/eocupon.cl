# Auditoría inicial del proyecto — 2026-11-09

Estado: **previo a cualquier modificación de código o de base de datos**.
Método: lectura del repositorio, comprobaciones de build/lint/typecheck, inspección
de Supabase por MCP y pruebas reales de autenticación en navegador.

---

## 1. Identificación

| Dato | Valor |
|---|---|
| Ruta | `/Users/mac/dev/2026/noviembre/eocupon.cl` |
| Remoto | `github.com/ecocuponcl/eocupon.cl` |
| Rama | `main`, limpia, al día con `origin/main` |
| Commits | 18 · último `b478b00` (2026-07-15, Smarterbot CL) |
| Package | `my-project` v0.1.0 (nombre de plantilla, sin renombrar) |
| Origen | plantilla de v0 enlazada a un proyecto v0 (README) |

**Inconsistencias de nombre**: el repositorio se llama `eocupon.cl` y la marca en
pantalla es **EcoCupon** con dominio `ecocupon.cl`. La identidad se establece por el
código (`app/page.tsx:21`, `app/layout.tsx:8-10`, `lib/site-url.ts:12`,
`README.md:33`), no por el nombre de la carpeta.

## 2. Propósito real

Herramienta para que un comercio cree cupones de descuento, los comparta por
link/QR y vea métricas de vistas y compartidos, con una cuponera pública y un
área privada de gestión.

Evidencia en código, no supuestos:

- Landing con secciones "cómo funciona / beneficios / precios" (`app/page.tsx`).
- Cuponera pública con cupones `is_public = true` (`app/cuponera/page.tsx:13-19`).
- Cupón individual por UUID con incremento de vistas (`app/cupon/[id]/page.tsx`).
- Dashboard autenticado: crear cupón, mis cupones (`app/dashboard/*`).
- Planes Gratis / Pro / Business con precios en CLP (`app/precios/page.tsx`).
- Legales alineados a Ley 19.628 (`app/privacidad`, `app/condiciones`).

**Contradicción de producto**: la landing, los precios, el metadata y el dashboard
prometen "generación con IA", pero no hay ninguna integración de IA en el código
(sin SDK ni llamadas a APIs de modelos). La imagen del cupón se compone de forma
determinista con `next/og` + `qrcode` (`app/api/coupon-image/route.tsx`). Es una
promesa de marketing que el código no cumple.

## 3. Arquitectura y tecnologías

- Next.js **16.2.0** (App Router, Turbopack), React **19.2.4**, TypeScript **5.7.3**
- Tailwind CSS **4.2** (`@tailwindcss/postcss`), shadcn/ui *new-york* sobre Radix
- Supabase: auth SSR (`@supabase/ssr` 0.10.2), Postgres con RLS, Storage
- Vercel Analytics 1.6.1, `next/og`, `qrcode`
- pnpm 11.19.0 / Node v26.8.2
- 18 rutas; middleware de sesión en `proxy.ts` → `lib/supabase/middleware.ts`

## 4. Estado del código

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | **FUNCIONA** — exit 0, sin errores (verificado dos veces) |
| `npx next build` | **FUNCIONA** — exit 0, 18 rutas, ~15 s |
| `pnpm lint` | **FALLA** — dos causas: (a) el check de pnpm 11 aborta por `sharp`; (b) `eslint` no está instalado ni declarado y no hay `eslint.config.*` |
| `pnpm install --frozen-lockfile` | **PARCIAL** — exit 1 por `ERR_PNPM_IGNORED_BUILDS: sharp@0.34.5`; el lockfile queda intacto |
| `pnpm dev` | **FALLA** — el mismo check de pnpm bloquea el script; `npx next dev` arranca bien |
| Tests automatizados | **NO EXISTEN** (ningún archivo de test, sin `.github/`, sin CI) |
| Secretos en repo/historial | **FUNCIONA** — sin claves versionadas; `.env*` nunca entró al historial |
| Calidad | sin `any`, sin `@ts-ignore`, sin TODO/FIXME; 1 `console.error` |

Nota metodológica: arrancar `next dev` sobre un `.next` generado por `next build`
produjo 404 falsos en `/auth/*` y `/dashboard/*`. Con `.next` limpio todas las
rutas responden. **No es un defecto del proyecto**; es artefacto de build mezclado.

### Dependencias desactualizadas (50)

| Paquete | Actual → última | Tipo |
|---|---|---|
| next | 16.2.0 → 16.4.5 | minor |
| react / react-dom | 19.2.4 → 19.3.1 | minor |
| tailwindcss / @tailwindcss/postcss | 4.2.0 → 4.3.5 | minor |
| @supabase/supabase-js | 2.103.0 → 2.119.0 | minor |
| @supabase/ssr | 0.10.2 → 0.12.7 | minor |
| postcss | 8.5.6 → 8.5.32 | patch |
| typescript | 5.7.3 → 7.0.2 | **major** |
| @vercel/analytics | 1.6.1 → 2.0.1 | **major** |
| lucide-react | 0.564 → 1.70 | **major** |
| recharts | 2.15 → 3.10 | **major** |
| sonner | 1.7.4 → 2.0.8 | **major** |
| react-day-picker | 9.13 → 10.0 | **major** |
| react-resizable-panels | 2.1.9 → 4.20 | **major** |
| @types/node | 22.19 → 26.6 | **major** |

Casi todo está *pinneado exacto*, así que cualquier actualización exige editar
`package.json` a mano (no basta `pnpm update`).

## 5. Base de datos (Supabase, ref `vwjdfy…tfoco`)

Conexión **FUNCIONA** (MCP y clave publicable). Esquema real: 2 tablas
(`coupons` 16 columnas, `profiles` 8), 6 índices, 4 funciones `security definer`,
2 buckets (`logos` público, `ecocupon` privado). Datos: 4 usuarios, 4 cupones
(1 público), 4 perfiles.

### Hallazgos

| # | Hallazgo | Severidad | Evidencia |
|---|---|---|---|
| 1 | Policy `coupons_select_own_or_public` con `qual = true`: cualquiera con la clave publicable lista **todos** los cupones, incluidos los privados | **ALTA** | `pg_policies` + lectura real como `anon`: 4/4 filas |
| 2 | `profiles` tiene RLS y 4 policies **en la base**, pero **ninguna migración las crea** | **ALTA** (reproducibilidad) | `pg_policies` vs `supabase/migrations/*.sql` |
| 3 | Drift de migraciones: registradas solo `0001`, `0002`, `0005`, `0006`; las `0003`, `0004`, `0007`, `0008`, `0009` están aplicadas sin registrar | ALTA | `supabase_migrations.schema_migrations` |
| 4 | `user_exists(text)` ejecutable por `anon` → oráculo de enumeración de correos | MEDIA | `0004_user_exists.sql` + prueba en navegador |
| 5 | `increment_views` / `increment_shares` abiertas a `anon` sin límite → métricas inflables | MEDIA | grants en `0002_security.sql:221-222` |
| 6 | `updated_at` nunca cambia (sin trigger) | BAJA | 0/4 filas con `updated_at > created_at` |
| 7 | Grants a `anon`/`authenticated` incluyen `TRUNCATE` sobre tablas | MEDIA | advisors de Supabase |
| 8 | Bucket privado `ecocupon` con 2 objetos sin policies ni referencias en el código | BAJA | `storage.objects` |

Consecuencia de #3: `supabase db push` vería cinco migraciones pendientes y
reintentaría DDL sobre objetos que ya existen. La base **no es reproducible**
desde el repo tal como está.

## 6. Autenticación y login

| Flujo | Estado | Evidencia |
|---|---|---|
| Pantalla de login | FUNCIONA | `/auth/login` 200, formulario completo |
| Validación de credenciales inválidas | FUNCIONA | "Invalid login credentials"; `400` de `POST /auth/v1/token?grant_type=password` |
| Comunicación con el proveedor | FUNCIONA | la petición llega a Supabase y devuelve el error esperado |
| Protección de rutas privadas | FUNCIONA | `/dashboard` y `/dashboard/crear` → `307` a `/auth/login` (lo hace `dashboard/layout.tsx:13`, no el middleware) |
| Recuperación de contraseña (correo inexistente) | FUNCIONA | muestra "Este correo no está registrado" vía RPC `user_exists` |
| Envío real de correo de recuperación | NO VERIFICADO | requiere cuenta autorizada |
| Registro de usuario | PARCIAL | el formulario existe; no se creó ningún usuario |
| Login con Google | **FALLA** | Google responde `redirect_uri_mismatch` con `redirect_uri=…supabase.co/auth/v1/callback` |
| Inicio de sesión exitoso / persistencia | NO VERIFICADO | sin cuenta de prueba autorizada |
| Cierre de sesión | NO VERIFICADO | requiere sesión |

Notas: 4 usuarios en BD, todos con correo confirmado y con login previo; **0
identidades de Google**, lo que corrobora que el OAuth nunca completó. El guard
del middleware protege `/protected`, ruta que no existe: es código muerto; la
protección real es el redirect del layout.

## 7. Otros defectos confirmados por lectura de código

- `app/dashboard/mis-cupones/page.tsx:28,48` — `createClient()` dentro del cuerpo
  del componente y como dependencia del `useEffect`: cada render crea un cliente
  nuevo y `setCoupons` re-dispara el efecto → peticiones en bucle.
- Errores de Supabase ignorados: `app/dashboard/page.tsx:11-17`,
  `app/cuponera/page.tsx:13`, `app/dashboard/crear/page.tsx:130`,
  `app/cupon/[id]/page.tsx:34`, `components/coupon-share-buttons.tsx:26`,
  `app/auth/nueva-contraseña/page.tsx:25`.
- `app/page.tsx:299` enlaza a `https://www.ecocupon.cl/pagos`, ruta inexistente.
- `app/precios/page.tsx:54` — WhatsApp de ejemplo `56912345678`.
- `components/google-button.tsx:7` duplica `SITE_URL` y fija el dominio de
  producción, por lo que el OAuth desde local apunta al callback de producción.
- `app/auth/registro/page.tsx:35` y `app/auth/recuperar/page.tsx:51` usan
  `window.location.origin`, contra la regla documentada en `lib/site-url.ts`.
- `app/layout.tsx:6-7` carga Geist/Geist_Mono en variables que nunca se aplican.
- `app/auth/verificar/page.tsx` es una página estática que ningún flujo enlaza.
- Los mensajes de error de Supabase se muestran en inglés.

## 8. Plan propuesto y riesgos

Prioridad 1 — seguridad de datos (base de datos, requiere autorización):
1. Acotar la policy de SELECT de `coupons` (dueño o `is_public = true`).
2. Reproducir en migración el RLS de `profiles` que hoy existe solo en la base.
3. Resolver el drift: registrar las migraciones ya aplicadas sin re-ejecutarlas.
4. Revocar `EXECUTE` innecesario y los grants de `TRUNCATE`; evaluar `user_exists`.

Prioridad 2 — autenticación:
5. Registrar el callback de Supabase en Google Cloud para desbloquear el OAuth.
6. Corregir el `SITE_URL` del botón de Google y usar `lib/site-url.ts` en todas partes.

Prioridad 3 — herramientas y calidad:
7. Declarar `eslint` + configuración, y resolver el bloqueo de `sharp` en pnpm 11.
8. Corregir el bucle de `mis-cupones` y los errores ignorados.
9. Enlace `/pagos`, placeholders y copy "con IA".

Prioridad 4 — dependencias: primero minors/patch; los majors (TypeScript 7,
recharts 3, lucide 1.x, sonner 2, day-picker 10, resizable-panels 4,
analytics 2, @types/node 26) exigen migración y pruebas manuales.

Riesgos: tocar policies puede dejar la app sin lectura pública de cupones si se
acota mal; re-ejecutar migraciones sobre objetos existentes rompe el esquema;
`main` despliega automáticamente (v0/Vercel), así que **nada se publica sin
autorización**.

## 9. No verificado

- Login exitoso, persistencia de sesión, cierre de sesión y envío real de correos
  (hace falta una cuenta de prueba autorizada).
- Configuración de Auth en el panel (confirmación de correo, proveedores).
- Si el bloqueo de `sharp` afecta a `next/image` en runtime.
- Uso o consumidores del bucket privado `ecocupon`.

## 10. Artefactos creados en esta sesión

| Archivo | Estado |
|---|---|
| `CLAUDE.md` | nuevo, sin trackear (contexto del repo) |
| `docs/designs/2026-11-09-auditoria-inicial.md` | este informe |
| `.env.local` | gitignorado; solo URL + clave publicable, para pruebas locales |
| `node_modules/`, `.next/` | gitignorados, generados por las comprobaciones |