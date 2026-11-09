# Informe final de auditoría y actualización — 2026-11-09

Complementa `2026-11-09-auditoria-inicial.md` (estado previo a cualquier cambio).
**Nada se ha publicado**: no hay commits, no hay push, no se aplicó ninguna
migración. `main` despliega automáticamente vía v0/Vercel.

---

## 1. Identidad y propósito

`github.com/ecocuponcl/eocupon.cl` (rama `main`). Producto de marca **EcoCupon**
(`ecocupon.cl`): SaaS donde un comercio crea cupones de descuento, los comparte
por link/QR y ve vistas y compartidos, con cuponera pública y dashboard privado.
Identidad derivada del código, no asumida. No se reutilizó información de otros
proyectos ni del análisis anterior.

## 2. Estado inicial → estado final

| Área | Antes | Ahora | Evidencia |
|---|---|---|---|
| Typecheck | FUNCIONA | FUNCIONA | `tsc --noEmit` exit 0 |
| Build producción | FUNCIONA | FUNCIONA | 18 rutas, exit 0 |
| Lint | **FALLA** | **FUNCIONA** | `pnpm lint` exit 0 (0 errores, 5 warnings) |
| `pnpm install` / `pnpm dev` | **FALLA** | **FUNCIONA** | `ERR_PNPM_IGNORED_BUILDS` resuelto |
| Tests / CI | NO EXISTEN | NO EXISTEN | sigue sin haber suite |
| Rutas y render | FUNCIONA | FUNCIONA | 8 rutas probadas, `/dashboard` redirige |
| Login email/contraseña | FUNCIONA | FUNCIONA | error real de Supabase, 400 verificado |
| Google OAuth | **FALLA** | **FALLA** | `redirect_uri_mismatch` (requiere Google Cloud) |
| RLS `coupons` | FALLA (ALTA) | FALLA (ALTA) | policy `using (true)`; migración lista, sin aplicar |
| `profiles` RLS | no reproducible | no reproducible | migración lista, sin aplicar |
| Drift migraciones | FALLA | FALLA | 0003/0004/0007/0008/0009 sin registrar |
| Dependencias | 50 atrasadas | 42 atrasadas | minors hechos; majors pendientes |

## 3. Cambios realizados en el código

| Archivo | Cambio |
|---|---|
| `app/dashboard/mis-cupones/page.tsx` | Bucle de peticiones corregido: el cliente Supabase se crea dentro del `useEffect` y los handlers lo crean al usarlo; `error` mostrado en pantalla |
| `app/dashboard/page.tsx` | `redirect()` cuando no hay usuario (antes consultaba con `user_id = undefined` → error UUID en Postgres); banner de error |
| `app/cuponera/page.tsx` | `error` capturado, registrado y mostrado |
| `app/dashboard/crear/page.tsx` | El update de `generated_image_url` ya no falla en silencio |
| `app/cupon/[id]/page.tsx` | `increment_views` con manejo de error (no bloquea la vista) |
| `components/coupon-share-buttons.tsx` | `increment_shares` con manejo de error |
| `app/auth/nueva-contraseña/page.tsx` | `getUser()` con manejo de error y `catch` |
| `components/google-button.tsx` | Usa `SITE_URL` de `lib/site-url.ts` (antes duplicado) |
| `app/page.tsx` | Footer: `/pagos` roto → `/precios`; `#` → `/condiciones` y `/privacidad` |
| `app/layout.tsx` + `app/globals.css` | Geist/Geist_Mono conectadas de verdad (variables CSS); antes se cargaban sin aplicarse |
| `package.json` | Dependencias actualizadas; `eslint` + `eslint-config-next` declarados |
| `pnpm-workspace.yaml` | **nuevo** — `allowBuilds: sharp: true` (desbloquea install/dev/lint y fija la raíz del workspace) |
| `eslint.config.mjs` | **nuevo** — flat config de Next, con excepción acotada a `components/ui/**` y `hooks/use-*.ts` (código generado por shadcn que no cumple dos reglas del React Compiler) |
| `supabase/migrations/0010_harden_rls_and_timestamps.sql` | **nuevo, NO aplicado** — ver §6 |

## 4. Dependencias

Actualizadas (verificado con typecheck, lint y build):

