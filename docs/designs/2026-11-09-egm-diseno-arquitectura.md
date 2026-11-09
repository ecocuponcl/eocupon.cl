# EcoCupon.cl — Diseño y arquitectura

*   **Author:** 4Time Repuestos (`git config user.name` del repositorio)
*   **Status:** Draft
*   **Date:** 2026-11-09

--------------------------------------------------------------------------------

## Overview

EcoCupon.cl es un servicio web donde un comercio crea cupones de descuento, los
comparte por enlace o QR y ve cuántas veces se ven y se comparten. Tiene tres
superficies: una landing comercial, una cuponera pública con los cupones marcados
como públicos, y un panel privado para que el comercio gestione sus cupones.

Este documento describe el sistema **tal como está construido hoy** y cómo debe
quedar. No es el diseño de una función nueva: es el mapa de un sistema que ya está
en producción y que hasta ahora no tenía documentación de arquitectura. Sirve a
dos lectores: a una persona que llega nueva al repositorio y a un agente de IA que
va a modificarlo.

Estado de partida documentado, no supuesto:

*   `docs/designs/2026-11-09-auditoria-inicial.md` — qué se encontró antes de tocar nada.
*   `docs/designs/2026-11-09-informe-final.md` — qué se cambió después.
*   Este documento añade lo que ninguno de los dos tenía: contratos e invariantes
    por componente, alternativas descartadas y criterios de aceptación.

Límite de fiabilidad: entre el 09-11-2026 y la escritura de este documento hubo
cambios en vuelo en el repositorio (subida de logos endurecida, lectura del cupón
privado por UUID con service role, suite E2E, HSTS). Lo que aquí se afirma sale de
leer los archivos; lo que no pude comprobar está marcado como **no verificado**.

**Corrección posterior a la review** (2026-11-09): una versión previa de este
documento afirmaba que la CSP se generaba por respuesta con nonce en `proxy.ts`.
Era cierto mientras se escribía y **dejó de serlo**: el nonce se implementó, se
probó contra un build de producción y se descartó con evidencia. Las secciones
afectadas (sesión y cabeceras, requisitos no funcionales, plan) están corregidas.
La review con Goldfish marcó ese desfase como bloqueante en tres informes
independientes (`docs/designs/egm-review/`).

## The Problem

El producto funciona: compila, despliega, permite crear cupones, compartirlos y
verlos. El problema no es funcional, es de soporte y de riesgo:

1.  **No hay contrato escrito.** Nada indica qué invariantes debe respetar un
    cambio. Ejemplo concreto: la lectura de cupones privados dependía de una
    policy de RLS abierta; quien la "arreglara" sin conocer el producto rompía el
    enlace privado, y quien la dejara como estaba mantenía la tabla enumerable.
2.  **La base de datos no es reproducible desde el repositorio.** Cinco
    migraciones están aplicadas y sin registrar, y el RLS de `profiles` existe
    solo en producción.
3.  **No hay red de pruebas.** El único control automático era el build; el lint
    no funcionaba.

La solución propuesta no es reescribir: es fijar los contratos, cerrar las fugas
con un procedimiento autorizado y dejar criterios que se puedan comprobar.

## Goals

*   Dejar por escrito el mapa de rutas, la capa de datos, la autenticación y los
    contratos de las dos rutas de API, con sus invariantes y efectos secundarios.
*   Nombrar, para cada problema abierto, el mecanismo exacto de arreglo, lo que
    cuesta y lo que puede romper.
*   Definir un camino para que el enlace a un cupón privado siga funcionando sin
    que la tabla de cupones sea enumerable por cualquiera.
*   Dejar criterios de aceptación que se puedan comprobar con un comando o una
    observación, no con una opinión.

## Non-Goals

*   No se rediseña el producto ni se amplía su alcance comercial.
*   No se introduce generación con IA. Hoy no existe en el código y el copy que la
    promete es un problema de mensaje, no de arquitectura.
*   No se cambia de framework, de base de datos ni de proveedor de despliegue.
*   No se implementan pagos: no hay pasarela en las dependencias ni ruta de
    checkout; los planes de `/precios` son catálogo.
*   No se migran las dependencias *major* en esta etapa.

## Open Questions

*   **Nombres reales de las policy de `profiles`.** La migración `0010` crea
    `profiles_select_own`, `profiles_insert_own`, `profiles_update_own` y
    `profiles_delete_own` con `drop policy if exists`. Si producción ya tiene
    policies equivalentes con **otros nombres**, quedan duplicadas (permisivas, se
    combinan con OR). Antes de aplicar hay que confirmar los nombres reales.
