# Detección de deriva (drift) — EcoCupon.cl

- **Fecha:** 2026-11-11
- **Método:** EGM, skill `egm-drift-report`. Un revisor Goldfish `egm-codebase-details`
  por documento, en contexto limpio: ninguno vio la conversación que produjo este
  informe ni los hallazgos de los otros.
- **Alcance:** los 7 documentos de `docs/designs/`. Fuera de alcance:
  `docs/designs/egm-review/` (son informes de review, no documentos de diseño) y
  los `README.md` del repo.
- **Regla aplicada:** solo divergencias. Lo que coincide no se describe.

## Cómo leer este informe

Cada hallazgo lleva una etiqueta. La distinción importa porque los tres casos se
arreglan de forma distinta y solo uno es un defecto del producto.

| Etiqueta | Significado | Se arregla |
|---|---|---|
| **[R] Deriva real** | El documento y el código, la base o producción discrepan en algo **vigente**. Alguien tiene razón y hay que decidir quién. | Cambiando código o documento, según la decisión |
| **[D] Documento atrasado** | El trabajo ya se hizo en el repo; el documento no lo refleja. | Reescribiendo el documento |
| **[P] Repo adelantado** | El documento describe **producción con exactitud**, pero `main` tiene commits sin publicar. El documento no está mal: el deploy está viejo. | Publicando |

## El hallazgo que reordena todo

`main` local está **3 commits adelante de `origin/main`** (`a28ae7c` contra
`a1184f8`): el commit de SEO, el informe de auditoría SEO y el fix de cabecera
móvil nunca se publicaron. Verificado contra producción el 2026-11-11:

| Comprobación en producción | Producción hoy | `main` local |
|---|---|---|
| `/robots.txt` | **404** | `app/robots.ts` |
| `/sitemap.xml` | **404** | `app/sitemap.ts` |
| `<title>` de `/` y `/auth/login` | **idénticos**, el del layout raíz | metadata propia por página |
| `rel="canonical"` y `og:*` | **ausentes** | presentes |
| Cabecera móvil y etiquetas de formulario | sin el fix | con el fix |

Consecuencia: **la auditoría SEO de 2026-11-09 no está desactualizada.** Describe
producción con exactitud. Los 12 "bloqueantes" que reporta su revisor son reales
contra el repo y falsos contra el sitio: lo que falta es desplegar.

## Verificado contra la base (lo que ningún revisor podía ver)

`supabase_migrations` registra solo `0001`, `0002`, `0005` y `0006`. La migración
`0010_harden_rls_and_timestamps.sql` existe en el repo y **no está aplicada**.

| Lo que los documentos dan por hecho | Estado real de la base |
|---|---|
| `0010` acota `coupons_select_own_or_public` | La policy sigue con `qual = true`: cualquiera con la clave publicable lee **todos** los cupones, incluidos los privados |
| `0010` crea los triggers de `updated_at` | No hay ningún trigger en `coupons` ni en `profiles` |
| `0010` revoca `TRUNCATE` | `anon` y `authenticated` lo conservan en ambas tablas |
| `profiles` con RLS y 4 policies | Sí existen en la base (creadas fuera de migración); `0010` las versiona pero no está aplicada |

Datos hoy: **4 cupones (1 público, 3 privados), 5 perfiles, 0 con `plan_type`
distinto de `free`**.

Sobre `TRUNCATE`: PostgREST no expone ese verbo, así que no es alcanzable desde la
API. Se revoca por higiene y defensa en profundidad, no porque hoy exista una vía
de ataque. La policy `qual = true` es distinta: esa sí es explotable con la clave
pública que viaja en el navegador.

--------------------------------------------------------------------------------

## 2026-11-09-egm-diseno-arquitectura.md

- **[R]** `:78` y `:212` — El documento dice que no hay pasarela de pago: «los
  planes de `/precios` son catálogo». El código tiene el plan Pro a $9.990 con CTA
  a un checkout hospedado de Reveniu (`app/precios/page.tsx:44`) y la misma oferta
  en la portada (`app/page.tsx:269`). **Está en producción desde el commit inicial**
  (`7d6aae8`). La FAQ de `/precios:164` declara cobro con tarjeta, débito y
  transferencia vía Reveniu. Y `profiles.plan_type` (`0001_init.sql:42`) no lo lee
  ni lo escribe nadie en todo el código: un pago no queda registrado ni desbloquea
  nada.
