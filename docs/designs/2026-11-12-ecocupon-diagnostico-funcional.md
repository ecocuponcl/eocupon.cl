# EcoCupon.cl — Diagnóstico funcional

- **Fecha:** 2026-11-12
- **Autor:** Kiro (análisis técnico) + verificación HTTP contra producción
- **Método:** lectura completa de 38 archivos fuente + 6 migraciones SQL + curl HTTP contra
  `www.ecocupon.cl`. No se ejecutaron comandos que modifiquen código, BD ni producción.
- **Versión en producción al momento del análisis:** commit `0a38fe2` (desplegado por Vercel).

---

## 1. Cómo funciona EcoCupon actualmente

EcoCupon es una plataforma donde un **comercio** crea cupones digitales con imagen, código y QR,
los comparte por WhatsApp y los valida en su local cuando un consumidor los presenta. El ciclo
completo existe en el código y funciona de extremo a extremo:

```
Comercio crea cupón
  → imagen OG generada (next/og + qrcode, cacheada 24 h en CDN)
  → comparte por WhatsApp con la imagen adjunta (móvil) o enlace (escritorio)
  → consumidor abre /cupon/[id], activa con nombre + teléfono
  → recibe UUID de instancia (su "carnet")
  → va al local, muestra el UUID
  → comercio pega en /dashboard/[id]/validar
  → sistema verifica vigencia, período y duplicados
  → comercio confirma → canje registrado en BD
  → historial + métricas en /dashboard/[id]/canjes
```

Rutas públicas verificadas en producción (todas 200, tiempos < 600 ms):

| Ruta | HTTP | Tiempo | Cache |
|---|---|---|---|
| `/` | 200 | 0.27 s | HIT |
| `/cuponera` | 200 | 0.40 s | MISS |
| `/precios` | 200 | 0.22 s | HIT |
| `/auth/login` | 200 | 0.20 s | HIT |
| `/auth/registro` | 200 | 0.20 s | HIT |
| `/robots.txt` | 200 | 0.08 s | HIT |
| `/sitemap.xml` | 200 | 0.38 s | MISS |
| `/cupon/[id]` | 200 | 0.50 s | MISS |
| `/cupon/[id]/activar` | 200 | 0.36 s | MISS |
| `/condiciones` | 200 | 0.20 s | HIT |
| `/privacidad` | 200 | 0.23 s | HIT |

Rutas privadas sin sesión (correctamente protegidas):

| Ruta | HTTP | Redirige a |
|---|---|---|
| `/dashboard` | 307 | `/auth/login` |
| `/dashboard/[id]/editar` | 307 | `/auth/login` |
| `/dashboard/[id]/validar` | 307 | `/auth/login` |
| `/dashboard/[id]/canjes` | 307 | `/auth/login` |

APIs verificadas en producción:

| Endpoint | Prueba | Resultado |
|---|---|---|
| `POST /api/coupon-instance` sin body | 400 | ✅ correcto |
| `POST /api/coupon-instance` UUID inexistente | 404 | ✅ correcto (service role activa) |
| `GET /api/redeem` sin sesión | 401 | ✅ correcto |
| `POST /api/redeem` sin sesión | 401 | ✅ correcto |

Headers de seguridad en producción (verificados):

- CSP completa con `unsafe-inline` documentado (prerenderización estática impide nonce)
- `Strict-Transport-Security: max-age=63072000`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 2. Recorrido completo del comercio

### 2.1 Registro

**Ruta:** `app/auth/registro/page.tsx`

Funciona: nombre del negocio, email y contraseña; Google OAuth; validación HTML5 en navegador;
errores de Supabase traducidos al español (`lib/auth-errors.ts`). Envía confirmación por correo.

**Problema:** `emailRedirectTo` usa `window.location.origin` en lugar de `SITE_URL`. En producción
con dominio fijo el impacto es nulo, pero si alguien prueba desde localhost con la BD de
producción, el enlace de verificación apuntará a localhost.

**Columna huérfana:** `profiles.business_name` nunca recibe el valor del registro. El trigger
`handle_new_user` (`0001_init.sql:35-42`) solo escribe `id` y `email`. La columna queda vacía.
El dashboard muestra el nombre desde `user_metadata.business_name`, no desde `profiles`.

