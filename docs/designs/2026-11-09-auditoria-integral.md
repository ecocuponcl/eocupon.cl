# Auditoría integral y plan de modernización — EcoCupon.cl

Fecha: 2026-11-09. Repositorio: `github.com/ecocuponcl/eocupon.cl`, rama `main`.
Complementa, sin repetir, `2026-11-09-auditoria-inicial.md`,
`2026-11-09-informe-entrega.md` y `2026-11-09-egm-analisis-estructural.md`.

## 1. Resumen ejecutivo

El producto funciona: registro, login con correo y con Google, recuperación,
panel, creación de cupones con logo, imagen con QR, cuponera pública y páginas
legales. Typecheck, lint y build pasan; 9 pruebas E2E pasan contra producción.

Lo que impide llamarlo terminado no es la interfaz sino cuatro cosas: **la base no
es reproducible** (historial de migraciones desincronizado), **una policy deja
enumerar los cupones privados**, **faltan tests propios y CI**, y **el móvil tiene
dos defectos reales** (scroll horizontal y formularios sin etiquetas asociadas).
El SEO técnico está prácticamente sin hacer.

## 2. Arquitectura encontrada

Next.js 16.4.5 (App Router, Turbopack) + React 19.3 + TypeScript 5.7 +
Tailwind 4 + shadcn/ui sobre Radix, Supabase (auth SSR, Postgres con RLS,
Storage), Vercel con Fluid Compute y Analytics. 18 rutas. Middleware en
`proxy.ts` → `lib/supabase/middleware.ts`. Sin capa de datos: ocho consultas a
`coupons` en cinco archivos, cada una con su lista de columnas y sin tipos
generados.

## 3. Documentación revisada

`README.md` (sigue siendo el de la plantilla v0), `CLAUDE.md`, `AGENTS.md`
(generado por Next), los cuatro informes previos, el análisis estructural EGM,
los siete informes de la review Goldfish y el runbook de migraciones.

Contradicciones encontradas y ya resueltas: el README se presenta como
`my-project` y no describe el producto; el informe inicial marcaba Google OAuth
como fallo permanente (resuelto); `CLAUDE.md` empujaba a `supabase db push` sin
avisar del drift (corregido).

## 4. Estado por área

### 4.1 Base de datos

| Hecho | Estado |
|---|---|
| Conexión y esquema | FUNCIONA — 2 tablas, 8 policies, 4 funciones `security definer`, 2 buckets |
| RLS de `coupons` | **FALLA** — policy SELECT `using (true)`: con la clave publicable se listan también los privados |
| RLS de `profiles` | Existe en la base, **no en las migraciones** |
| Historial de migraciones | **FALLA** — `0003`, `0004`, `0007`, `0008`, `0009` aplicadas sin registrar; `0005`/`0006` con versión timestamp |
| `user_exists(text)` | MEDIA — oráculo de enumeración de correos abierto a `anon` |
| Contadores | MEDIA — `increment_*` sin límite, métricas inflables |

### 4.2 Autenticación

Verificado end-to-end: login con correo (ruta de error), login con Google
(completado, `provider: google`, 302, 1 identidad), recuperación con correo
inexistente, protección del panel y registro con confirmación. Corregido aquí: los
enlaces de correo abiertos en otro navegador fallaban con `flow_state_expired`;
ahora existe `/auth/confirm` con `token_hash` (pendiente de que las plantillas la
usen).

No verificado: login exitoso con contraseña (requiere cuenta autorizada),
persistencia de sesión y cierre de sesión.

### 4.3 UX, accesibilidad y responsive

Medido en producción con Playwright a 375×667, 768×1024 y 1280×800.

| Id | Severidad | Hallazgo | Evidencia |
|---|---|---|---|
| U-01 | IMPORTANTE | **Scroll horizontal en móvil** en `/` (417 px), `/cuponera` (405) y `/precios` (389) sobre un viewport de 375 | `documentElement.scrollWidth`; desborda el bloque de acciones del `<header>` (`right=417`) |
| U-02 | IMPORTANTE | **Campos sin nombre accesible**: los inputs de login, registro y recuperación tienen etiqueta visual no asociada | `evaluate` → `labelled:false`; `FieldLabel` es `<Label>` sin `htmlFor` y los inputs no tienen `id` (`components/ui/field.tsx:110`, `app/auth/login/page.tsx:57-64`) |
| U-03 | MENOR | `/auth/login` sin ningún encabezado (`h1`/`h2`/`h3`); los títulos son `div` | `evaluate` → `titulos: []` |
| U-04 | MENOR | 19 objetivos táctiles con alto < 44 px en la portada móvil | `evaluate` sobre `button, a[href], input` |
| U-05 | MENOR | Campos de login sin `autocomplete` (contraseñas y gestores) | `evaluate` → `autocomplete: null` |

Funciona bien: `lang="es"`, un solo `h1` en `/`, `/precios` y `/cuponera`, todas
las imágenes con `alt`, ningún botón de icono sin nombre accesible, y sin desborde
en tablet ni escritorio.

### 4.4 SEO y rendimiento

Medido con `curl` contra producción.