- **[R]** `:289` — «Hoy falla en Google con `redirect_uri_mismatch`». Contradice a
  los informes posteriores del propio repo, que lo dan por resuelto, y al commit
  `f5411df`. Pero `e2e/google-oauth.spec.ts:36-39` sigue con `test.fixme` afirmando
  exactamente ese error. El repositorio no resuelve la contradicción.
- **[R]** `:319-320` — El documento describe el paso 1 de `/api/upload-logo` como
  exigir sesión (401) y el paso 2 la clave de servicio (500). El código comprueba
  primero la clave (`app/api/upload-logo/route.ts:46-52`) y después la sesión
  (`:60-62`): sin la variable, una petición anónima recibe 500 y no 401.
- **[D]** `:54` y `:537` — «No hay red de pruebas» y «ampliar la suite». Existen
  `.github/workflows/ci.yml` (lint, `tsc --noEmit`, build) y 16 specs en `e2e/`.
- **[P]** `:207` y `:543` — «Mapa de rutas (18)». Hoy son 21: se sumaron
  `/auth/confirm`, `/robots.txt` y `/sitemap.xml`.
- **[D]** `:337` y `:511` — Rangos de línea de `next.config.mjs`. El bloque
  `headers` está en 15-35 y HSTS en 30-35, fuera de lo citado.
- **[D]** `:89` — `increment_views` ocupa 206-218 en `0002_security.sql`, con el
  predicado en la 216.
- **[D]** `:532` — «Ocho llamadas a `.from("coupons")`». Son nueve: la novena está
  en `app/sitemap.ts:20`.
- **[D]** `:97` — El WhatsApp de `/precios` está en la línea 62, no en la 54.
- **[D]** `:120` — El filtro `.eq("is_public", true)` de la cuponera está en la
  línea 24, no en 13-18 (eso es el `metadata`).

## 2026-11-09-egm-analisis-estructural.md

- **[R]** `:151`, `:156`, `:209` y `:287` — El documento afirma que la CSP se
  genera con nonce por respuesta en `proxy.ts:40-52` y que usa `'strict-dynamic'`.
  `proxy.ts` tiene 25 líneas, no genera nonce, y su propio comentario (`:18-20`)
  explica que la CSP vive en `next.config.mjs` porque un nonce no sirve con rutas
  prerenderizadas. Producción sirve `script-src 'self' 'unsafe-inline'` sin nonce
  (verificado por HTTP el 2026-11-11). Es el mismo defecto que la review de
  2026-11-09 cerró en el documento de arquitectura, vivo aquí.
- **[R]** `:57` — «Google OAuth falla con `redirect_uri_mismatch`»: misma
  contradicción que en el documento anterior.
- **[R]** `:83` y `:144` — «El RLS de `profiles` existe solo en producción, ninguna
  migración lo crea». `0010:41-57` las crea de forma idempotente. Verificado: las
  4 policies existen en la base, y `0010` no está aplicada.
- **[D]** `:114` y `:43-44` — «Cero verificación automática» y «hay 7
  especificaciones». Hoy hay CI y 16 specs, incluidas login correcto, persistencia
  de sesión, logout, alta de cupón y contadores.
- **[D]** `:135` — «`/auth/error` solo se alcanza desde el callback». También
  redirige ahí la confirmación de correo (`app/auth/confirm/route.ts:37`) y
  producción lo confirma: `/auth/confirm` sin token responde `307` a `/auth/error`.
- **[D]** `:152` — «Los errores de Supabase salen en inglés». Existe
  `lib/auth-errors.ts` con el traductor, conectado en las cuatro pantallas de auth.
- **[D]** `:229` — «El cupón privado devuelve 404 sin dejar rastro». El código
  registra un aviso explícito cuando falta la service key (`app/cupon/[id]/page.tsx:36-38`).