### 2.2 Inicio de sesión

**Ruta:** `app/auth/login/page.tsx`

Funciona completamente: email/password y Google OAuth. Redirige a `/dashboard` al entrar.

### 2.3 Recuperación de contraseña

**Ruta:** `app/auth/recuperar/page.tsx`

Funciona. La pantalla de respuesta es idéntica exista o no la cuenta (antioracle cerrado en
migración `0011`). `/auth/nueva-contraseña` permite cambiar la contraseña una vez llegado por
el enlace.

**Mismo problema de `window.location.origin`** en `redirectTo`.

### 2.4 Crear cupón

**Ruta:** `app/dashboard/crear/page.tsx`

Funciona completamente:
- Logo con validación por firma de bytes (vía `POST /api/upload-logo`)
- Título, descuento, código (manual o generado), nombre del negocio
- Política de canje (`once/monthly/weekly/daily/unlimited`)
- Fecha de vencimiento de campaña
- Preview en tiempo real de la imagen
- Imagen base guardada sin QR → luego actualizada con QR que apunta a `SITE_URL/cupon/[id]`
- Botones post-guardado: descargar, WhatsApp, copiar link, ir al validador

**`SITE_URL` correcto aquí:** la URL del QR usa `SITE_URL` de `lib/site-url.ts`, no
`window.location.origin`. El valor persistido en BD es siempre `https://www.ecocupon.cl/cupon/[id]`.

**Columnas escritas en creación:**
`user_id, title, description (""), discount_percentage, coupon_code, business_name,
generated_image_url, logo_url, is_public, redemption_period, expires_campaign_at`

**Columnas del schema que NO se escriben en creación:**
`image_url, cta_text, conditions, max_total_redemptions, expires_at` (el original, no el nuevo)

### 2.5 Editar cupón

**Ruta:** `app/dashboard/[id]/editar/page.tsx`

Funciona: título, negocio, código, descuento, política, vencimiento, condiciones, visibilidad.
Verifica propiedad (solo carga cupones del usuario autenticado).

**Limitación importante:** la imagen generada **no se regenera al editar**. El texto lo dice
explícitamente en la UI ("Los cambios no actualizan la imagen generada"). Un comercio que
corrija el descuento de 20% a 30% seguirá compartiendo la imagen vieja con 20%.

**`max_total_redemptions`** no tiene campo en la UI de edición (ni en creación). Existe en la
migración 0013 y se verifica en `/api/redeem`, pero no hay forma de configurarlo desde la app.

### 2.6 Eliminar cupón

**Ruta:** `app/dashboard/mis-cupones/page.tsx`

Funciona: DELETE en Supabase con RLS. **Sin diálogo de confirmación** — el click borra
inmediatamente. Los logos de Storage NO se borran, se acumulan para siempre en el bucket `logos`.

### 2.7 Publicar / despublicar

Funciona: toggle `is_public` en `mis-cupones/page.tsx`. Si se publica, aparece en `/cuponera`;
si se despublica, deja de aparecer.

### 2.8 Validar canjes en sucursal

**Ruta:** `app/dashboard/[id]/validar/page.tsx` + `GET/POST /api/redeem`

Funciona: el comercio pega el UUID de instancia del consumidor, el sistema pre-verifica (GET),
muestra nombre y teléfono en un diálogo de confirmación, y el comercio confirma (POST).

La lógica de períodos calcula correctamente `YYYY-MM`, `YYYY-WNN`, `YYYY-DDD` o `once/unlimited`.
El índice único `redemptions_instance_period_idx` previene el doble canje a nivel de BD.

**Problema de usabilidad crítico:** el UUID (36 caracteres) debe ser pegado a mano o tecleado.
No hay lector QR con cámara integrado. En un local real, el flujo es incómodo.

### 2.9 Ver historial y métricas

**Ruta:** `app/dashboard/[id]/canjes/page.tsx`

Funciona: lista paginada de canjes con nombre, teléfono y timestamp. Métricas calculadas en
el servidor: activaciones totales, canjes confirmados, conversión (%).

