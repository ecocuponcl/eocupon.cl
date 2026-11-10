# Auditoría técnica de SEO y rendimiento — ecocupon.cl

- **Fecha:** 2026-11-09
- **Sitio medido:** https://www.ecocupon.cl (producción, Vercel, `gru1`)
- **Stack:** Next.js 16.4.5 (Turbopack, App Router)
- **Método:** `curl` contra producción (solo lectura) + lectura del repo. Sin navegador.
- **Build local:** `pnpm build` ejecutado (ver §5).

---

## 1. Mediciones reales por página

TTFB y total con `curl -H "Accept-Encoding: gzip, br"`. La portada se midió 5 veces; el resto 1 vez (la mediana se indica cuando hubo varias muestras).

| Página | Código | TTFB | Total | HTML sin comprimir | gzip | brotli | `content-encoding` | `cache-control` | `x-vercel-cache` |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | **0.211 s** (mediana de 5: 0.200–0.221) | 0.220 s | 62 886 B | 8 953 B | 9 279 B | `br` | `public, max-age=0, must-revalidate` | HIT |
| `/precios` | 200 | 0.585 s | 0.588 s | 51 810 B | 6 748 B | 6 910 B | `br` | `public, max-age=0, must-revalidate` | HIT |
| `/cuponera` | 200 | **2.081 s** (frío) / 0.481 s (mediana de 4 calientes: 0.387–0.514) | 2.082 s / 0.50 s | 25 258 B | 5 262 B | 5 601 B | `br` | **`private, no-cache, no-store, max-age=0, must-revalidate`** | MISS |
| `/auth/login` | 200 | 0.688 s | 0.689 s | 17 201 B | 4 545 B | 4 772 B | `br` | `public, max-age=0, must-revalidate` | HIT |
| `/privacidad` | 200 | 0.492 s | 0.493 s | 22 032 B | 5 264 B | 5 512 B | `br` | `public, max-age=0, must-revalidate` | HIT |
| `/condiciones` | 200 | 0.503 s | 0.506 s | 19 806 B | 4 843 B | 5 080 B | `br` | `public, max-age=0, must-revalidate` | HIT |

Notas de medición:
- Todas las páginas responden comprimidas en **brotli** cuando el cliente lo pide. Curiosamente brotli entrega **más bytes que gzip** en estas páginas (p. ej. `/`: 9 279 B br vs 8 953 B gzip), señal de una calidad de compresión baja en el edge.
- `vary` es `rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`; **no incluye `Accept-Encoding`**.
- `/cuponera` es la única página medida sin caché compartida (`no-store`, `x-vercel-cache: MISS` en cada request).

## 2. Recursos estáticos

Assets referenciados por el HTML de `/`:

| Asset | br | raw | `cache-control` |
|---|---|---|---|
| `chunks/2q76yhqn8ip8q.js` | 73 327 B | 229 776 B | `public,max-age=31536000,immutable` |
| `chunks/1tqgsvhujx4du.js` | 45 104 B | 160 166 B | `public,max-age=31536000,immutable` |
| `chunks/0c0hxoamwjsbw.js` | 41 343 B | 112 594 B | `public,max-age=31536000,immutable` |
| `chunks/2gf6stwb1b8bw.js` | 8 630 B | 30 497 B | (mismo patrón) |
| `chunks/2me1d_dkusctw.js` | 4 860 B | 16 948 B | `public,max-age=31536000,immutable` |
| `chunks/turbopack-3h_ctkfaeun7f.js` | 4 573 B | 11 199 B | (mismo patrón) |
| `chunks/0as8h9qd2f93-.js` | 3 857 B | 13 405 B | (mismo patrón) |
| `chunks/3x33cw0f9ill5.js` | 3 427 B | 7 862 B | (mismo patrón) |
| `chunks/0igz8iuuh5724.css` | 20 397 B | 124 720 B | `public,max-age=31536000,immutable` |
| `chunks/0z8uwrs--_vw9.css` | 970 B | 3 607 B | `public,max-age=31536000,immutable` |