| Paquete | Antes | Ahora |
|---|---|---|
| next | 16.2.0 | **16.4.5** |
| react / react-dom | 19.2.4 | **19.3.1** |
| @supabase/supabase-js | 2.103.0 | **2.119.0** |
| @supabase/ssr | 0.10.2 | **0.12.7** |
| tailwindcss / @tailwindcss/postcss | 4.2.0 | **4.3.5** |
| postcss | 8.5.6 | **8.5.32** |
| eslint | — | **9.39.5** (nuevo) |
| eslint-config-next | — | **16.2.0** (nuevo) |

**Pendientes deliberadamente** (42): los 32 `@radix-ui/*` (pinneados exactos,
bump trivial pero ruidoso) y los majors que exigen migración de código:
TypeScript 7, recharts 3, lucide-react 1.x, sonner 2, react-day-picker 10,
react-resizable-panels 4, @vercel/analytics 2, @types/node 26.

## 5. Problemas corregidos

1. `pnpm install`, `pnpm dev` y `pnpm lint` bloqueados por pnpm 11 (`sharp`).
2. `pnpm lint` inoperante: eslint no estaba declarado ni configurado.
3. Bucle de peticiones en Mis Cupones.
4. Consulta con `user_id = undefined` en el dashboard (error UUID en Postgres).
5. Seis errores de Supabase ignorados en silencio.
6. Enlace roto a `/pagos` y tres enlaces muertos a `#` en el footer.
7. Fuentes Geist cargadas sin aplicarse.
8. `SITE_URL` duplicado en el botón de Google.

## 6. Estado real de la base de datos

Sin cambios: **no se aplicó nada**. Verificado por MCP y por SQL directo:
2 tablas (`coupons`, `profiles`), 4 funciones `security definer`, 2 buckets,
6 objetos en Storage, 4 usuarios (todos con email confirmado), 4 cupones
(1 público).

La migración `0010` queda escrita y sin ejecutar. Contiene:

1. Acotar la policy SELECT de `coupons` a `is_public = true OR auth.uid() = user_id`
   — cierra la fuga de cupones privados. **Consecuencia funcional**: el enlace
   directo a un cupón privado dejará de funcionar para visitantes anónimos (hoy
   funciona, por diseño del comentario en `app/cupon/[id]/page.tsx:21-23`). Si
   quieres conservarlo, la alternativa es servir el cupón desde una ruta de
   servidor con la service role validando el UUID.
2. Versionar el RLS y las 4 policies de `profiles` que hoy existen solo en la base.
3. Revocar `TRUNCATE` a `anon`/`authenticated` y `EXECUTE` sobre `handle_new_user`.
4. Trigger de `updated_at` (hoy nunca cambia).

Queda fuera, documentado en el propio archivo: `user_exists` como oráculo de
enumeración de correos y los contadores `increment_*` sin límite.

**Pendiente crítico de reproducibilidad**: `supabase db push` sigue viendo cinco
migraciones como no registradas (`0003`, `0004`, `0007`, `0008`, `0009`) aunque
sus efectos ya están aplicados. Antes de cualquier `db push` hay que registrarlas
(`supabase migration repair --status applied …`) o el comando reintentará DDL
sobre objetos existentes.

## 7. Estado real del login y la autenticación

| Flujo | Estado | Prueba |
|---|---|---|
| Login email/contraseña (credenciales inválidas) | FUNCIONA | UI muestra el error; `POST /auth/v1/token` devuelve 400 real |
| Protección de rutas privadas | FUNCIONA | `/dashboard`, `/dashboard/crear` → 307 a `/auth/login` |
| Recuperación con correo inexistente | FUNCIONA | "Este correo no está registrado" vía RPC |
| Registro / verificación | PARCIAL | formularios renderizan; no se creó ningún usuario |
| Login con Google | **FALLA** | Google responde `redirect_uri_mismatch` |
| Login exitoso, sesión, logout | NO VERIFICADO | falta cuenta de prueba autorizada |

### Qué falta en Google Cloud (acción tuya)

En el cliente OAuth 2.0 existente (`386966449541-…`):

- **Authorized JavaScript origins**: `https://www.ecocupon.cl`, `https://ecocupon.cl`, `http://localhost:3000`
- **Authorized redirect URIs**: `https://vwjdfyljacoxwabtfoco.supabase.co/auth/v1/callback`

En Supabase (*Authentication → URL Configuration*): Site URL
`https://www.ecocupon.cl` y Redirect URLs `https://www.ecocupon.cl/auth/callback`
y `http://localhost:3000/auth/callback`. En *Providers → Google*, el mismo Client
ID y Secret.