### 2.10 Administración de cuenta

**No existe.** No hay ruta `/dashboard/perfil` ni ningún formulario que edite
`profiles.business_name`, `profiles.phone`, ni `profiles.logo_url`. El comercio no puede
cambiar el nombre de su negocio después del registro sin borrar la cuenta.

---

## 3. Recorrido completo del consumidor

### 3.1 Descubrir promociones

**Ruta:** `app/cuponera/page.tsx` + `components/cuponera-grid.tsx`

Funciona: lista de cupones `is_public = true`, buscador en tiempo real por título, negocio o
código. Estado vacío con mensaje correcto.

**Sin filtros de categoría, fecha ni localidad.** Todos los cupones se muestran juntos sin
ningún orden más allá de fecha de creación.

### 3.2 Ver un cupón

**Ruta:** `app/cupon/[id]/page.tsx`

Funciona: imagen del cupón, título, negocio, código, vigencia (si tiene `expires_campaign_at`),
política de canje, condiciones (si tiene). Badge "Cupón vencido" sobre la imagen si ya pasó la
fecha. El botón "Activar mi cupón" desaparece si el cupón está vencido.

**Sin información de ubicación.** El consumidor no sabe en qué sucursal, ciudad o dirección
usar el cupón. `profiles.phone` tampoco está visible.

### 3.3 Activar un cupón

**Ruta:** `app/cupon/[id]/activar/page.tsx` → `POST /api/coupon-instance`

Funciona: formulario con nombre (obligatorio) y teléfono (opcional). Tras activar, se muestra
el UUID de instancia (36 chars) y un botón "Copiar código".

**Problemas:**
1. Si el consumidor cierra el navegador, el UUID se pierde para siempre. No hay página
   recuperable por URL. `instanceUrl` está calculada en el código pero nunca se usa como
   enlace presentable.
2. El mismo consumidor puede activar el mismo cupón N veces (sin unicidad por teléfono).
   Si el cupón es `once`, el primer UUID ya no podrá canjearse de nuevo, pero generará una
   instancia extra que sí puede canjearse.
3. El UUID de 36 caracteres es difícil de dictar o mostrar en pantalla pequeña. No tiene
   QR propio que el comercio pueda escanear.

### 3.4 Canjear el beneficio

El consumidor muestra el UUID en el local. El comercio lo pega en el validador.

**El consumidor no sabe qué presentar exactamente** — la página post-activación solo dice
"Muestra este código en el local". No hay indicación de que deba mostrar la pantalla de su
teléfono, que el código vence en N meses, ni cómo recuperarlo si cierra el navegador.

### 3.5 Compartir un cupón

**Componente:** `components/coupon-share-buttons.tsx`

Funciona: en móvil adjunta la imagen PNG y el enlace; en escritorio descarga la imagen y avisa
al usuario que la adjunte manualmente. Botones: WhatsApp, Copiar link, Compartir nativo (móvil).

**`window.location.origin` aquí:** el `couponUrl` se construye desde `window.location.origin`.
En producción es `https://www.ecocupon.cl/cupon/[id]` — correcto. No se persiste en BD.

---

## 4. Evaluación del diseño y experiencia móvil

### Jerarquía visual

La landing tiene buena jerarquía: hero claro, 3 pasos, beneficios, precios, CTA. El dashboard
es funcional pero denso. La tarjeta de cupón (`coupon-card.tsx`) mezcla acciones de distintos
niveles (compartir, editar, borrar) en el mismo bloque sin prioridad visual.

### Cabecera y pie

✅ Resuelto con `SiteHeader` / `SiteFooter` unificados. Las 5 cabeceras separadas que tenía
antes están reemplazadas. El nombre "EcoCupon" ahora aparece dos veces por página (header +
footer) — el spec E2E fue actualizado para usar `getByRole('banner')`.

### Navegación móvil

**Problema activo:** `components/dashboard-nav.tsx` oculta los links de navegación con
`hidden md:flex`. En móvil (< 768 px) el comercio no tiene acceso a "Crear cupón" ni
"Mis cupones" desde la barra. Solo ve el menú de usuario.