**Totales de `/`:** 8 chunks JS = **185 121 B br / 582 447 B raw**; 2 CSS = **21 367 B br / 128 327 B raw**. Total ≈ **206 KB br / 711 KB raw**. Sí hay `immutable` (1 año) en los assets con hash. Las fuentes Geist se precargan (2 `woff2`).

Imagen de cupón: `GET /api/coupon-image?...` → `200 image/png`, **45 575 B**, `cache-control: public, max-age=86400`, `x-vercel-cache: MISS`. TTFB: 1.82 s en frío, 0.23–0.51 s después.

## 3. SEO técnico por página

| Página | `<title>` | len | meta description | len | canonical | `lang` | OG (`og:*`) | Twitter | meta robots |
|---|---|---|---|---|---|---|---|---|---|
| `/` | EcoCupon - Genera cupones de descuento con IA | 45 | "Crea cupones de descuento personalizados… cuponera." | 117 | ❌ | `es` | ❌ (0) | ❌ (0) | ❌ |
| `/precios` | **idéntico a `/`** | 45 | **idéntico a `/`** | 117 | ❌ | `es` | ❌ | ❌ | ❌ |
| `/cuponera` | **idéntico a `/`** | 45 | **idéntico a `/`** | 117 | ❌ | `es` | ❌ | ❌ | ❌ |
| `/auth/login` | **idéntico a `/`** | 45 | **idéntico a `/`** | 117 | ❌ | `es` | ❌ | ❌ | ❌ |
| `/privacidad` | Política de Privacidad - EcoCupon | 33 | "Cómo EcoCupon.cl recopila… Ley N° 19.628…" | 127 | ❌ | `es` | ❌ | ❌ | ❌ |
| `/condiciones` | Condiciones del Servicio - EcoCupon | 35 | "Términos y condiciones de uso… legislación chilena." | 80 | ❌ | `es` | ❌ | ❌ | ❌ |
| `/cupon/[id]` (probado con un uuid real) | **idéntico a `/`** | 45 | **idéntico a `/`** | 117 | ❌ | `es` | ❌ | ❌ | ❌ |

Cobertura global medida: **0 páginas con canonical, 0 con Open Graph, 0 con Twitter Card, 0 con JSON-LD**. En el repo ningún `page.tsx` de `/`, `/precios`, `/cuponera`, `/auth/login` ni `/cupon/[id]` exporta `metadata`/`generateMetadata`; solo `privacidad` y `condiciones` lo hacen.

`/robots.txt` → **404** (`text/html`). `/sitemap.xml` → **404** (`text/html`). `/favicon.ico` → **404**. No existen `app/robots.ts` ni `app/sitemap.ts` en el repo.

## 4. Rastreo y redirecciones

| Prueba | Resultado |
|---|---|
| `http://www.ecocupon.cl/` | **308** → `https://www.ecocupon.cl/` |
| `http://ecocupon.cl/` | **308** → `https://ecocupon.cl/` → **307** → `https://www.ecocupon.cl/` (**2 saltos**) |
| `https://ecocupon.cl/` | **307** → `https://www.ecocupon.cl/` |
| `https://ecocupon.cl/privacidad` | **307** → `https://www.ecocupon.cl/privacidad` |
| `https://www.ecocupon.cl/precios/` (barra final) | **308** → sin barra |
| `/PRECIOS` (mayúsculas) | 404 |
| `/ruta-que-no-existe-xyz` | **404 real**, con `<meta name="robots" content="noindex">` |
| Cadena completa `http://ecocupon.cl/` | 2 redirecciones, 0.710 s |

La redirección canónica de apex → `www` es **307 (temporal)**; para consolidar señales conviene 308/301. En la página 404 se emiten **dos `<title>`** (el del layout raíz y el "404: This page could not be found.").

## 5. Semántica, enlaces e imágenes

