# eocupon.cl

SaaS para comercios chilenos que generan cupones de descuento, los comparten por
link/QR y miden vistas y compartidos. El sitio público vive en
`https://www.ecocupon.cl`.

El deploy corre en Vercel: cada merge a `main` despliega automáticamente.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5.7
- Tailwind CSS 4 vía `@tailwindcss/postcss`; `tw-animate-css`
- shadcn/ui sobre Radix (`components.json`) — `components/ui/*` es código generado
- Supabase: auth SSR (`@supabase/ssr`), Postgres con RLS, Storage
- Vercel (Fluid Compute) + `@vercel/analytics`
- Gestor de paquetes: **pnpm** (`pnpm-lock.yaml`)

## Comandos

```bash
pnpm dev      # servidor de desarrollo
pnpm build    # build de producción
pnpm start     # servir build
pnpm lint     # eslint .
```

No hay suite de tests ni typecheck aparte; el único chequeo automático es `pnpm lint`
y el build.

## Estructura

- `app/` — rutas en español: `page.tsx` (landing), `precios`, `cuponera`,
  `cupon/[id]`, `condiciones`, `privacidad`
- `app/auth/` — login, registro, verificar, recuperar, nueva-contraseña, callback
  (intercambio de código OAuth/email), error
- `app/dashboard/` — área autenticada con `layout.tsx` propio: `crear`,
  `mis-cupones`, `page.tsx`
- `app/api/coupon-image/route.tsx` — genera la imagen del cupón con `next/og` +
  `qrcode`; `route.ts` de `upload-logo` sube el logo a Storage
- `components/` — `coupon-card`, `coupon-share-buttons`, `dashboard-nav`,
  `google-button`; `components/ui/` son primitivas shadcn
- `hooks/` — `use-mobile`, `use-toast`
- `lib/supabase/` — `client.ts` (browser), `server.ts` (server components/actions),
  `middleware.ts` (`updateSession`)
- `lib/site-url.ts` — `SITE_URL` canónica
- `proxy.ts` — entrada del middleware de sesión (delega en `updateSession`)
- `supabase/migrations/` — fuente de verdad del esquema. Ojo: el historial está
  desincronizado (ver el aviso de más abajo); no es fiable como registro.
- `archive/` — SQL histórico y obsoleto; **no ejecutar** (rompe la BD)
- `.mcp.json` — MCP de Supabase apuntando al project ref `vwjdfyljacoxwabtfoco`

## Datos

Esquema en `supabase/migrations/`: tabla `coupons` (con `is_public`, `shares_count`,
`views`) y `profiles`, más las funciones `handle_new_user`, `increment_shares`,
`increment_views`, `user_exists`. El logo del comercio vive en el bucket público
`logos`. La seguridad (RLS, policies, índices, RPCs) está en `0002_security.sql` y
siguientes.

Cambios de esquema: nueva migración numerada. Nunca editar migraciones ya aplicadas.

El historial de `supabase_migrations.schema_migrations` está al día: `0001`–`0015`
registradas con los mismos números que los archivos locales. Antes de cualquier
`supabase db push`, confirma con `db push --dry-run` que solo aparece la migración
nueva. El procedimiento de verificación y reversión está en
`docs/runbooks/migraciones-procedimiento.md`.

`0015` crea `profiles.trial_ends_at` (7 días de Pro desde el registro) y el trigger
`coupons_plan_limits`, que aplica los cupos por plan en la base: 3/mes gratis,
50/mes Pro, sin límite en Business. La prueba manda sobre `plan_type`, así que una
cuenta en prueba opera como Pro sin cambiar su plan guardado.

## Variables de entorno

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` y `SUPABASE_SERVICE_ROLE_KEY` (solo servidor:
la usan `app/api/upload-logo` y `app/api/reveniu/webhook`, que validan la sesión del
usuario y escriben `plan_type` respectivamente).

Del webhook de Reveniu y la herramienta privada: `REVENIU_WEBHOOK_TOKEN` (token que
viaja en la URL del webhook), `DEV_PLAN_EMAIL` y `DEV_PLAN_CODE` (`/dev/plan`, solo
para la cuenta dueña).

## Reglas del proyecto

- **URLs persistidas**: nunca `window.location.origin` para valores que se guardan
  (por ejemplo la URL del QR). Usar `SITE_URL` de `lib/site-url.ts`; si un cupón se
  crea desde localhost, quedaría `localhost:3000` grabado en la base.
- **CSP y headers** en `next.config.mjs`. `unsafe-eval` solo en desarrollo, e
  `img-src` debe incluir el host de Supabase o las imágenes del cupón se bloquean.
  Endurecer `script-src` con nonces es la mejora pendiente conocida.
- **Idioma**: UI, rutas, comentarios y textos legales en español de Chile. Los
  legales (`/privacidad`, `/condiciones`) siguen la Ley 19.628.
- **v0**: no reescribir historia de `main` ni forzar push; el deploy de Vercel
  lee esa rama.
- Formato: algunos archivos de componentes usan comillas dobles y sin punto y
  coma (shadcn/ui); los archivos de configuración y algunos de `lib/` usan comillas simples
  con punto y coma. Sigue el estilo del archivo que toques en vez de unificarlo.

## EGM

EGM artifact directory: docs/designs