*   **¿Las vistas de un cupón privado deben contar?** `increment_views` solo
    incrementa `where is_public = true` (`supabase/migrations/0002_security.sql:206-215`).
    Con el enlace privado ya funcionando, ese contador queda a cero. Es una
    decisión de producto, no un defecto del código.
*   **¿Qué es el bucket privado `ecocupon`?** Existe con 2 objetos y ningún
    consumidor en el código. **No verificado** si algo externo lo usa.
*   **¿El producto tendrá IA de verdad** o se corrige el copy de la landing, del
    metadata y de `/precios`?
*   **Número de WhatsApp de `/precios`**: resuelto — `56979540471`
    (`app/precios/page.tsx:54`).
*   **¿Dónde van los artefactos de EGM?** Resuelto: `CLAUDE.md` declara
    `EGM artifact directory: docs/designs`, que es donde viven los informes.

## Critical User Journeys (CUJs)

### CUJ 1: Crear un cupón

*   **Given**: un comercio con cuenta confirmada y sesión iniciada en `/dashboard`.
*   **When**: entra en `/dashboard/crear`, rellena título, comercio, código y
    descuento, opcionalmente sube un logo, y guarda.
*   **Then**: se inserta la fila en `coupons` con `user_id` del usuario
    (`app/dashboard/crear/page.tsx:104-119`), se compone la imagen final con
    `/api/coupon-image` y se persiste en `generated_image_url`
    (`app/dashboard/crear/page.tsx:122-133`). El cupón aparece en
    `/dashboard/mis-cupones`. Si el guardado de la imagen falla, el cupón existe
    igual: se registra el error y no se aborta.

### CUJ 2: Ver y compartir un cupón público

*   **Given**: un visitante sin sesión.
*   **When**: abre `/cuponera` y entra en un cupón.
*   **Then**: la cuponera lista solo cupones con `is_public = true`
    (`app/cuponera/page.tsx:13-18`); la página del cupón incrementa vistas vía RPC
    y ofrece compartir por WhatsApp o copiar enlace
    (`components/coupon-share-buttons.tsx`), lo que incrementa `shares_count`.

### CUJ 3: Abrir un cupón privado por enlace

*   **Given**: alguien recibe el enlace `/cupon/<uuid>` de un cupón con
    `is_public = false`.
*   **When**: lo abre sin sesión.
*   **Then**: ve el cupón. El UUID hace de capacidad: sin él no se llega, y no se
    puede listar la tabla (`app/cupon/[id]/page.tsx:24-49`). Las vistas de ese
    cupón **no** se cuentan (ver Open Questions).

### CUJ 4: Iniciar sesión con correo y contraseña

*   **Given**: un usuario registrado.
*   **When**: envía credenciales en `/auth/login`.
*   **Then**: `signInWithPassword` (`app/auth/login/page.tsx:28`); en éxito
    `router.push("/dashboard")` y `router.refresh()`; en error se muestra el
    mensaje traducido al español por `lib/auth-errors.ts` (`traducirErrorAuth`).

### CUJ 5: Recuperar la contraseña

*   **Given**: un usuario que olvidó su contraseña.
*   **When**: envía su correo en `/auth/recuperar`.
*   **Then**: se consulta la RPC `user_exists` (`app/auth/recuperar/page.tsx:32`);
    si no existe, se le invita a registrarse; si existe, se envía el enlace con
    `resetPasswordForEmail` (`app/auth/recuperar/page.tsx:53`).

### CUJ 6: Volver a entrar por el enlace del correo

*   **Given**: el usuario hizo clic en un enlace de confirmación o de reseteo.
*   **When**: Supabase lo redirige a `/auth/callback?code=…`.
*   **Then**: se intercambia el código por sesión y se redirige a `next`
    (`app/auth/callback/route.ts:7-17`); si el intercambio falla, a
    `/auth/error`.

### CUJ 7: Registrarse

*   **Given**: alguien sin cuenta llega a `/auth/registro`.
*   **When**: envía correo, contraseña y nombre del negocio; o usa "Continuar con
    Google".
*   **Then**: `signUp` con `business_name` en los metadatos
    (`app/auth/registro/page.tsx:30-40`) y pantalla de "revisa tu correo". El
    trigger `handle_new_user` crea la fila de `profiles`.