## 8. Resultados de las pruebas ejecutadas

| Comprobación | Comando | Resultado |
|---|---|---|
| Instalación | `pnpm install` | exit 0, sharp compilado, lockfile intacto |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 — 0 errores, 5 warnings (`<img>` en OG image) |
| Build | `pnpm build` | exit 0 — 18/18 rutas |
| Rutas en dev | 8 rutas con `curl` | 200 en públicas y auth; 307 en privadas |
| Login inválido | Playwright | mensaje de error + 400 de Supabase |
| Google OAuth | Playwright | `redirect_uri_mismatch` |
| Recuperación | Playwright | pantalla "no registrado" |
| Base de datos | MCP + SQL | esquema, policies, conteos y advisors |

No hay tests unitarios ni de integración que ejecutar: no existen.

## 9. Errores pendientes

- Google OAuth (bloqueado por configuración externa).
- Fuga de cupones privados y drift de migraciones (migración escrita, sin aplicar).
- Enumeración de correos vía `user_exists`; contadores inflables.
- CSP con `script-src 'unsafe-inline'` y sin HSTS.
- `app/api/upload-logo` sin límite de tamaño y aceptando SVG.
- Guard muerto del middleware (`/protected`, ruta inexistente).
- Copy "con IA" sin IA en landing, precios y metadata.
- WhatsApp de ejemplo → resuelto, ahora `56979540471` en `app/precios/page.tsx:54`.
- Mensajes de error de Supabase en inglés.
- `app/auth/verificar/page.tsx` sin flujo que lo enlace.
- Bucket privado `ecocupon` con 2 objetos sin uso conocido.

## 10. Riesgos y limitaciones

- **No hay red de seguridad**: sin tests, cada cambio se valida solo con
  typecheck, lint y prueba manual.
- Aplicar `0010` cambia el acceso anónimo en producción: hacerlo fuera de horario
  y verificando la cuponera inmediatamente después.
- `main` despliega solo: cualquier merge publica.
- Los majors de dependencias pueden romper componentes shadcn (recharts, lucide).

## 11. Archivos creados o modificados

Modificados (13): los 11 de código de §3 más `package.json` y `pnpm-lock.yaml`.
Creados: `CLAUDE.md`, `AGENTS.md` (generado por `next dev` 16.4, no por mí),
`eslint.config.mjs`, `pnpm-workspace.yaml`,
`supabase/migrations/0010_harden_rls_and_timestamps.sql`,
`docs/designs/2026-11-09-auditoria-inicial.md`, este informe y `.env.local`
(gitignorado: solo URL y clave publicable).

## 12. Commits

Ninguno. No he creado commits ni he hecho push, para que revises el diff antes.

## 13. Recomendaciones

1. Revisar el diff y decidir sobre `0010` (y sobre el enlace a cupones privados).
2. Resolver el drift de migraciones antes de cualquier `db push`.
3. Registrar el callback en Google Cloud y limpiar el `redirect_uri`.
4. Añadir una suite mínima (Playwright para los flujos de auth) antes de seguir tocando código.
5. Decidir si el producto tendrá IA de verdad o si se corrige el copy.

## 14. Roadmap de las siguientes etapas

1. Aplicar `0010` (con autorización) y verificar cuponera + dashboard.
2. Registrar migraciones aplicadas y dejar `db push` en estado consistente.
3. Arreglar Google OAuth y probar el login completo con una cuenta de prueba autorizada.
4. EGM: documento de diseño y arquitectura, review con Goldfish independientes y
   `egm-bootstrap` sobre el árbol (Fase 8, pendiente).
5. Tests E2E de autenticación y de creación de cupones.
6. Endurecer CSP (nonces), HSTS, límites en la subida de logos.
7. Cerrar `user_exists` y limitar los contadores.
8. Actualizar los majors con migración guiada y prueba manual por componente.

## Fase de EGM

- Fase 1 (preparación): hecho — plugin `egm@egm` 0.1.1 verificado, marketplace
  actualizado a `b7d9e27`, documentación de integración leída.
- Fases 2, 3, 5, 6, 7: hechas, con las evidencias de este informe.
- Fase 4: hecha en su parte local; falta aplicar la migración y los majors.
- **Fase 8 pendiente**: documento de diseño con EGM y review independiente con
  Goldfish. No se ha simulado ninguna revisión ni se ha inventado ningún resultado.