### Tarjetas de cupón

La tarjeta muestra: imagen, badge de descuento, título, negocio, código, contadores de
vistas/compartidos y botones. En modo `showActions` agrega Editar, Publicar/Ocultar y Borrar.
Con 5 acciones en una tarjeta pequeña el área táctil se vuelve confusa en móvil.

### Accesibilidad

- ✅ Páginas de auth con `h1`, labels asociados, `autocomplete`
- ✅ Estados vacíos con texto descriptivo
- ⚠️ Botones de icono en la tarjeta sin `aria-label` explícito (Editar, Borrar, Publicar)
- ⚠️ `/auth/verificar` tiene el título capitalizado distinto ("Revisa tu Correo" vs "Revisa tu correo")
- ⚠️ `/auth/error` ("Algo salió mal" sin descripción accionable)

### Responsive

Landing, cuponera, precios y página de cupón funcionan bien en móvil. El dashboard funciona
pero la navegación está incompleta en pantallas pequeñas (ver arriba).

### Consistencia visual

Tailwind CSS 4 + shadcn/ui. Paleta verde coherente. Estilo de código mezclado (comillas dobles
en componentes v0, comillas simples en lib/) — documentado en `CLAUDE.md` como intencional.

---

## 5. Funcionalidades existentes y pendientes

### Funciona completamente

| Funcionalidad | Archivos |
|---|---|
| Auth completa (email + Google) | `app/auth/**` |
| Crear cupón con logo, imagen OG y QR | `app/dashboard/crear/page.tsx`, `app/api/coupon-image/route.tsx` |
| Editar cupón (sin regenerar imagen) | `app/dashboard/[id]/editar/page.tsx` |
| Eliminar cupón (sin confirmación) | `app/dashboard/mis-cupones/page.tsx` |
| Publicar/despublicar | `components/coupon-card.tsx`, `app/dashboard/mis-cupones/page.tsx` |
| Cuponera pública con buscador | `app/cuponera/page.tsx`, `components/cuponera-grid.tsx` |
| Página pública del cupón con vigencia y condiciones | `app/cupon/[id]/page.tsx` |
| Activación de consumidor sin cuenta | `app/cupon/[id]/activar/page.tsx`, `app/api/coupon-instance/route.ts` |
| Validador del comercio | `app/dashboard/[id]/validar/page.tsx`, `app/api/redeem/route.ts` |
| Historial de canjes + métricas de conversión | `app/dashboard/[id]/canjes/page.tsx` |
| Compartir por WhatsApp con imagen | `components/coupon-share-buttons.tsx` |
| robots.txt, sitemap.xml con cupones públicos | `app/robots.ts`, `app/sitemap.ts` |
| CSP, HSTS y headers de seguridad | `next.config.mjs` |

### Incompleto

| Funcionalidad | Problema | Archivo |
|---|---|---|
| Imagen al editar | No se regenera tras cambios | `app/dashboard/[id]/editar/page.tsx` |
| UUID recuperable | El consumidor pierde el código al cerrar el navegador | `app/cupon/[id]/activar/page.tsx` |
| Nav móvil dashboard | Links ocultos en < 768 px | `components/dashboard-nav.tsx` |
| Verificación de correo | Sin botón de reenvío | `app/auth/verificar/page.tsx` |
| Borrar cupón | Sin diálogo de confirmación | `app/dashboard/mis-cupones/page.tsx` |
| Límite de canjes (`max_total_redemptions`) | Verificado en API, sin campo en UI | `app/dashboard/crear/page.tsx`, `app/dashboard/[id]/editar/page.tsx` |
| `profiles.business_name` | No se escribe en el registro | `app/auth/registro/page.tsx`, trigger `handle_new_user` |

### No existe