- **[D]** `:206` y `:210` — Propuestas 5 (suite E2E) y 9 (traducir errores) figuran
  pendientes y ya están hechas.
- **[P]** `:65` — «Ocho llamadas a `coupons` en cinco archivos». Son nueve en seis.
- **[P]** `:30` — «Las 18 rutas compilan». Son 21.
- **[D]** `:151` — HSTS citado en `next.config.mjs:21-24`; está en 30-35.

## 2026-11-09-auditoria-integral.md

- **[P]** `:86`, `:87`, `:88`, `:89`, `:90` — Sin `/robots.txt`, sin
  `/sitemap.xml`, títulos duplicados, sin canonical, sin Open Graph. Exacto contra
  producción; implementado en `main` sin desplegar. Sigue pendiente en ambos:
  Twitter Card no existe y `/cupon/[id]` no exporta metadatos propios.
- **[P]** `:70`, `:71`, `:72`, `:74` — Scroll horizontal en móvil, etiquetas sin
  asociar, `/auth/login` sin encabezado, campos sin `autocomplete`. El fix está en
  `a28ae7c`, no desplegado.
- **[R]** `:47` — «RLS de `profiles`: existe en la base, no en las migraciones».
  `0010` la versiona. La base confirma que las policies existen.
- **[R]** `:146` — «`/precios` ofrece Pro y Business sin pasarela». Pro cobra por
  Reveniu, en repo y en producción. Mismo hallazgo que en arquitectura.
- **[D]** `:102` y `:172` — «Sin tests unitarios ni CI» y «CI PENDIENTE». Existe
  `.github/workflows/ci.yml`.
- **[D]** `:110` — «Se corrigieron el enlace roto y los enlaces muertos del
  footer». El footer sigue sirviendo `<Link href="#">Contacto</Link>`
  (`app/page.tsx:312`), también en producción.
- **[D]** `:138` — «Pendiente: encabezados en `/auth/login` (U-03)». El `h1`
  existe. U-04 (objetivos táctiles) sigue sin verificar.
- **[P]** `:23` — «18 rutas»: son 21. `:24` — «8 consultas»: son 9.

## 2026-11-09-auditoria-seo-rendimiento.md

**Sin deriva contra producción.** El documento mide y describe el sitio publicado
con exactitud: los 404 de robots y sitemap, los títulos compartidos, la ausencia de
canonical y de `og:*`, y el `/auth/login` sin `h1` son todos ciertos hoy en
`www.ecocupon.cl`. Su revisor los marcó como bloqueantes comparándolos con `main`,
donde ya están resueltos: son **[P]**.

Lo que el revisor cita como resuelto en el repo, para cuando se despliegue:
S-01 y S-02 (`app/robots.ts`, `app/sitemap.ts`), S-03 (`metadata` propia en `/`,
`/precios`, `/cuponera` y `app/auth/layout.tsx`), S-04 (`metadataBase` +
`alternates.canonical`), S-05 (`openGraph` global, sin Twitter Card), S-06 (`h1`
`sr-only`), S-13 (`robots: { index: false }` en `/auth/*`; `/dashboard/*` sigue sin
metadata).

Residuales reales:

- **[D]** `:119` — S-09 dice que `/api/coupon-image` responde «sin `immutable`» y
  propone subir `s-maxage`. El código ya envía `public, max-age=86400,
  s-maxage=86400, stale-while-revalidate=604800`
  (`app/api/coupon-image/route.tsx:205-209`). Falta solo `immutable`.
- **[D]** `:103` — «`pnpm build` genera 19 rutas». Con robots y sitemap ya no
  puede ser 19.

## 2026-11-09-auditoria-inicial.md

- **[R]** `:105` — Hallazgo #1: `coupons_select_own_or_public` con `qual = true`.
  **Sigue exactamente así en la base.** Aquí no hay deriva: el documento acierta y
  el defecto continúa abierto. Hoy expone 3 cupones privados de 4.
- **[D]** `:61` — «`pnpm lint` falla porque `eslint` no está instalado ni
  declarado». Está en `devDependencies` y existe `eslint.config.mjs`. (La causa (a),
  el bloqueo de `sharp` en pnpm, no es verificable sin shell.)