### CUJ 8: Cambiar la contraseña tras el enlace

*   **Given**: el usuario llegó desde el correo de reseteo con sesión temporal.
*   **When**: envía la contraseña nueva dos veces.
*   **Then**: se valida longitud y coincidencia en el cliente
    (`app/auth/nueva-contraseña/page.tsx:34-41`), se llama a `updateUser`
    (`:47`) y se redirige al panel. Si no hay sesión, se muestra el aviso
    correspondiente.

### CUJ 9: Cerrar sesión

*   **Given**: un usuario con sesión en el panel.
*   **When**: pulsa salir en la barra del dashboard.
*   **Then**: `signOut` (`components/dashboard-nav.tsx:26`) y vuelta a `/`. El
    resultado del `signOut` no se comprueba: si falla, la interfaz igual navega a
    la portada.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### Vista general

```text
Navegador
  │
  ├─ páginas públicas ─────────────► Server Components ─┐
  │   /, /precios, /condiciones,                         │
  │   /privacidad, /cuponera, /cupon/[id]                │
  │                                                      ├─► Supabase
  ├─ páginas de sesión ───────────► Client Components ───┤   · Postgres + RLS
  │   /auth/* (login, registro,          (supabase-js,   │   · Auth (email, Google)
  │    recuperar, nueva-contraseña)       navegador)     │   · Storage (bucket logos)
  │                                                      │
  ├─ /dashboard/* ────────────────► Server + Client ─────┘
  │   (layout valida sesión)
  │
  └─ /api/coupon-image ───────────► next/og + qrcode ──► PNG del cupón
     /api/upload-logo ────────────► validación + service role ──► Storage
```

### Mapa de rutas (18, tal como las reporta `next build`)

| Ruta | Tipo | Sesión | Qué hace |
|---|---|---|---|
| `/` | estática | no | Landing comercial |
| `/precios` | estática | no | Catálogo de planes (sin pasarela) |
| `/condiciones`, `/privacidad` | estáticas | no | Legales (Ley 19.628) |
| `/cuponera` | dinámica | no | Lista cupones `is_public = true` (máx. 50) |
| `/cupon/[id]` | dinámica | no | Un cupón por UUID; cuenta vistas |
| `/auth/login`, `/registro`, `/recuperar`, `/nueva-contraseña`, `/error`, `/verificar` | estáticas | no | Flujos de cuenta |
| `/auth/callback` | route handler | no | Intercambia `code` por sesión |
| `/dashboard` | dinámica | **sí** | Resumen y estadísticas |
| `/dashboard/crear` | dinámica | **sí** | Alta de cupón |
| `/dashboard/mis-cupones` | dinámica | **sí** | Listado propio, borrar, hacer público |
| `/api/coupon-image` | route handler | no | Imagen PNG determinista del cupón |
| `/api/upload-logo` | route handler | **sí** | Subida del logo a Storage |

### Capa de datos

Tablas (según las migraciones y el estado real de producción ya auditado):

*   `coupons` (16 columnas): `id` (uuid), `user_id` → `auth.users` con
    `on delete cascade`, `business_name`, `title`, `description`,
    `discount_percentage` (1–100), `coupon_code`, `logo_url`,
    `generated_image_url`, `cta_text`, `is_public`, `expires_at`, `views`,
    `shares_count`, `created_at`, `updated_at`.
*   `profiles` (8 columnas): `id` → `auth.users`, `business_name`, `email`,
    `phone`, `logo_url`, `plan_type`, `created_at`, `updated_at`.

Funciones (`security definer`, con `search_path` fijado):

| Función | Quién la llama | Invariante |
|---|---|---|
| `handle_new_user()` | trigger en `auth.users` | Crea el perfil; `on conflict do nothing` |
| `increment_views(uuid)` | anónimo, desde `/cupon/[id]` | Solo incrementa si `is_public = true` |
| `increment_shares(uuid)` | anónimo, al compartir | Incrementa sin filtrar por visibilidad |
| `user_exists(text)` | anónimo, desde `/auth/recuperar` | Consulta `auth.users`; **es un oráculo de enumeración** |

**Invariante de datos que hoy no se cumple:** un cupón con `is_public = false`
solo debería ser legible por su dueño y por quien tenga el enlace. La policy
vigente (`using (true)`) permite leerlo a cualquiera que liste la tabla.