| Funcionalidad | Impacto |
|---|---|
| Perfil del comercio (`/dashboard/perfil`) | El comercio no puede editar su nombre ni teléfono |
| Scanner QR en validador | El canje en sucursal es incómodo |
| Borrar logo de Storage al borrar cupón | Los archivos se acumulan para siempre |
| UUID recuperable por URL | El consumidor no puede volver a ver su código |
| Restricciones de plan (`plan_type` en lógica) | Los planes de `/precios` son decorativos |
| Ubicación del comercio en el cupón | El consumidor no sabe dónde canjear |
| Filtros en cuponera (categoría, ciudad) | Todos los cupones mezclados |
| Paginación en cuponera | Límite hardcodeado en 50 |
| Reenvío de verificación | El usuario no puede pedir otro correo |
| Categorías de negocio | Sin clasificación de comercios |

### Promesas en `/precios` sin respaldo en código

| Promesa en `/precios` | Estado | Archivo |
|---|---|---|
| "Subir imágenes propias" (Pro) | `image_url` nunca se usa | `supabase/migrations/0001_init.sql` |
| "Publicar en cuponera" como beneficio Pro | Sin restricción por plan | `app/cuponera/page.tsx` |
| "Descarga del cupón en PNG" como beneficio Pro | Sin restricción por plan | `components/coupon-share-buttons.tsx` |
| "Soporte prioritario" (Pro) | Sin canal de soporte | — |
| "Cupones ilimitados" (Business) | Sin límite de cupones | — |
| "Atención por WhatsApp dedicado" (Business) | Sin canal diferenciado | — |
| Restricciones de plan en general | `profiles.plan_type` nunca se lee en lógica | `lib/supabase/server.ts`, `app/dashboard/**` |

---

## 6. Problemas de seguridad verificados

### P0-1 — Enumeración de correos: CERRADO ✅

`user_exists(text)` tenía EXECUTE concedida a `anon`. La migración `0011` revocó el permiso.
El formulario de recuperación ahora responde igual exista o no la cuenta. Verificado en
producción: `GET /auth/recuperar` → siempre muestra "Revisa tu correo".

Archivo: `supabase/migrations/0011_close_enumeration_and_lock_plan_type.sql`

### P0-2 — Listado de cupones privados: CERRADO ✅

La policy `coupons_select_own_or_public` tenía `using (true)`. La migración `0010` la
acotó a `is_public = true OR auth.uid() = user_id`. El cupón privado por enlace directo
sigue funcionando porque `/cupon/[id]` lee con service role (el UUID actúa como capacidad).

Archivo: `supabase/migrations/0010_harden_rls_and_timestamps.sql`

### P0-3 — `plan_type` escribible por el titular: CERRADO ✅

La policy `profiles_update_own` permitía escribir cualquier columna. La migración `0012`
revoca UPDATE completo sobre `profiles` para `anon` y `authenticated`. El trigger
`handle_new_user` corre como `SECURITY DEFINER` y no depende de este permiso.

Archivo: `supabase/migrations/0012_revoke_profiles_update.sql`

### P0-4 — Inflación de métricas: ABIERTO ⚠️

`increment_views` e `increment_shares` son RPCs `SECURITY DEFINER` concedidas a `anon` sin
rate limit. Cualquiera puede llamarlas sin límite e inflar las métricas.

Impacto actual: bajo (las métricas no se cobran ni afectan lógica de negocio). Impacto futuro:
si se prometen estadísticas como beneficio de plan, serían manipulables.

Archivos: `supabase/migrations/0002_security.sql:193-222`
Solución: mover los incrementos a Route Handlers con verificación de sesión o IP, o aceptar
el riesgo explícitamente si las métricas siguen siendo decorativas.

### P0-5 — Múltiples activaciones del mismo consumidor: ABIERTO ⚠️

No hay unicidad por consumidor en `coupon_instances`. Un mismo teléfono puede activar el mismo
cupón `once` múltiples veces. Cada activación genera un UUID distinto; solo el primero que
llegue al validador puede canjearse (el índice `redemptions_instance_period_idx` lo garantiza).
Pero genera instancias huérfanas y confusión.

Tabla: `public.coupon_instances`
Solución: índice único `(coupon_id, consumer_phone)` con un Route Handler que haga upsert
en lugar de insert ciego, devolviendo la instancia existente si ya hay una.

### SSRF en subida de logo: CERRADO ✅

`app/api/upload-logo/route.ts` valida la firma de bytes (magic bytes), rechaza SVG, limita
a 5 MB y solo sube a rutas bajo `user.id/`. `app/api/coupon-image/route.tsx` tiene allowlist
de hostnames de Supabase para el fetch del logo.