| Id | Severidad | Hallazgo |
|---|---|---|
| S-01 | IMPORTANTE | Sin `/robots.txt` (404 `text/html`); no existe `app/robots.ts` |
| S-02 | IMPORTANTE | Sin `/sitemap.xml` (404); `/cupon/[id]` es el activo indexable y no hay descubrimiento |
| S-03 | IMPORTANTE | Títulos y descripciones **duplicados**: `/`, `/precios`, `/cuponera`, `/auth/login` heredan el `title` de 45 caracteres del layout |
| S-04 | IMPORTANTE | Sin `canonical` en ninguna página |
| S-05 | IMPORTANTE | Sin Open Graph ni Twitter Card: al compartir un cupón no hay tarjeta |
| S-06 | MENOR | Sin datos estructurados (`ld+json`) |
| S-07 | MENOR | `/cuponera` con `cache-control: private, no-store`; TTFB en frío 2.08 s frente a 0.48 s en caliente |
| S-08 | MENOR | `apex → www` con 307 temporal en vez de 308 permanente |

Base de rendimiento, que está bien: TTFB de `/` **0.211 s** (mediana de 5
muestras), HTML 63 KB → 9 KB comprimido, `x-vercel-cache: HIT`, assets con
`immutable` de un año. JS de la portada: 185 KB comprimidos en 8 chunks.

### 4.5 Frontend y calidad

Sin `any`, sin `@ts-ignore`, sin TODOs. Typecheck y lint en verde. 39 de 55
primitivas `components/ui` no se importan en ningún sitio y arrastran 10
dependencias de runtime. Sin tests unitarios ni CI; la suite E2E cubre los flujos
que no escriben datos.

## 5. Mejoras ya implementadas en esta sesión

Bucle de peticiones en Mis Cupones; consulta con `user_id = undefined`; seis
errores de Supabase ignorados; enlace roto y enlaces muertos del footer; fuentes
sin aplicar; `pnpm install/dev/lint` bloqueados; eslint inexistente; subida de
logos validada por bytes, con tope y sin SVG; HSTS; mensajes de auth en español;
lectura del cupón privado por UUID con service role; `/auth/confirm` para enlaces
de correo en cualquier dispositivo; CSP con nonce evaluada y revertida con
evidencia; suite Playwright de 21 pruebas; documentos EGM y runbook.

## 6. Plan de modernización

### P0 — crítico

| Tarea | Problema | Archivos | Riesgo | Verificación |
|---|---|---|---|---|
| Aplicar `0010` | cupones privados enumerables | `supabase/migrations/0010…`, runbook | Alto si falta la service key en Vercel | 4 `SELECT` del runbook + línea base HTTP |
| Reparar historial | `db push` re-ejecutaría DDL | `supabase/migrations/*` | Medio | `migration list --linked` y `db push --dry-run` |

### P1 — importante

| Tarea | Problema | Archivos | Verificación |
|---|---|---|---|
| `robots.txt` + `sitemap.xml` | S-01, S-02 | nuevos `app/robots.ts`, `app/sitemap.ts` | `curl` 200 + contenido |
| Metadatos por página | S-03, S-04, S-05 | `app/**/page.tsx` | `curl` y comparación de `title`/`canonical` |
| Corregir header móvil | U-01 | `app/page.tsx`, `app/cuponera/page.tsx`, `app/precios/page.tsx` | `scrollWidth == innerWidth` a 375 |
| Etiquetas y `autocomplete` | U-02, U-05 | `app/auth/*/page.tsx` | `evaluate` → `labelled:true` |
| Plantillas de correo en español con `/auth/confirm` | enlaces rotos cross-device | panel de Supabase (lo haces tú) | registro real en móvil |
| CI | sin verificación automática | `.github/workflows/ci.yml` | workflow en verde |

### P2 — UX, rendimiento, arquitectura

- Encabezados en `/auth/login` (U-03) y objetivos táctiles (U-04).
- `cache-control` de `/cuponera` (S-07) y `apex→www` permanente (S-08).
- Capa de datos tipada y tipos generados de Supabase.
- Limpiar primitivas y dependencias sin usar (39 componentes, 10 paquetes).
- JSON-LD para cupones (S-06).

### P3 — producto

- Cobro real de los planes: `/precios` ofrece Pro y Business sin pasarela.
- Expiración efectiva de cupones (`expires_at` existe y nada lo usa).
- Métricas por cupón y roles.
- IA de verdad o corrección del copy que la promete.

## 7. Riesgos

- Aplicar `0010` sin `SUPABASE_SERVICE_ROLE_KEY` en Vercel rompe los enlaces a
  cupones privados.
- Reparar el historial mal deja `db push` peor que ahora.
- `main` despliega automáticamente: cada push publica.
- Los majors pueden romper componentes shadcn (recharts, lucide).

## 8. Tabla de estado

| Tarea | Estado |
|---|---|
| Auditoría de código, BD, auth y seguridad | COMPLETADA |
| Review EGM con Goldfish (5 etapas) | COMPLETADA |
| Correcciones locales y endurecimiento | COMPLETADA |
| Suite E2E | COMPLETADA (12 flujos esperan cuenta) |
| Auditoría UX/accesibilidad/responsive | COMPLETADA |
| Auditoría SEO/rendimiento | COMPLETADA |
| Aplicar `0010` y reparar historial | **BLOQUEADA** — requiere autorización y la service key |
| Metadatos, robots, sitemap | PENDIENTE |
| Header móvil y etiquetas de formulario | PENDIENTE |
| CI | PENDIENTE |
| Cobro de planes, expiración, roles, IA | PENDIENTE (producto) |

## 9. No verificado

Login con contraseña exitoso, logout y persistencia de sesión (sin cuenta
autorizada); comportamiento en Safari y Firefox (solo Chromium); contraste medido
con herramienta dedicada; efecto real de aplicar `0010`; presencia de
`SUPABASE_SERVICE_ROLE_KEY` en Vercel.