- **H1:** exactamente 1 en `/`, `/precios`, `/cuponera`, `/privacidad`, `/condiciones`, `/cupon/[id]`. **`/auth/login` tiene 0 `<h1>`**: el título "Bienvenido de vuelta" está en un `<div data-slot="card-title">`, no en un encabezado.
- **H2:** `/` 4, `/privacidad` 8, `/condiciones` 9, `/cuponera` 1, `/precios` 1.
- **Enlaces internos** extraídos de las 6 páginas y probados uno a uno: `/`, `/precios`, `/cuponera`, `/auth/login`, `/auth/registro`, `/auth/recuperar`, `/privacidad`, `/condiciones`, `/cupon/7884f3be-…` → **todos 200**. Ningún enlace roto.
- **Imágenes:** 1 sola `<img>` en `/cuponera`; **sí tiene `alt`** (`alt="maquina"`). No tiene `width`/`height` ni `loading="lazy"`. **Cero usos de `next/image`** en `app/` y `components/`; `next.config.mjs` declara `images.formats: ["image/avif","image/webp"]` pero sin `remotePatterns` y sin ningún componente que lo use.

## 6. Datos estructurados

No hay JSON-LD en ninguna página medida (`application/ld+json` = 0 en `/`, `/precios`, `/cuponera`, `/auth/login`, `/privacidad`, `/condiciones`, `/cupon/[id]`).

Razonable para este SaaS de cupones (no implementado):
- `Organization` + `WebSite` (con `potentialAction: SearchAction`) en el layout raíz.
- `Product`/`Offer` por cupón en `/cupon/[id]` (nombre del negocio, `price`, `priceCurrency: CLP`, `availability`, `url`, `image`), ya que es el activo indexable real.
- `FAQPage` en `/precios` (la sección "Preguntas Frecuentes" ya existe).
- `BreadcrumbList` en `/cupon/[id]` y `/cuponera`.

## 7. Local (repo)

- **`app/layout.tsx`**: metadata raíz con `title` (45 car.), `description` (117 car.), `generator` e `icons`. **No** define `metadataBase`, `openGraph`, `twitter`, `robots`, `alternates.canonical` ni `verification`. `<html lang="es">`.
- **`app/robots.ts` / `app/sitemap.ts`**: **no existen** (confirmado con `find`).
- **`next.config.mjs`**: `images.formats` avif/webp (sin `remotePatterns`); `headers()` añade CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. **No** define cabeceras de caché para HTML.
- **`pnpm build`**: **OK** en ~18 s (compilación 4.0 s + TypeScript 11.6 s, Next 16.4.5). 19 rutas generadas. `/` y `/precios` marcadas `○ (Static)`; `/cuponera` y `/cupon/[id]` marcadas `ƒ (Dynamic)`. **Next 16 no imprime tamaños de bundle**, por eso el peso de §2 se obtuvo desde producción.

---

## 8. Hallazgos

