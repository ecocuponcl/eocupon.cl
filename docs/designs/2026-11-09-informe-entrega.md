# Informe de entrega — 2026-11-09 (continuación)

Repositorio: `github.com/ecocuponcl/eocupon.cl`, rama `main`.
Referencia de estado previo: `docs/designs/2026-11-09-auditoria-inicial.md`.
Informe intermedio: `docs/designs/2026-11-09-informe-final.md`.

**No se ha hecho commit, ni push, ni deploy, ni se aplicó ninguna migración, ni se
modificó dato alguno en producción.**

---

## 1. Trabajo realizado

1. Revisión adversarial del diff completo por un agente independiente, con
   verificación de regresiones, secretos, compatibilidad Next/ESLint y código muerto.
2. Corrección de los defectos que esa revisión encontró (incluida una instrucción
   peligrosa en `CLAUDE.md` sobre `supabase db push`).
3. Endurecimiento de seguridad: subida de logos por firma de bytes, rechazo de SVG,
   límite de 5 MB, HSTS, CSP evaluada con nonce y descartada con evidencia.
4. Enlaces a cupones privados resueltos sin exponer la tabla: lectura por UUID con
   service role (`lib/supabase/admin.ts`), con aviso explícito cuando falta la clave.
5. Mensajes de error de autenticación traducidos al español en un solo sitio.
6. Suite Playwright de 21 pruebas con ejecución real.
7. Documentación EGM: documento de diseño y arquitectura, análisis estructural y
   review con cinco etapas y siete revisores Goldfish en contexto limpio.
8. Runbook de migraciones con procedimiento, verificación y reversión, corregido tras
   la review (los comandos apuntaban a la base local).

## 2. Archivos creados y modificados

**Modificados (21)**: `.gitignore`, `app/api/upload-logo/route.ts`,
`app/auth/{login,registro,recuperar,nueva-contraseña}/page.tsx`,
`app/cupon/[id]/page.tsx`, `app/cuponera/page.tsx`, `app/dashboard/{page.tsx,crear/page.tsx,mis-cupones/page.tsx}`,
`app/page.tsx`, `app/layout.tsx`, `app/globals.css`,
`components/{coupon-share-buttons,google-button}.tsx`, `lib/supabase/middleware.ts`,
`next.config.mjs`, `proxy.ts`, `package.json`, `pnpm-lock.yaml`.

**Creados**: `CLAUDE.md`, `AGENTS.md` (generado por `next dev` 16.4),
`eslint.config.mjs`, `pnpm-workspace.yaml`, `playwright.config.ts`, `e2e/` (16 specs,
helpers y README), `lib/auth-errors.ts`, `lib/supabase/admin.ts`,
`supabase/migrations/0010_harden_rls_and_timestamps.sql` (**sin aplicar**),
`docs/designs/` (5 informes + 6 de review), `docs/runbooks/migraciones-procedimiento.md`.
`.env.local` es local y está gitignorado: solo lleva URL y clave publicable.

## 3. Pruebas ejecutadas y resultados

| Comprobación | Comando | Resultado real |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 — 0 errores, 5 warnings (`<img>` en OG image) |
| Build | `pnpm build` | exit 0 — 18/18 rutas |
| Instalación | `pnpm install` | exit 0, `sharp` compilado, lockfile intacto |
| Suite E2E | `pnpm test:e2e` | **9 pasan, 12 saltan, 0 fallan** (1.1 min) |
| Build de producción servido | `next start -p 3100` | CSP y HSTS correctas; JS ejecuta en páginas estáticas; 0 violaciones de CSP |
| Login inválido (prod) | Playwright | mensaje en español + `400` real de Supabase |
| Login Google | Playwright | **falla**: `redirect_uri_mismatch` |
| Supabase | MCP + SQL de solo lectura | esquema, policies, conteos y advisors |

Las 12 pruebas saltadas requieren cuenta autorizada o escribir datos; están en
`test.fixme` con el motivo, y se ejecutan soltando las variables `E2E_*`.
No hay tests unitarios ni CI: no existían y no se inventaron.

## 4. Problemas corregidos