Mecanismo de arreglo (en `docs/designs/2026-11-09-egm-analisis-estructural.md` y
`docs/runbooks/migraciones-procedimiento.md`): acotar la policy a
`is_public = true or auth.uid() = user_id` **y**, para que el enlace directo siga
funcionando, resolver la lectura por UUID fuera del alcance de RLS. Hoy eso se hace
con service role (`lib/supabase/admin.ts`). **Alternativa preferible** señalada en
la review: una función `security definer` que devuelva una fila por UUID, con lo
que Postgres sigue siendo el único punto de autorización y la service role no entra
en el camino de la petición. Queda como decisión pendiente, no como hecho.

Aviso de diseño (**aplica una vez acotada la policy**): con la policy permisiva
actual el fallback a RLS sí lee el cupón privado, así que hoy ese camino funciona.
Después de aplicar `0010`, en cambio, las tres causas de fallo de esa lectura
(falta la clave de servicio, clave inválida, error de lectura) y "el cupón no
existe" producen **el mismo 404 sin explicación**
(`app/cupon/[id]/page.tsx:44-56`). De ahí la precondición del runbook.

**Invariante de acceso:** el cliente de navegador (`lib/supabase/client.ts`) usa
siempre la clave publicable y depende de RLS. La service role aparece en dos
sitios y solo dos: `app/api/upload-logo/route.ts` y `lib/supabase/admin.ts`, que
existe para un único caso — leer un cupón por UUID cuando la policy ya no permite
el listado anónimo. Cualquier uso nuevo de la service role es una decisión
deliberada, no un atajo.

### Autenticación

*   **Cliente de navegador** (`lib/supabase/client.ts`): `createBrowserClient`.
*   **Servidor** (`lib/supabase/server.ts`): un cliente por petición, construido
    sobre las cookies. El propio archivo advierte de no memorizarlo en una
    variable global.
*   **Sesión** (`proxy.ts` → `lib/supabase/middleware.ts`): `proxy.ts` refresca la
    sesión en cada petición que no sea estático y delega en `updateSession`. **No
    define cabeceras**: la CSP vive en `next.config.mjs`. El guard que redirigía a
    login desde `/protected` —ruta que no existe— fue eliminado; queda solo la
    nota en el comentario de `lib/supabase/middleware.ts:4-10`.
*   **Protección real del panel**: `app/dashboard/layout.tsx:10-15` lee el usuario
    y redirige a `/auth/login` si no hay. Cada página repite la comprobación:
    `app/dashboard/page.tsx:12-17` redirige antes de consultar, para no enviar
    `user_id = undefined` a Postgres.
*   **OAuth con Google**: `signInWithOAuth` con `redirectTo` a
    `${SITE_URL}/auth/callback` (`components/google-button.tsx:38-43`). Hoy falla
    en Google con `redirect_uri_mismatch` porque el callback de Supabase
    (`https://vwjdfyljacoxwabtfoco.supabase.co/auth/v1/callback`) no está
    registrado en el cliente OAuth. Es configuración externa al repositorio: no
    se arregla con código.
*   **Invariante de sesión:** ninguna página de `/dashboard/*` debe consultar
    datos antes de comprobar el usuario.

### Generación de la imagen del cupón

`GET /api/coupon-image` (`app/api/coupon-image/route.tsx`) compone la imagen con
`next/og` y el QR con `qrcode`. No hay IA ni servicio externo.

| Entrada | Límite | Efecto |
|---|---|---|
| `title` | 60 caracteres | Texto principal |
| `business` | 40 | Nombre del comercio |
| `code` | 20 | Código del cupón |
| `discount` | 0–100 | Porcentaje |
| `logo` | solo hosts de Supabase, ≤ 5 MB | Se descarga y se compone |
| `url` | — | Contenido del QR |

Invariantes: la descarga del logo está restringida por lista blanca de host
(evita SSRF); `dynamic = "force-dynamic"` porque la respuesta depende de la
entrada; un fallo al bajar el logo no impide generar la imagen. El resultado es
determinista para los mismos parámetros.

### Subida del logo

`POST /api/upload-logo` (`app/api/upload-logo/route.ts`):

1.  Exige sesión válida (401 si no).
2.  Exige `SUPABASE_SERVICE_ROLE_KEY` en el entorno (500 si falta).
3.  Rechaza archivos de más de 5 MB (413).
4.  Decide el tipo real por los **bytes**, no por lo que declare el cliente
    (`sniffImage`, `app/api/upload-logo/route.ts:13-43`); acepta PNG, JPEG, GIF,
    WEBP y AVIF; **rechaza SVG** a propósito, porque es un documento con scripts
    y el bucket es público.