| ID | Sev. | Qué falta o está mal | Evidencia | Arreglo sugerido |
|---|---|---|---|---|
| **S-01** | Crítico | No existe `/robots.txt` | `curl` → `404 text/html`; sin `app/robots.ts` | Crear `app/robots.ts` con `rules`, `sitemap` y `host`; bloquear `/dashboard`, `/auth/*`, `/api/*` |
| **S-02** | Crítico | No existe `/sitemap.xml` | `curl` → `404 text/html`; sin `app/sitemap.ts` | Crear `app/sitemap.ts` (estáticas + `/cupon/[id]` desde Supabase con `lastModified`) |
| **S-03** | Alto | 5 URLs comparten el mismo `<title>` y `description` del layout raíz (`/`, `/precios`, `/cuponera`, `/auth/login`, `/cupon/[id]`) | Título 45 y desc 117 idénticos en las 5 | Exportar `metadata`/`generateMetadata` por ruta; en `/cupon/[id]` generar título con negocio + descuento |
| **S-04** | Alto | Ninguna página tiene `<link rel="canonical">` | 0 canonical en 7 URLs medidas | `alternates: { canonical: ... }` por página + `metadataBase: new URL("https://www.ecocupon.cl")` |
| **S-05** | Alto | Cero Open Graph y cero Twitter Card | `og:*` = 0, `twitter:*` = 0 en las 7 URLs | Añadir `openGraph`/`twitter` en layout y por página; imagen OG 1200×630 |
| **S-06** | Alto | `/auth/login` sin `<h1>` | 0 `<h1>`; "Bienvenido de vuelta" es un `<div data-slot="card-title">` | Usar `<h1>` (o `CardTitle asChild` con `h1`) |
| **S-07** | Alto | Sin datos estructurados en ningún tipo de página | `application/ld+json` = 0 en 7 URLs | Añadir los esquemas de §6 |
| **S-08** | Medio | `/cuponera` es dinámica y no cacheable (`no-store`), TTFB frío 2.08 s | Header `cache-control: private, no-cache, no-store`; `x-vercel-cache: MISS`; build la marca `ƒ` | `revalidate`/`unstable_cache` con tags + `revalidateTag` al crear cupón |
| **S-09** | Medio | `/api/coupon-image` genera en cada request; 1.82 s TTFB en frío y sin `immutable` | `x-vercel-cache: MISS`, `max-age=86400`, 1.82 s | Subir `s-maxage` + `immutable`, o prerenderizar la imagen al crear el cupón |
| **S-10** | Medio | Ningún uso de `next/image`; la única `<img>` no tiene `width`/`height` ni `loading="lazy"` | 0 imports de `next/image`; `<img … class="absolute inset-0 h-full w-full">` | Migrar a `next/image` (con `remotePatterns` a Supabase) o al menos `width`/`height` + `loading="lazy"` |
| **S-11** | Medio | Payload JS alto en `/`: 185 KB br / 582 KB raw en 8 chunks; dos chunks suman 118 KB br | §2 | Revisar imports de Radix/iconos, dividir y `dynamic import` de componentes pesados |
| **S-12** | Medio | Apex → `www` usa **307** (temporal) y encadena 2 saltos desde `http://ecocupon.cl` | `location:` + 307 medido | Redirección permanente 308/301 a `https://www.` en el dominio de Vercel |
| **S-13** | Bajo | Páginas de autenticación indexables (sin `robots: noindex`) | 0 meta robots en `/auth/login`, `/auth/registro`… | `export const metadata = { robots: { index: false } }` en `/auth/*` y `/dashboard/*` |
| **S-14** | Bajo | `lang="es"` en lugar de `es-CL` | `<html lang="es">` | Cambiar a `lang="es-CL"` |
| **S-15** | Bajo | `vary` no incluye `Accept-Encoding` | Header medido | Añadir `Accept-Encoding` a `Vary` (Vercel suele gestionarlo; verificar CDN) |
| **S-16** | Bajo | `/favicon.ico` devuelve 404 | `curl` → 404 | Añadir `app/favicon.ico` o redirigir |
| **S-17** | Bajo | La página 404 emite dos `<title>` | HTML de `/ruta-que-no-existe-xyz` contiene 2 `<title>` | Definir `app/not-found.tsx` con su propia metadata |
| **S-18** | Bajo | Brotli entrega más bytes que gzip en HTML | `/`: 9 279 B br vs 8 953 B gzip | Revisar nivel/negociación de compresión en Vercel |

---

## 9. No verificado

- **Core Web Vitals reales** (LCP, CLS, INP, TBT): requieren navegador/Chrome UX Report. No se midieron.
- **Ejecución de JavaScript, hidratación y peso en memoria**: sin navegador no se puede saber qué chunks se ejecutan realmente tras la carga.
- **Lighthouse / PageSpeed Insights**: no ejecutados (no hay Chromium en esta auditoría).
- **Rendimiento móvil y 3G/4G simulados**: no medido.
- **Indexación real en Google/Bing**, cobertura, canibalización y backlinks: requiere Search Console.
- **Imágenes sociales** (cómo se ven los enlaces al compartirlos): no hay OG, así que no aplica hasta que se implemente.
- **Contenido dinámico de `/cuponera` con muchos cupones**: se probó con la página tal como está hoy (1 cupón); no se evaluó el escalado.
- **Hreflang / multiidioma**: el sitio es monolingüe; no aplica.
- **Comportamiento con `curl` vs navegador real en redirecciones** (caché de 307 en navegadores): no verificado.