- **[D]** `:64` — «Los tests no existen, sin `.github/`, sin CI». Existen 16 specs
  y el workflow.
- **[D]** `:106` — Hallazgo #2: RLS de `profiles` no versionado. `0010:41-57` lo
  versiona.
- **[R]** `:110` y `:111` — Hallazgos #6 (`updated_at` sin trigger) y #7
  (grants de `TRUNCATE`). El arreglo está escrito en `0010:62` y `:74-95`, pero la
  base confirma que **no se aplicó**: no hay triggers y los grants siguen.
- **[D]** `:135` — «El guard del middleware protege `/protected`, código muerto».
  El guard ya no existe; `updateSession` solo refresca la sesión.
- **[D]** `:140` — «`createClient()` en el cuerpo del componente provoca un bucle».
  Vive dentro del `useEffect` con dependencias `[]` (`app/dashboard/mis-cupones/page.tsx:30-56`).
- **[D]** `:143` — «Errores de Supabase ignorados» en seis puntos. Los seis los
  manejan hoy, con mensaje al usuario y/o `console.error`.
- **[D]** `:147` — Enlace a `https://www.ecocupon.cl/pagos`. No existe ninguna
  referencia a `/pagos` en `app/`.
- **[D]** `:148` — «WhatsApp de ejemplo `56912345678`». El número real es
  `56979540471` (`app/precios/page.tsx:62`), también en producción.
- **[D]** `:149` — «`google-button.tsx` duplica `SITE_URL`». Importa desde
  `@/lib/site-url`.
- **[D]** `:153` — «Las variables Geist nunca se aplican». Se aplican en el
  `<html>` (`app/layout.tsx:50`).
- **[D]** `:48` y `:53` — Versiones del stack desactualizadas (hoy Next 16.4.5,
  React ^19.3.1, Tailwind ^4.3.5, `@supabase/ssr` ^0.12.7). `:53` — «18 rutas»:
  son 21.
- **[D]** `:66` — «Hay 1 `console.error`». Hay 7 en código de aplicación.

No reportados por depender de medición o de paneles externos: el drift del registro
de migraciones y sus «cinco pendientes», los conteos medidos por MCP, versiones de
pnpm/Node, tiempos de build, hashes y el artefacto `.env.local`. Los hallazgos #4
(`user_exists` abierto a `anon`), #5 (`increment_*` sin límite) y #8 (bucket
`ecocupon` sin referencias) siguen vigentes en el repo.

## 2026-11-09-informe-final.md

- **[R]** `:95` — El documento dice que el enlace directo a un cupón privado
  «dejará de funcionar» para visitantes anónimos al aplicar `0010`, y que
  conservarlo exigiría una ruta con service role. Esa ruta ya existe:
  `app/cupon/[id]` lee con service role validando el formato del UUID
  (`app/cupon/[id]/page.tsx:28-34`, `lib/supabase/admin.ts:15-24`), y la propia
  `0010` afirma que el enlace se conserva. La cita `:21-23` ya no contiene ese
  comentario.
- **[R]** `:120` y `:153` contra `:28` — El mismo documento da Google como
  **FALLA** en una sección y **RESUELTO 23:24** en otra. El spec E2E sigue en
  `fixme` con el error. Contradicción interna sin cerrar.
- **[D]** `:157` — «`/api/upload-logo` sin límite de tamaño y acepta SVG». Tiene
  límite de 5 MB (413) y validación por firma de bytes que excluye SVG (415)
  (`app/api/upload-logo/route.ts:9,13-43,71,82`).
- **[D]** `:156` — «CSP con `unsafe-inline` y **sin HSTS**». HSTS existe:
  `max-age=63072000` en `next.config.mjs:31-35`, y producción lo sirve (verificado).
- **[D]** `:80` — «Enlace roto a `/pagos` y tres enlaces muertos del footer»
  figuran como corregidos. «Contacto» sigue apuntando a `#` en `app/page.tsx:312`,
  en repo y en producción.