5.  Guarda siempre bajo `<user.id>/<timestamp>.<ext>` (aislamiento por usuario).

Invariante: la extensión y el `Content-Type` que envía el cliente nunca se usan
como verdad.

### Despliegue e integraciones

*   Vercel con Fluid Compute; `@vercel/analytics` solo en producción
    (`app/layout.tsx`).
*   El repositorio está enlazado a un proyecto de v0: **cada merge a `main`
    despliega**. No se reescribe historia ni se fuerza push.
*   Cabeceras en `next.config.mjs:10-29`: `X-Content-Type-Options`,
    `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y
    `Strict-Transport-Security` (`max-age=63072000`, sin `includeSubDomains` a
    propósito: un subdominio sin HTTPS quedaría inaccesible).
*   CSP en `next.config.mjs:47-61`, estática. **Por qué no usa nonce**: se
    implementó (nonce por respuesta en `proxy.ts` con `'strict-dynamic'`) y se
    descartó con evidencia. El build marca `/`, `/precios`, `/auth/*`,
    `/condiciones` y `/privacidad` como estáticas, así que su HTML se genera en el
    build **sin** atributo `nonce`, mientras la cabecera sí mandaba uno; con
    `'strict-dynamic'` el navegador ignora la lista de hosts y esos scripts
    quedarían bloqueados. Verificado contra un build de producción local: la
    cabecera de `/` traía un nonce y su HTML no contenía ningún `script nonce`.
    Retomarlo exige forzar esas rutas a dinámicas (perdiendo el prerender) o usar
    hashes. En desarrollo se añade `'unsafe-eval'` porque Turbopack y el HMR lo
    necesitan. `style-src` conserva `'unsafe-inline'` (Tailwind inyecta estilos
    sin nonce) e `img-src` incluye el host de Supabase.
*   Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
    `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
*   `lib/site-url.ts` es la única fuente de la URL canónica, porque hay valores
    que se **persisten** (la URL del QR): usar `window.location.origin` grabaría
    `localhost:3000` en la base.

## Alternatives Considered

### Alternativa A: mantener la policy de SELECT abierta (`using (true)`)

*   **Pros**: el enlace privado funciona sin código nuevo; cero cambios.
*   **Cons**: cualquiera con la clave publicable lista todos los cupones, con
    títulos, comercios y códigos de descuento de negocios que no los publicaron.
*   **Reason for Rejection**: Rejected by author: la tabla queda enumerable; el
    daño (filtrar la cartera de cupones de un competidor) no se compensa con el
    ahorro de código.

### Alternativa B: acotar la policy y leer el cupón por UUID con service role

*   **Pros**: el listado anónimo desaparece; el enlace sigue funcionando; el UUID
    actúa como capacidad; el daño se limita a quien ya tiene el enlace.
*   **Cons**: introduce service role en un componente de servidor (omite RLS por
    completo) y añade una variable de entorno crítica: sin ella, el enlace
    privado no funciona.
*   **Por qué se elige**: es la única opción probada que cumple las dos
    condiciones a la vez (enlace vivo y tabla no enumerable) sin inventar
    infraestructura.

### Alternativa C: ruta de API propia con token firmado por cupón

*   **Pros**: control explícito del acceso, se puede revocar, permite auditar.
*   **Cons**: exige emitir y guardar tokens, decidir caducidad y construir el
    enlace con el token; hoy el enlace es el UUID, y cambiarlo rompe los enlaces
    ya compartidos.
*   **Reason for Rejection**: Rejected by author: el coste de migrar enlaces ya
    repartidos es mayor que el riesgo que elimina, porque el UUID ya es
    impredecible.

### Alternativa D: paginar o cachear la cuponera antes de tocar RLS

*   **Pros**: mejora de rendimiento visible.
*   **Cons**: no cierra la fuga; la policy seguiría permitiendo el listado
    completo desde la API con la clave publicable.
*   **Reason for Rejection**: Rejected by author: resuelve un síntoma distinto del
    problema.

### Alternativa E (historial de migraciones): reescribir las migraciones no registradas para que sean idempotentes

*   **Pros**: un `db push` limpio las aplicaría sin fallar.
*   **Cons**: reescribir migraciones ya aplicadas falsea el historial y hace que
    dos entornos con el mismo nombre de archivo tengan contenidos distintos.
*   **Por qué no se elige**: se prefiere registrar el estado real
    (`migration repair`) y dejar el historial intacto.

--------------------------------------------------------------------------------

## Non-Functional Requirements

**Seguridad.** Tres cosas importan: (1) que la tabla de cupones no sea enumerable
por anónimos; (2) que la service role no se filtre ni se use fuera de los dos
puntos previstos; (3) que lo que sube un usuario no se sirva como documento
activo (de ahí el rechazo de SVG). Cabeceras y CSP están resueltas: HSTS presente y
CSP **estática en `next.config.mjs`**, sin nonce. La alternativa con nonce se
implementó y se descartó con evidencia (ver la sección de cabeceras del plan
técnico): las rutas prerenderizadas no llevan el nonce en su HTML, así que
`'strict-dynamic'` habría bloqueado sus scripts. Queda una reserva real:
`style-src` sigue necesitando `'unsafe-inline'`.

**Rendimiento y coste.** `/api/coupon-image` está cacheada en CDN
(`s-maxage=86400`, `app/api/coupon-image/route.tsx:205-209`), así que no se
recompone en cada visita; se recompone cuando cambia la clave de caché. La
descarga del logo sí ocurre cuando la imagen se regenera.
`/cupon/[id]` también es dinámica porque incrementa vistas en cada carga, así que
cada visita hace al menos una lectura y una escritura. La cuponera está limitada a
50 filas. **No verificado**: latencias y consumo reales en Vercel.

**Despliegue y reversión.** Cada merge a `main` publica. Un cambio de policy se
revierte con otra migración, no con un botón: por eso `0010` se aplica aparte y se
verifica de inmediato.

--------------------------------------------------------------------------------

### Additional Resources

*   `docs/designs/2026-11-09-auditoria-inicial.md` — estado antes de tocar nada.
*   `docs/designs/2026-11-09-informe-final.md` — qué se cambió y con qué evidencia.
*   `docs/designs/2026-11-09-egm-analisis-estructural.md` — análisis estructural,
    matriz de seguridad y el mecanismo concreto del arreglo de RLS.
*   `docs/runbooks/migraciones-procedimiento.md` — procedimiento de migraciones.
*   `docs/designs/egm-review/` — informes de los revisores Goldfish de este review.
*   `CLAUDE.md`, `AGENTS.md`
*   `supabase/migrations/0001_init.sql` … `0010_harden_rls_and_timestamps.sql`
*   Integración de EGM con Claude Code:
    `~/.claude/plugins/cache/egm/egm/0.1.1/docs/claude.md`

### Future Improvements

*   **El contrato de la capa de datos**: hoy cada página escribe sus propias
    consultas con su propia lista de columnas. Un módulo de acceso a datos
    (`lib/data/coupons.ts`) con funciones tipadas reduciría la duplicación y
    centralizaría las columnas que se exponen.
*   **La observabilidad**: los errores se registran con `console.error`. No hay
    correlación ni métrica de fallos de RLS, que son justo los que aparecen
    cuando cambia una policy.
*   **El mensaje del producto**: el copy promete IA; si no va a haberla, conviene
    decidirlo antes de que alguien lo note en producción.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Trabajo pendiente, en orden de dependencia. Estado real a 2026-11-09: **ya hechos**
los ítems 3 (aviso sin service role), 4 (cabeceras y CSP, con el nonce revertido con
evidencia) y 5 (mensajes de error en español, en `lib/auth-errors.ts`); el ítem 1
(`revoke ... from public` en la migración) está escrito en `0010` pero **la
migración sigue sin aplicar**. El resto está pendiente.

**Paso 0 (falta en la versión anterior y es el que cierra la fuga):** aplicar
`0010` en producción siguiendo `docs/runbooks/migraciones-procedimiento.md` —
reparar el historial con `--linked`, comprobar con `db push --linked --dry-run`
que solo queda `0010`, aplicar, y verificar con los comandos SQL y HTTP del Paso 5
de ese runbook. Nada del resto del plan tiene efecto sobre la fuga hasta que este
paso ocurra, y requiere autorización explícita. Los criterios de aceptación de las
demás secciones deben comprobarse con los comandos del runbook, no "mirando la
pantalla".

### Target Files to Create/Modify

#### 1. `supabase/migrations/0010_harden_rls_and_timestamps.sql` (Modify)

*   **Type / Scope**: migración SQL; **no aplicar sin autorización**.
*   **Proposed Changes**: añadir `revoke execute on function
    public.handle_new_user() from public` (el `revoke … from anon, authenticated`
    actual no quita el `EXECUTE` que Postgres concede a `PUBLIC`, así que el aviso
    del asesor seguiría apareciendo); fijar `search_path` a la nueva función
    `set_updated_at()` y revocar su `EXECUTE` de `public`, `anon` y
    `authenticated`; documentar que los nombres de las policy de `profiles` deben
    confirmarse antes de aplicarla para no dejar duplicados.

#### 2. Historial de migraciones (operación, no archivo)

*   **Type / Scope**: comando `supabase migration repair --status applied` para
    `0003`, `0004`, `0007`, `0008` y `0009`.
*   **Proposed Changes**: registrar el estado real. Motivo: mientras no estén
    registradas, un `db push` intentaría reejecutarlas y `0003` volvería a crear
    la policy de SELECT abierta, deshaciendo `0010` sin avisar.

#### 3. `app/cupon/[id]/page.tsx` (Modify, opcional)

*   **Type / Scope**: componente de servidor.
*   **Proposed Changes**: registrar de forma explícita cuando no hay
    `SUPABASE_SERVICE_ROLE_KEY` y se cae al cliente con RLS, para que un enlace
    privado que no abre deje rastro en vez de devolver un 404 sin explicación.

#### 4. `next.config.mjs` y `proxy.ts` (Modify — **hecho y corregido**)

*   **Type / Scope**: configuración de Next y proxy de sesión.
*   **Estado**: HSTS añadido (`next.config.mjs:19-31`) y la CSP **se quedó en
    `next.config.mjs:47-61`**. El nonce por respuesta en `proxy.ts` se implementó,
    se probó contra un build de producción y se revirtió: `/`, `/precios`,
    `/auth/*`, `/condiciones` y `/privacidad` son estáticas y su HTML no lleva
    nonce, así que `'strict-dynamic'` habría bloqueado sus scripts en producción.
*   **Proposed Changes pendientes**: si se quiere recuperar el nonce, hay que
    forzar esas rutas a dinámicas (perdiendo el prerender) o pasar a hashes;
    evaluar si `style-src` puede dejar de usar `'unsafe-inline'`.

#### 5. `app/auth/*` (Modify)

*   **Type / Scope**: formularios de sesión.
*   **Proposed Changes**: traducir al español los mensajes de error de Supabase
    mediante un mapa de los códigos conocidos, en vez de mostrar el texto crudo.

#### 6. `lib/data/` (Create)

*   **Type / Scope**: capa de acceso a datos.
*   **Proposed Changes**: funciones tipadas para las consultas repetidas
    (`listPublicCoupons`, `listOwnCoupons`, `getCouponById`, `createCoupon`) con la
    lista de columnas en un solo sitio. Motivo: hoy hay ocho llamadas a
    `.from("coupons")` con listas de columnas copiadas.

#### 7. `e2e/` (Modify)

*   **Type / Scope**: pruebas de extremo a extremo.
*   **Proposed Changes**: ampliar la suite existente con los casos que hoy no
    cubre: login correcto, persistencia de sesión, logout, creación de cupón y
    contadores. Requiere una cuenta de prueba autorizada.

### Verification Plan

*   **Compilación/Build**: `pnpm build` (debe terminar con 18 rutas).
*   **Tipos**: `npx tsc --noEmit`.
*   **Lint**: `pnpm lint` (0 errores).
*   **E2E**: `pnpm test:e2e`.
*   **Base de datos, tras aplicar `0010`**:
    *   `select qual from pg_policies where tablename = 'coupons' and cmd = 'SELECT';`
        debe devolver la expresión acotada, no `true`.
    *   Con la clave publicable, listar `coupons` no debe devolver filas privadas.
    *   Un `/cupon/<uuid-privado>` debe seguir abriendo.
    *   `/cuponera` y `/dashboard` deben seguir mostrando lo que mostraban.
*   **Rollback**: si `/cuponera` queda vacía o un cupón público no abre, revertir
    la policy a `using (true)` con una migración nueva mientras se diagnostica.

--------------------------------------------------------------------------------

<!-- Provenance: Indicates initial structural drafting via EGM. -->

*Drafted with EGM*