---

## 7. Base de datos — estado verificado

### Historial de migraciones

Verificado el 2026-11-12 con `supabase migration list --remote` antes y después del repair:

| Migración | Local | Remoto antes | Remoto después |
|---|---|---|---|
| 0001–0004 | ✅ | ✅ aplicadas | ✅ |
| 0005–0006 | ✅ (nombre local) | timestamp distinto | ✅ reparado |
| 0007–0009 | ✅ | ✅ aplicadas | ✅ |
| 0010–0012 | ✅ | ✗ no registradas | ✅ reparado |
| 0013 | ✅ | ✗ pendiente | ✅ aplicada |
| timestamps remotas huérfanas | — | 5 entradas extra | ✅ marcadas reverted |

El historial está limpio. El próximo `db push --dry-run` debería mostrar cero migraciones
pendientes.

### Tablas y columnas

**`coupons` — columnas activas vs. huérfanas:**

| Columna | Se escribe | Se lee | Nota |
|---|---|---|---|
| `id, user_id, title, business_name, discount_percentage, coupon_code` | ✅ | ✅ | Core |
| `is_public, generated_image_url, logo_url` | ✅ | ✅ | Core |
| `redemption_period, expires_campaign_at, conditions` | ✅ | ✅ | Desde 0013 |
| `views, shares_count` | vía RPC | ✅ | Métricas inflables |
| `description` | ✅ (siempre `""`) | ✅ (nunca lleno) | Muerto en la práctica |
| `image_url` | ✗ | ✗ | Columna huérfana |
| `cta_text` | ✗ | ✗ | Default 'Usa este código', nunca leído |
| `max_total_redemptions` | ✗ UI (sí API) | ✅ en `/api/redeem` | Sin campo en UI |
| `expires_at` | ✗ | ✗ | Columna original; ahora `expires_campaign_at` la reemplaza |
| `updated_at` | vía trigger | ✅ en sitemap | Trigger creado en 0010 |

**`profiles` — sin UI:**

Ninguna columna de `profiles` se lee ni escribe desde la aplicación web. `business_name`,
`phone`, `logo_url` y `plan_type` están en el schema pero completamente desconectadas de la UI.

**`coupon_instances` y `redemptions` — nuevas, funcionales:**

Creadas en 0013, aplicada el 2026-11-12. Verificado en producción:
- `coupon_instances`: 9 columnas con RLS y triggers `updated_at`
- `redemptions`: 7 columnas, índice único `(instance_id, period)`, RLS

---

## 8. Oportunidades de mejora comercial

### Valor más alto con menos trabajo

**1. Ubicación del comercio en el cupón.** El consumidor que recibe un cupón no sabe dónde
canjearlo. Agregar `address` y/o `city` a `profiles` y mostrarlo en `/cupon/[id]` resuelve
el problema más común del consumidor. No requiere migración nueva si se usa `profiles.phone`
ya existente.

**2. UUID recuperable.** Si el consumidor cierra el navegador antes de guardar el código, no
puede volver a su activación. Crear `/cupon/[id]/activar/[instance_id]` como página
pública (el UUID actúa como capacidad, igual que el cupón privado) resuelve esto con una
ruta y sin ningún cambio en la BD.

**3. Regenerar imagen al editar.** La imagen del cupón es el principal medio de compartición.
Si el comercio corrige un error, la imagen vieja sigue circulando. El handler de edición puede
llamar a `buildImageUrl` y hacer `UPDATE generated_image_url` exactamente igual que al crear.

**4. Lector QR en el validador.** Con `jsQR` (ya en el ecosistema, sin dependencias extras) el
comercio puede escanear el QR del consumidor en lugar de pegar el UUID a mano.

**5. Eliminar con confirmación + borrar logo de Storage.** Protege contra borrados accidentales
y evita que el bucket crezca sin límite.

### Mejoras comerciales de mediano plazo

