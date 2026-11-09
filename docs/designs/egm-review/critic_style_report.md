# Informe de estilo — egm-style (Stage 7 Critic Review)

- **Documento:** `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
- **Rango auditado:** documento completo (`FeatureRange` = 1..487)
- **Estándar aplicable:** `feature-spec-standard`
- **Fecha:** 2026-11-09

Modo REVIEW (auditoría de documento). Se audita claridad, precisión de lenguaje,
terminología, ambigüedad y verificabilidad de las afirmaciones contra el código
real del repositorio. No se proponen reescrituras ni cambios de contenido técnico.

**Recuento:** 1 BLOQUEANTE, 4 IMPORTANTE, 7 MENOR, 2 OBSERVACIÓN.

**Nota general de legibilidad:** el documento se lee bien: prosa directa, sin
marketing, sin relleno, con estructura de feature-spec (Problema, Goals/Non-Goals,
Arquitectura, Alternativas, NFR, Plan detallado). La mayoría de las referencias
archivo:línea que verificé resuelven correctamente (`sniffImage` en
`upload-logo/route.ts:13-43`, las 8 llamadas a `.from("coupons")`, el número de
WhatsApp en `precios/page.tsx:54`, la tabla de 18 rutas). Los defectos se
concentran en un racimo: las afirmaciones sobre **CSP y cabeceras** y dos
**citas misquote** que un lector nuevo no puede comprobar contra el árbol actual.

--------------------------------------------------------------------------------

## Y7-01 — BLOQUEANTE — La CSP no vive en `proxy.ts`

**Ubicación:** sección «Detailed Implementation Plan» → «4. `next.config.mjs` y
`proxy.ts`», línea 441; y sección «Despliegue e integraciones», línea 293.

**Cita textual (línea 441):** «la CSP con nonce por respuesta ya vive en
`proxy.ts:20-52`, fuera de `next.config.mjs`.»

**Cita textual (línea 293):** «CSP por respuesta en `proxy.ts:20-38`».

**Por qué es impreciso:** `proxy.ts` tiene **24 líneas** en el árbol actual y es un
envoltorio de tres líneas que delega en `updateSession`; no contiene ninguna CSP.
La CSP real está en `next.config.mjs:47-61`, y su `script-src` usa `'unsafe-inline'`,
no un nonce. El propio `proxy.ts:18-20` dice literalmente: «La CSP vive en
`next.config.mjs`, no aquí». Un lector nuevo o un agente que siga esta referencia
va a un archivo donde la afirmación no existe, y peor: `next.config.mjs:39-46`
documenta que la variante con nonce **se implementó y se DESCARTÓ con evidencia**.

**Lectura correcta:** la política vigente se define en `next.config.mjs`
(`Content-Security-Policy`, líneas 47-61) y **no** usa nonce; la sección 296-298
(«No se define en `next.config.mjs` a propósito: dos políticas simultáneas se
combinarían») invierte la realidad del archivo.

--------------------------------------------------------------------------------

## Y7-02 — IMPORTANTE — El mismo concepto (CSP y cabeceras) recibe tres rangos de líneas distintos

**Ubicación:** líneas 232, 293 y 441.

**Citas textuales:**
- Línea 232: «genera una CSP por respuesta con un nonce nuevo (`proxy.ts:40-52`)».
- Línea 293: «CSP por respuesta en `proxy.ts:20-38`».
- Línea 441: «`proxy.ts:20-52`».

**Por qué es ambiguo:** el documento cita tres rangos distintos para el mismo
mecanismo, y ninguno coincide con el archivo (24 líneas). Del mismo modo, las
cabeceras se citan como `next.config.mjs:10-29` (línea 290) y como
`next.config.mjs:21-24` (línea 440), cuando en el árbol real el bloque de
cabeceras va de la línea 15 a la 64 y HSTS está en la 30-35. Referencias
contradictorias entre sí impiden que el lector localice la fuente de verdad.

**Lectura correcta:** si se conserva la cita, debe ser una sola y verificable; hoy
no hay ninguna válida.

--------------------------------------------------------------------------------

## Y7-03 — IMPORTANTE — El valor de HSTS citado no coincide con el código

**Ubicación:** sección «Despliegue e integraciones», líneas 290-292.

**Cita textual:** «`Strict-Transport-Security` (`max-age=63072000;
includeSubDomains`)».

**Por qué es impreciso:** el código dice `value: "max-age=63072000"` **sin**
`includeSubDomains` (`next.config.mjs:31-34`), y el comentario inmediato explica
que se omitió a propósito: «Sin `includeSubDomains`: si algún subdominio no sirve
HTTPS, quedaría inaccesible». El documento afirma lo contrario de la decisión
documentada, lo que puede llevar a "corregir" el código en la dirección equivocada.

**Lectura correcta:** `max-age=63072000`, sin `includeSubDomains`, y esa omisión
es deliberada.

--------------------------------------------------------------------------------

## Y7-04 — IMPORTANTE — Misquote de `CLAUDE.md` invalida una Open Question

**Ubicación:** sección «Open Questions», líneas 91-93.

**Cita textual:** «`CLAUDE.md` declara `EGM artifact directory: docs/egm`, pero los
informes viven en `docs/designs/`. Una de las dos rutas está mal.»

**Por qué es impreciso:** `CLAUDE.md:96` dice `EGM artifact directory: docs/designs`.
No existe en el repositorio ninguna declaración `docs/egm`. Como `CLAUDE.md` y los
informes coinciden en `docs/designs`, la conclusión «Una de las dos rutas está mal»
es infundada: no hay conflicto que resolver. La Open Question introduce un
problema ficticio y atribuye a `CLAUDE.md` un texto que no contiene.

**Lectura correcta:** ambas fuentes apuntan a `docs/designs`; la Open Question
debería eliminarse (o reformularse si el problema real es otro).

--------------------------------------------------------------------------------

## Y7-05 — IMPORTANTE — Ambigüedad sobre si el «enlace privado» ya funciona o está pendiente

**Ubicación:** líneas 29-32, 83-84 y 430-436.

**Citas textuales:**
- Línea 29-32: «hay cambios en vuelo en el repositorio (... enlace privado resuelto ...)».
- Línea 83-84: «Con el enlace privado ya funcionando, ese contador queda a cero».
- Línea 430-436: «`app/cupon/[id]/page.tsx` (Modify, **opcional**) ... registrar de forma explícita cuando no hay `SUPABASE_SERVICE_ROLE_KEY` y se cae al cliente con RLS».

**Por qué es ambiguo:** el mismo hecho se describe a la vez como cambio «en vuelo»
(no confirmado), como ya funcionando, y como trabajo «opcional» pendiente con una
ruta de código de respaldo («se cae al cliente con RLS»). Un lector nuevo no puede
determinar si la Alternativa B ya se aplicó, está a medias, o no se aplicó. El
propietario de esa decisión queda sin nombre en el documento.

**Lectura correcta:** fijar un único estado («aplicado», «no aplicado») y, si está
a medias, decir explícitamente qué falta.

--------------------------------------------------------------------------------

## Y7-06 — MENOR — «Límite de fiabilidad» afirma un estado que el código refuta (CALIBRATE)

**Ubicación:** líneas 29-33.

**Cita textual:** «cambios en vuelo en el repositorio (... HSTS y CSP con nonce en
`proxy.ts`)».

**Por qué es impreciso:** enumera la «CSP con nonce en `proxy.ts`» como cambio en
vuelo, pero según `next.config.mjs:39-46` esa variante ya se probó y se descartó,
y el árbol actual no la contiene. Una cavea de fiabilidad que cita como pendiente
algo ya resuelto en sentido contrario confunde más que informa. Acción editorial:
`CALIBRATE` (acotar la afirmación al estado real) o `DROP` si no hay decisión de
lector asociada.

--------------------------------------------------------------------------------

## Y7-07 — MENOR — La tabla de rutas contradice a la CUJ 3 sobre el contador de vistas

**Ubicación:** tabla «Mapa de rutas», línea 183; contrasta con línea 125 y 83-84.

**Cita textual (tabla):** «`/cupon/[id]` | dinámica | no | Un cupón por UUID;
cuenta vistas».

**Por qué es ambiguo:** la CUJ 3 (línea 125) dice «Las vistas de ese cupón **no**
se cuentan (ver Open Questions)». La tabla presenta «cuenta vistas» como
comportamiento incondicional de la ruta; para un cupón privado es falso. Quien
implemente leyendo solo la tabla puede asumir un comportamiento que el producto
no tiene.

**Lectura correcta:** «cuenta vistas **de cupones públicos**» (o remitir a la
excepción de la CUJ 3).

--------------------------------------------------------------------------------

## Y7-08 — MENOR — Encabezados bilingües y frase «Rejected by author» sin evidencia enlazada

**Ubicación:** sección «Alternatives Considered», líneas 308-352.

**Citas textuales:** «**Reason for Rejection**: Rejected by author:» (A, C, D) frente
a «**Por qué se elige**» (B) y «**Por qué no se elige**» (E).

**Por qué es inconsistente:** dentro de la misma sección, el campo equivalente se
nombra «Reason for Rejection» en unas alternativas y «Por qué se elige / no se
elige» en otras; mezcla de registro EN/ES que rompe la comparabilidad entre
alternativas. Además, `feature-spec-standard` (Alternatives Rule) exige que el
rechazo se justifique con un trade-off concreto y prohíbe atribuirlo a un
mantenedor sin enlazar evidencia; «Rejected by author» nombra a un mantenedor sin
enlace, aunque en A/C/D sí acompaña un trade-off.

**Lectura correcta:** unificar el nombre del campo y sustituir «Rejected by author»
por el criterio técnico (p. ej. «Descartada por: enumerabilidad de la tabla»).

--------------------------------------------------------------------------------

## Y7-09 — MENOR — «clave publicable» no enlaza con el nombre real de la variable

**Ubicación:** sección «Capa de datos», líneas 218-223.

**Cita textual:** «el cliente de navegador (`lib/supabase/client.ts`) usa siempre la
clave publicable y depende de RLS».

**Por qué es impreciso:** el término «clave publicable» (publishable key) no
aparece en el repositorio ni en la lista de variables de entorno del propio
documento (línea 299-301), que declara `NEXT_PUBLIC_SUPABASE_ANON_KEY`. El lector
nuevo no puede mapear el concepto a la variable que verá en el código. Además, el
documento alterna «service role» (inglés) con «clave publicable» (español) para
los dos roles de credencial, sin simetría.

**Lectura correcta:** usar el nombre de la variable (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
o aclarar el mapeo; y nombrar ambos roles con el mismo criterio.

--------------------------------------------------------------------------------

## Y7-10 — MENOR — Juicio de calidad subjetivo sin criterio medible

**Ubicación:** sección «Non-Functional Requirements» → «Seguridad», línea 361.

**Cita textual:** «Cabeceras y CSP están en un estado razonable».

**Por qué es impreciso:** «estado razonable» es una valoración, no un hecho
comprobable; el estándar pide afirmaciones medibles o ligadas a una decisión del
lector. El mismo párrafo sí concreta el resto (HSTS presente, nonce, reservas),
así que la frase no añade señal.

**Lectura correcta:** suprimir el adjetivo («Cabeceras y CSP:» + los hechos
enumerados) o cambiarlo por el criterio objetivo que se usó.

--------------------------------------------------------------------------------

## Y7-11 — MENOR — Superlativo de coste afirmado antes de admitir que no está medido

**Ubicación:** sección «Non-Functional Requirements» → «Rendimiento y coste»,
línea 370.

**Cita textual:** «`/api/coupon-image` compone la imagen en cada petición
(`force-dynamic`) y descarga el logo de Storage: es la ruta más cara por visita».

**Por qué es impreciso:** «la ruta más cara por visita» es un comparativo de
rendimiento no medido; el propio párrafo lo desmiente dos frases después
(«**No verificado**: latencias y consumo reales en Vercel»). Acción editorial:
`CALIBRATE` — «la ruta con más trabajo por visita (composición + descarga); sin
medición de latencia/coste».

--------------------------------------------------------------------------------

## Y7-12 — MENOR — La cita de `increment_views` corta justo antes de la condición que describe

**Ubicación:** sección «Open Questions», línea 82.

**Cita textual:** «`increment_views` solo incrementa `where is_public = true`
(`supabase/migrations/0002_security.sql:206-215`)».

**Por qué es impreciso:** la función va de la línea 206 a la 218; la condición
`and is_public = true` está en la **216**, fuera del rango citado. El lector que
verifique en 206-215 no verá el filtro que la frase afirma.

**Lectura correcta:** `0002_security.sql:206-218`.

--------------------------------------------------------------------------------

## Y7-13 — OBSERVACIÓN — «Tres superficies» no concuerda con las rutas listadas

**Ubicación:** sección «Overview», líneas 12-14; contrasta con la tabla de 18
rutas (líneas 177-190).

**Cita textual:** «Tiene tres superficies: una landing comercial, una cuponera
pública ..., y un panel privado».

**Por qué puede confundir:** el mapa de rutas incluye `/precios`, `/auth/*` y las
páginas legales, que no encajan en las «tres superficies». No es contradictorio
(hace un agrupamiento de producto, no de rutas), pero conviene decir que son tres
áreas de producto, no tres grupos de rutas, para que el lector nuevo no las
enumere mal.

--------------------------------------------------------------------------------

## Y7-14 — OBSERVACIÓN — No hay inventario de buckets de Storage

**Ubicación:** diagrama «Vista general» (línea 166: «Storage (bucket logos)») y
Open Questions (línea 85-86: bucket privado `ecocupon`).

**Por qué es impreciso:** el documento nombra el bucket `logos` en el diagrama y
el bucket `ecocupon` solo aparece en Open Questions, sin que la «Capa de datos»
liste los buckets existentes. Un lector nuevo no tiene un inventario y puede
suponer que solo existe `logos`.

**Lectura correcta:** añadir (si se considera parte del alcance) la lista de
buckets reales junto a las tablas.

--------------------------------------------------------------------------------

## Verificación de referencias (muestra)

Comprobadas contra el árbol y correctas: `sniffImage` en
`app/api/upload-logo/route.ts:13-43`; «ocho llamadas a `.from("coupons")`» (8
exactas); número de WhatsApp `56912345678` en `app/precios/page.tsx:54`;
`increment_views` con `security definer` y `set search_path = public` en
`0002_security.sql`. Comprobadas y **no** válidas: las citas de `proxy.ts`
(Y7-01, Y7-02), el valor de HSTS (Y7-03) y la cita de `CLAUDE.md` (Y7-04).