1. `pnpm install`, `pnpm dev` y `pnpm lint` bloqueados por pnpm 11 y `sharp`.
2. `eslint` no declarado ni configurado: el script `lint` nunca pudo funcionar.
3. Bucle de peticiones en Mis Cupones (cliente Supabase recreado por render).
4. Consulta del dashboard con `user_id = undefined` → error de UUID en Postgres.
5. Seis errores de Supabase ignorados en silencio.
6. Enlace roto a `/pagos` y tres enlaces muertos del footer.
7. Fuentes Geist cargadas sin aplicarse.
8. `SITE_URL` duplicado y apuntando a producción en el botón de Google.
9. Subida de logos sin límite, aceptando SVG y confiando en el `contentType` del cliente.
10. Guard muerto del middleware (`/protected`) y errores de auth en inglés.
11. Una instrucción peligrosa en `CLAUDE.md` (`db push` sin avisar del historial).
12. **Regresión propia detectada y revertida**: CSP con nonce que habría dejado sin
    JavaScript las páginas estáticas en producción.

## 5. Problemas todavía pendientes

- Policy de `coupons` con `using (true)` — **sigue vigente**; migración escrita sin aplicar.
- Historial de migraciones desincronizado (`0003`, `0004`, `0007`, `0008`, `0009`, y
  `0005`/`0006` con versión timestamp).
- `profiles` con RLS solo en la base, no reproducible desde el repo.
- `user_exists(text)`: enumeración de correos abierta a `anon`.
- `increment_views` / `increment_shares` sin límite: métricas inflables.
- Login con Google roto por configuración externa (Google Cloud).
- 42 dependencias atrasadas: 32 radix (trivial) y 8 majors que exigen migración.
- 39 de 55 primitivas `components/ui` sin usar, con 10 dependencias asociadas.
- `/auth/verificar` huérfana; copy "con IA" sin IA; CSP con `'unsafe-inline'`
  en scripts. (WhatsApp ya resuelto: `56979540471`.)

## 6. Resultados reales de EGM y Goldfish

- Plugin `egm@egm` 0.1.1 verificado y marketplace actualizado (`b7d9e27`).
- Documentos: `2026-11-09-egm-diseno-arquitectura.md` y
  `2026-11-09-egm-analisis-estructural.md`.
- Review con **5 etapas y 7 revisores en contexto limpio** (sin la conversación):
  Stage 5 (9 hallazgos), Stage 6 (9), Stage 7 con tres críticos (13 + 20 + 14),
  Stage 8 (seguimiento de 63 + 5 nuevos), Stage 9 (veredicto **NO LISTO**).
- Seguimiento: **15 resueltos, 9 parciales, 39 abiertos** de 63.
- Los informes están en `docs/designs/egm-review/`, incluida la consolidada.
- La review encontró defectos reales en mi trabajo: afirma la CSP con nonce, el
  rendimiento de `/api/coupon-image`, y los comandos de migración sin `--linked`.
  Todos corregidos. Ninguna revisión fue simulada.

## 7. Estado de seguridad

| Control | Estado |
|---|---|
| RLS en `coupons` | **FALLA** — policy SELECT `using (true)`, tabla enumerable |
| RLS en `profiles` | FUNCIONA en la base, no versionado |
| Subida de logos | FUNCIONA — firma de bytes, 5 MB, SVG rechazado |
| Enlace a cupón privado | PARCIAL — depende de `SUPABASE_SERVICE_ROLE_KEY` en Vercel (no verificable) |
| Claves en el repo | FUNCIONA — ninguna versionada, `.env.local` ignorado |
| HSTS | FUNCIONA (`max-age=63072000`) |
| CSP | PARCIAL — `script-src` con `'unsafe-inline'`; nonce descartado con evidencia |
| Errores de auth en español | FUNCIONA |
| Contadores y `user_exists` | FALLA (pendiente, requiere cambio de código) |

## 8. Estado de Supabase

Sin cambios. Verificado por MCP y SQL: 2 tablas (`coupons`, `profiles`), 8 policies,
4 funciones `security definer`, 2 buckets (`logos` público, `ecocupon` privado),
4 usuarios (todos con email confirmado), 4 cupones (1 público), 0 identidades Google.

## 9. Riesgos que requieren autorización

1. Aplicar `0010`: cierra la fuga, pero exige `SUPABASE_SERVICE_ROLE_KEY` en Vercel
   para que los enlaces privados sigan funcionando.
2. Reparar el historial de migraciones y/o renombrar `0005`/`0006`.
3. Cualquier acción sobre Google Cloud y el secreto expuesto en el chat.
4. Actualizar los majors de dependencias.

## 10. Próximas acciones recomendadas

1. Rotar el secreto de Google que se pegó en el chat y completar el cliente OAuth.
2. Ejecutar el runbook de migraciones en una ventana, con copia de seguridad y línea
   base de `/cuponera` y del cupón privado.
3. Decidir `user_exists` y el límite de contadores; es cambio de código + SQL.
4. Añadir CI con `tsc`, `lint`, `build` y la suite E2E ya escritos.
5. Actualizar majors de una en una, con la suite como red.