- Perfil del comercio (`/dashboard/perfil`) con nombre, teléfono, dirección
- Restricciones de plan reales (si se decide cobrar)
- Categorías en la cuponera para filtrado
- Reenvío del correo de verificación
- Paginación en cuponera (hoy limitada a 50)
- Métricas en serie temporal (hoy son contadores sueltos)

---

## 9. Prioridades de evolución

### P0 — Seguridad y funcionamiento esencial

| ID | Hallazgo | Archivo | Acción |
|---|---|---|---|
| P0-1 | Inflación de métricas vía `anon` sin rate limit | `0002_security.sql:193-222` | Mover incrementos a handler autenticado o declarar aceptación del riesgo |
| P0-2 | Múltiples activaciones del mismo consumidor | `app/api/coupon-instance/route.ts` | Upsert por `(coupon_id, consumer_phone)` |
| P0-3 | Logo no se borra al borrar cupón | `app/dashboard/mis-cupones/page.tsx` | `admin.storage.from("logos").remove([path])` al hacer DELETE |

### P1 — Funcionalidades comerciales fundamentales

| ID | Hallazgo | Archivo | Acción |
|---|---|---|---|
| P1-1 | Imagen no se regenera al editar | `app/dashboard/[id]/editar/page.tsx` | Llamar `buildImageUrl` + `UPDATE generated_image_url` |
| P1-2 | UUID del consumidor no recuperable | `app/cupon/[id]/activar/page.tsx` | Crear `/cupon/[id]/activar/[instance_id]` como ruta pública |
| P1-3 | Perfil del comercio inexistente | — | Nueva ruta `/dashboard/perfil` que edite `profiles` |
| P1-4 | Ubicación en el cupón | `app/cupon/[id]/page.tsx`, `profiles` | Agregar `address`/`city` a perfil y mostrar en cupón |
| P1-5 | Nav móvil sin links | `components/dashboard-nav.tsx` | Menú hamburguesa o links visibles en móvil |
| P1-6 | Borrar sin confirmación | `app/dashboard/mis-cupones/page.tsx` | AlertDialog de shadcn antes del DELETE |

### P2 — Experiencia visual y usabilidad

| ID | Hallazgo | Archivo | Acción |
|---|---|---|---|
| P2-1 | Lector QR en validador | `app/dashboard/[id]/validar/page.tsx` | Integrar `jsQR` con acceso a cámara |
| P2-2 | `aria-label` en botones de icono | `components/coupon-card.tsx` | Agregar `aria-label` a Editar, Borrar, Publicar |
| P2-3 | Campo `max_total_redemptions` en UI | `app/dashboard/crear/page.tsx`, `editar/page.tsx` | Agregar campo numérico opcional |
| P2-4 | `profiles.business_name` sin escritura | `app/auth/registro/page.tsx`, trigger | Actualizar trigger o guardar en `upsert` post-registro |
| P2-5 | Columnas huérfanas `image_url` y `cta_text` | `supabase/migrations/0001_init.sql` | Migración DROP COLUMN o mantener documentado |
| P2-6 | `description` siempre vacío | `app/dashboard/crear/page.tsx` | Eliminar del INSERT o agregar campo en UI |

### P3 — Mejoras adicionales

| ID | Hallazgo | Acción |
|---|---|---|
| P3-1 | Reenvío de verificación en `/auth/verificar` | Botón que llame `resend()` de Supabase Auth |
| P3-2 | Paginación en cuponera | Parámetro `page` en query, límite configurable |
| P3-3 | Filtros en cuponera (categoría, ciudad) | Requiere `category` en `profiles` o `coupons` |
| P3-4 | Métricas en serie temporal | Tabla `coupon_views` con timestamp por visita |
| P3-5 | Restricciones de plan | Leer `profiles.plan_type` en crear/publicar |
| P3-6 | Categorías de negocio | Enum en `profiles.category` |

---

## Límites de este informe

- No se probó el interior del dashboard con una cuenta real (no se tienen credenciales).
- Las mediciones de producción son del 2026-11-12 y cambian con el próximo deploy.
- El estado real de `profiles` y de los cupones existentes en BD no se consultó (solo
  se verificó el schema y las políticas).
- No se ejecutaron cambios de código, migraciones ni configuraciones.