- **[D]** `:25`, `:149` y `:166` — «Tests / CI: NO EXISTEN». Existen.
- **[D]** `:158` — «Guard muerto del middleware». Ya no existe.
- **[D]** `:161` — «Mensajes de error de Supabase en inglés». Traducidos.
- **[D]** `:160` — El WhatsApp está en la línea 62, no en la 54.

## 2026-11-09-informe-entrega.md

- **[D]** `:70` — «Problemas corregidos: enlace roto a `/pagos` y tres enlaces
  muertos del footer». «Contacto» sigue muerto (`app/page.tsx:312`, también en
  producción). Los otros tres (`/precios`, `/condiciones`, `/privacidad`) sí
  resuelven.
- **[D]** `:61` y `:145` — «No hay tests unitarios ni CI» y propuesta de añadirlo.
  El workflow existe desde entonces.
- **[R]** `:84` y `:116` — «`profiles` con RLS solo en la base, no reproducible
  desde el repo». `0010:41-57` lo versiona.
- **[R]** `:56` — Google «RESUELTO 23:24, verificado por log de auth». El repo no
  lo respalda: el único test del flujo sigue en `fixme` afirmando
  `redirect_uri_mismatch`. La configuración de Google Cloud no es verificable desde
  el repositorio.
- **[D]** `:42` — «`docs/designs/` (5 informes + 6 de review)». Son 7 y 8.

--------------------------------------------------------------------------------

## Resumen

| Documento | [R] | [D] | [P] |
|---|---|---|---|
| egm-diseno-arquitectura | 3 | 6 | 1 |
| egm-analisis-estructural | 3 | 5 | 2 |
| auditoria-integral | 2 | 4 | 2 |
| auditoria-seo-rendimiento | 0 | 2 | 12 |
| auditoria-inicial | 2 | 11 | 0 |
| informe-final | 2 | 6 | 0 |
| informe-entrega | 2 | 2 | 0 |
| **Total** | **14** | **36** | **17** |

Lectura: 36 de las 67 divergencias son documentos que quedaron atrás, sin
consecuencia para el sitio. 17 son un deploy que no se publicó. Las **14 de deriva
real** son las que exigen una decisión, y de ellas solo cuatro tienen consecuencia
fuera del repositorio.

## Lo que hay que decidir, en orden

1. **La policy que expone los cupones privados sigue viva.** `0010` no está
   aplicada. Cualquiera con la clave publicable lee los 3 cupones privados que hay
   hoy. Aplicarla exige antes reparar el historial de migraciones, como advierte
   `CLAUDE.md` y detalla `docs/runbooks/migraciones-procedimiento.md`.
2. **El sitio cobra y la base no lo registra.** El plan Pro a $9.990 se vende por
   Reveniu desde el primer commit, y no existe webhook, ni integración, ni lectura
   o escritura de `plan_type`. Si alguien paga hoy, no queda registro y no recibe
   nada. Hay que decidir si el cobro es real o es un placeholder que debe salir del
   sitio.
3. **Publicar los 3 commits de `main`.** Convierte los 17 hallazgos `[P]` en
   inexistentes y pone en producción el SEO, la cabecera móvil y las etiquetas de
   formulario. No lo hice: `main` despliega solo y publicar es tu decisión.
4. **Cerrar la contradicción de Google.** Repo, documentos y spec E2E se
   contradicen entre sí. Se resuelve probando el flujo una vez y alineando los tres.
5. **Reescribir o archivar los 7 documentos.** Los `[D]` son 36; si estos informes
   son históricos, basta marcarlos como tales en una cabecera para que dejen de
   leerse como estado actual.

## Límites de este informe

- No se ejecutó push, ni migraciones, ni cambios de código. Todo fue lectura, más
  consultas SQL de solo lectura y peticiones HTTP GET al sitio propio.
- No se probó el login con Google: exige una cuenta y una redirección real.
- No se verificaron las variables de entorno de Vercel.
- Las mediciones de producción son del 2026-11-11 y cambian con el próximo deploy.
- Los revisores Goldfish no tienen shell ni red; sus afirmaciones sobre el repo se
  verificaron una por una desde el contexto principal antes de escribirlas aquí.
  Una de sus cifras era inexacta y quedó corregida: hay **16** specs en `e2e/`, no 17.