# Stage 7 — Critic Review (revisor `egm-design`)

**Documento revisado:** `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
**Estándar aplicable:** `feature-spec-standard` (vía `egm-review-loop`, subflow Critic Review)
**Alcance auditado:** documento completo (no se detectó split «## Detailed Implementation Plan», por lo que `FeatureRange` cubre todo el archivo).
**Revisor:** agente Goldfish `egm-design`, contexto limpio.
**Fecha:** 2026-11-09.

Recuento: **1 BLOQUEANTE · 6 IMPORTANTE · 3 MENOR · 1 OBSERVACIÓN**.

Contexto leído por mí para juzgar: `CLAUDE.md`, `package.json`, `proxy.ts`,
`next.config.mjs`, `lib/supabase/middleware.ts`, `lib/supabase/admin.ts`,
`lib/site-url.ts`, `app/` (cuponera, cupón, dashboard, auth, api), `components/`,
`supabase/migrations/0002`, `0003` y `0010`, `playwright.config.ts`, `e2e/`;
más los informes previos `docs/designs/2026-11-09-egm-analisis-estructural.md`,
`docs/designs/egm-review/zoom_out_report.md` y
`docs/designs/egm-review/comprehension_report.md` (para no repetir hallazgos ya
registrados).

--------------------------------------------------------------------------------

## BLOQUEANTE

### D7-01 — La CSP con nonce en `proxy.ts` no existe; el documento describe como vigente un diseño que fue implementado y descartado

**Ubicación:** línea 31 (intro); "Autenticación", líneas 231-235; "Despliegue e
integraciones", líneas 293-298; NFR Seguridad, líneas 360-367; Plan, ítem 4,
líneas 437-445.

**Qué está mal.** Cuatro secciones afirman que `proxy.ts` genera una CSP por
respuesta con nonce nuevo y que la CSP **no** está en `next.config.mjs`. Ninguna
de las dos cosas es cierta del repositorio:

* `proxy.ts` tiene 24 líneas y no contiene ninguna cabecera: sólo delega en
  `updateSession`. La cita `proxy.ts:40-52` apunta a líneas inexistentes.
* `lib/supabase/middleware.ts` sólo refresca la sesión; no construye respuestas
  con CSP.
* La CSP real vive en `next.config.mjs:47-61`, con `script-src 'self'
  'unsafe-inline'` — es decir, **sin nonce ni `strict-dynamic`**.
* `next.config.mjs:38-46` deja constancia de que la alternativa
  `nonce + 'strict-dynamic'` «se implementó y se DESCARTÓ con evidencia», porque
  `/`, `/precios`, `/auth/*`, `/condiciones` y `/privacidad` se prerenderizan y
  su HTML se genera en el build sin nonce.

**Por qué importa.** Este documento se declara, en su Overview, el mapa del
sistema «tal como está construido hoy» y la referencia de «un agente de IA que va
a modificarlo». (a) El estado real de seguridad queda invisible: `script-src`
conserva `'unsafe-inline'` y no hay un solo renglón del documento que lo diga, así
que nadie sabe que el endurecimiento prometido en `CLAUDE.md:85` sigue pendiente.
(b) El ítem 4 del plan manda «comprobar en un preview que las rutas estáticas no
pierden sus scripts por falta de nonce (si ocurre, hay que forzar render dinámico
o relajar la política)». Un agente que ejecute esa instrucción literalmente
reimplementará el mecanismo descartado y romperá la landing, las legales y los
flujos de auth en producción. (c) La NFR de Seguridad presenta como «riesgo no
verificado» algo que ya fue verificado y revertido, con lo que gasta el crédito de
atención del lector en un problema cerrado mientras oculta el abierto.
El mismo error arrastra a `2026-11-09-egm-analisis-estructural.md:151,156-164,287`,
que el propio `next.config.mjs` cita como fuente.

**Arreglo propuesto.** Reescribir las cuatro secciones y el ítem 4 para declarar
la CSP actual de `next.config.mjs` (`unsafe-inline` en `script-src`), y convertir
el nonce en decisión cerrada con su motivo de rechazo, no en tarea de preview.

**Evidencia:** `proxy.ts:1-24`; `lib/supabase/middleware.ts:11-59`;
`next.config.mjs:38-46` y `:47-61`; `git diff proxy.ts` (las únicas 4 líneas
añadidas son un comentario que remite a `next.config.mjs`).

*Nota de solapamiento:* `zoom_out_report.md` Z5-02 ya señaló el `includeSubDomains`
de la línea 292 (el código lo omite a propósito, `next.config.mjs:30-35`). Lo doy
por registrado; D7-01 es un defecto distinto y de mayor alcance.

--------------------------------------------------------------------------------

## IMPORTANTE

### D7-02 — La precondición de la clave de servicio no está en el plan, y las tres causas de fallo del enlace privado comparten un único síntoma: 404

**Ubicación:** Alternativa B, líneas 317-326; "Invariante de acceso", 218-223;
Plan ítem 1, 411-420; Plan ítem 3, 430-435; Verification Plan, 468-481.

**Qué está mal.** El mecanismo elegido depende de `SUPABASE_SERVICE_ROLE_KEY` en
el entorno que renderiza la página. `lib/supabase/admin.ts:19` devuelve `null` si
falta y `app/cupon/[id]/page.tsx:40` cae al cliente con RLS; entonces el cupón
privado no se lee y la página ejecuta `notFound()` en `page.tsx:51-53`. El mismo
`notFound()` se alcanza cuando la clave existe pero es inválida, cuando la
consulta falla por cualquier motivo (`page.tsx:46-49` sólo hace `console.error`) y
cuando Supabase está caído. **Los tres fallos y el caso «el cupón no existe» son
indistinguibles para el usuario.** La migración `0010` sí lo advierte y exige
verificar antes de aplicarla (`0010_harden_rls_and_timestamps.sql:15-17`), pero el
plan del documento no incluye ese paso como condición previa, y su mitigación
(ítem 3) sólo cubre el caso «clave ausente» con un `console.warn`.

**Por qué importa.** Consecuencia concreta: se aplica `0010`, la clave no está en
Production, y **todos los enlaces privados empiezan a devolver 404 sin un solo
error visible**, en la función que es el producto. El Verification Plan
comprueba el enlace privado *después* de aplicar, que es detectar, no prevenir.
Y como el 404 es también la respuesta legítima de «no existe», un operador no
puede diagnosticar sin leer logs de servidor.

**Arreglo propuesto.** Añadir al plan, *antes* del ítem 1, un paso bloqueante
«confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel Production» y separar en el
código los tres casos (fallo de lectura ≠ fila ausente), devolviendo un 500
explícito cuando la lectura falla.

**Evidencia:** `app/cupon/[id]/page.tsx:34-53`; `lib/supabase/admin.ts:19,30-36`;
`supabase/migrations/0010_harden_rls_and_timestamps.sql:15-17`.

### D7-03 — Alternativa viable y más barata no evaluada: lector de una fila por UUID con RPC `security definer`

**Ubicación:** "Alternatives Considered", líneas 306-352 (A, B, C, D, E).

**Qué está mal.** El documento evalúa cinco alternativas y omite la que este
repositorio ya usa de forma idiomática: una función `security definer` que
devuelva **una fila** por `uuid`. Da exactamente la misma semántica de capacidad
que la Alternativa B, con dos ventajas sobre ella: no introduce la service role en
el camino de la petición (mantiene a Postgres como único punto de autorización,
que es el invariante de acceso que el propio documento declara) y deja el control
en la base, donde se puede auditar y revocar sin desplegar código.

**Por qué importa.** El estándar aplicable exige que las alternativas viables se
hayan considerado y rechazado por motivos concretos. Aquí se elige la opción que
el propio documento reconoce peor («omite RLS por completo») frente a una que ya
existe en el proyecto, sin dejar escrito por qué. La consecuencia es deuda de
seguridad permanente: cada restricción futura de visibilidad habrá que duplicarla
en la ruta, porque RLS ya no la cubre.

**Arreglo propuesto.** Añadir esta opción como Alternativa F, con su coste (una
función más que mantener) y el motivo explícito por el que se prefiere B, o
adoptarla.

**Evidencia:** `supabase/migrations/0002_security.sql:193-218` (patrón
`security definer` + `set search_path` ya en uso para `increment_views` /
`increment_shares`); `supabase/migrations/0010_...sql:99-104` (mismo patrón de
exposición deliberada).

### D7-04 — `/api/coupon-image` se evalúa sólo como coste; es un renderizador abierto, sin autenticación, con contenido y URL de QR arbitrarios, y es lo que la base de datos persiste

**Ubicación:** "Generación de la imagen del cupón", líneas 249-266; NFR
Rendimiento, líneas 369-373; NFR Seguridad, 358-367.

**Qué está mal.** La ruta no exige sesión, toma `title`, `business`, `code`,
`discount`, `logo` y `url` de la query string, y responde con
`Cache-Control: public, max-age=86400, s-maxage=86400` (`route.tsx:202-209`).
No hay límite de tamaño de parámetros ni de frecuencia: cada combinación distinta
es un render nuevo que además queda cacheado en el CDN y servido desde el dominio
del producto. Y lo que se guarda en `coupons.generated_image_url` es la **URL de
ese endpoint vivo** (`app/dashboard/crear/page.tsx:29,112,128`), no un artefacto
inmutable. El documento la trata como coste («la ruta más cara por visita») y
nunca como superficie de abuso; la NFR de Seguridad enumera tres prioridades y no
la incluye.

**Por qué importa.** Cualquiera puede generar, en el dominio de EcoCupon, una
imagen de cupón con el comercio y el texto que quiera y un QR apuntando a donde
quiera: material de phishing alojado por el producto, y a la vez un consumo de
CPU y egreso sin techo. El ítem 7 del plan añade E2E para otras cosas; nada del
plan cubre esto.

**Arreglo propuesto.** Añadir esta superficie a la NFR de Seguridad con al menos
un límite por IP y longitud de parámetros, y decidir si la imagen debe persistirse
como objeto en Storage en vez de referenciarse por URL parametrizada.

**Evidencia:** `app/api/coupon-image/route.tsx:48-74,202-209`;
`app/dashboard/crear/page.tsx:29,103-139`; `app/cupon/[id]/page.tsx:92-97`.

### D7-05 — Los contadores, métrica central del producto, se presentan como invariantes neutrales y no como riesgo: son inflables y subcontados a la vez

**Ubicación:** tabla de funciones, líneas 204-212; Open Questions, líneas 81-84;
NFR Seguridad, 358-367.

**Qué está mal.** El documento describe `increment_views` («solo incrementa si
`is_public = true`») e `increment_shares` («incrementa sin filtrar por
visibilidad») como invariantes, sin señalarlos como problema. Ambas son
ejecutables por `anon` con `grant execute` (`0002_security.sql:221-222`) y no
comprueban existencia del cupón, propiedad ni frecuencia: cualquiera puede inflar
las métricas de un cupón concreto en bucle. En paralelo, los cupones privados
suman 0 vistas por diseño, así que el panel del comercio
(`app/dashboard/page.tsx:30-34`, que suma `views` y `shares_count`) mezcla
subconteo sistemático con sobreconteo arbitrario. La Open Question
correspondiente trata el subconteo como «decisión de producto» y nunca menciona el
sobreconteo.

**Por qué importa.** EcoCupon vende «ve cuántas veces se ven y se comparten». Si
la métrica no es confiable ni hacia abajo ni hacia arriba, el panel no tiene valor
y no hay forma de que el comercio lo note: los números son plausibles siempre.

**Arreglo propuesto.** Declarar la métrica como no confiable hasta que haya
límite por IP, y decidir explícitamente si las vistas de privados cuentan
(recomendado: sí, contando por id de cupón, ahora que la lectura ya está
autorizada).

**Evidencia:** `supabase/migrations/0002_security.sql:206-218,221-222`
(`increment_views` con `and is_public = true`); `app/cupon/[id]/page.tsx:57`;
`app/dashboard/page.tsx:30-34`; `components/coupon-share-buttons.tsx:24-32`.

### D7-06 — El procedimiento de rollback reabre la fuga y sus disparadores no cubren el fallo más probable

**Ubicación:** Verification Plan → Rollback, líneas 480-481.

**Qué está mal.** El rollback dice: «si `/cuponera` queda vacía o un cupón público
no abre, revertir la policy a `using (true)` con una migración nueva mientras se
diagnostica». Dos defectos: (a) revertir a `using (true)` restituye la
enumeración total de la tabla, es decir, deshace `0010` completo —el documento lo
sabe, porque es el «Cons» de la Alternativa A (líneas 310-313)— y no advierte que
es una medida temporal ni cómo se cierra después; (b) los dos disparadores
elegidos son fallos de cupones **públicos**, que son justamente los que no
dependen de la service role. El fallo probable de este diseño (enlaces privados
en 404 por clave ausente o consulta fallida, D7-02) no dispara el rollback: pasa
desapercibido mientras la tabla queda abierta.

**Por qué importa.** Un operador que siga el documento al pie puede reabrir el
riesgo que el cambio elimina, y por un síntoma que no era el suyo.

**Arreglo propuesto.** Declarar el rollback como temporal con criterio de cierre,
y añadir como disparador «un `/cupon/<uuid-privado>` devuelve 404» antes de
tocar la policy.

**Evidencia:** `supabase/migrations/0003_allow_public_coupon_links.sql:16-20`
(lo que el rollback restituye); `supabase/migrations/0010_...sql:32-36` (lo que
anula); `app/cupon/[id]/page.tsx:34-53`.

### D7-07 — El estado de la suite E2E está desactualizado y el gate `pnpm test:e2e` puede escribir en producción

**Ubicación:** "The Problem" punto 3, líneas 46-48; Plan ítem 7, líneas 461-467;
Verification Plan, línea 473.

**Qué está mal.** El documento afirma que «no hay red de pruebas» y que el único
control era el build. En el árbol de trabajo existen 16 especificaciones en `e2e/`
(`login-exitoso`, `persistencia-sesion`, `logout`, `crear-cupon`,
`contadores-vistas-compartidos`, etc.), cada una con su `test.skip`/`test.fixme`
condicionado a credenciales o autorización. El ítem 7 pide «ampliar la suite
existente» con exactamente los casos que ya tienen archivo: el trabajo que falta
no es escribirlos, es habilitarlos. Y `playwright.config.ts:3-6` declara que el
proyecto Supabase de `.env.local` es **producción**, mientras el Verification Plan
lista `pnpm test:e2e` como gate sin condición de entorno.

**Por qué importa.** Un agente que ejecute el ítem 7 duplicará especificaciones y
las pondrá en conflicto con las existentes; y quien ejecute el gate con
credenciales habilitadas puede crear usuarios y cupones en la base de producción.
El documento pide autorización para la cuenta de prueba pero no menciona el riesgo
de datos.

**Arreglo propuesto.** Reescribir el ítem 7 como «habilitar las specs existentes
con una cuenta autorizada contra un entorno no productivo» y hacer explícito el
destino de `PLAYWRIGHT_BASE_URL` en el Verification Plan.

**Evidencia:** `e2e/` (16 `*.spec.ts`, p. ej. `e2e/crear-cupon.spec.ts:6`,
`e2e/contadores-vistas-compartidos.spec.ts:7`); `e2e/README.md` (tablas de qué
corre sin credenciales y qué no); `playwright.config.ts:3-6,10-13,32-42`.

--------------------------------------------------------------------------------

## MENOR

### D7-08 — El ítem 3 del plan ya está implementado, y la afirmación «ningún archivo de este plan se ha modificado todavía» es falsa para él

**Ubicación:** línea 406-407 (intro del plan) y ítem 3, líneas 430-435.

**Qué está mal.** El ítem 3 (`app/cupon/[id]/page.tsx`, «Modify, opcional»,
registrar explícitamente cuando no hay `SUPABASE_SERVICE_ROLE_KEY`) ya está
hecho: `page.tsx:36-38` llama a `warnIfNoServiceRole` y
`lib/supabase/admin.ts:30-36` implementa la función con su mensaje. La cabecera
del plan dice que ningún archivo se ha modificado salvo los del informe final.

**Por qué importa.** El plan deja de ser fiable como lista de trabajo: un agente
puede «añadir» un segundo aviso, duplicar la lógica o reescribir el guard
existente.

**Arreglo propuesto.** Dar el ítem 3 por hecho con su evidencia y sacarlo de la
lista de trabajo pendiente.

**Evidencia:** `app/cupon/[id]/page.tsx:36-38`; `lib/supabase/admin.ts:26-36`.

### D7-09 — «La service role aparece en dos sitios y solo dos» omite el sitio que la usa para omitir RLS

**Ubicación:** "Invariante de acceso", líneas 218-223.

**Qué está mal.** El documento nombra `app/api/upload-logo/route.ts` y
`lib/supabase/admin.ts`. Cierto para *leer la clave*, pero el consumidor que
bypassea RLS es un tercer archivo: `app/cupon/[id]/page.tsx:4,34` importa y
ejecuta `createAdminClient()`. La enumeración incompleta debilita el propio
invariante que el párrafo establece («cualquier uso nuevo es una decisión
deliberada»), porque el uso actual ya no está contado.

**Por qué importa.** Es exactamente la lista que un revisor usaría para auditar
quién puede saltarse RLS; si está corta, el control deja de funcionar.

**Arreglo propuesto.** Enumerar los tres puntos de uso (dos de ellos leyendo la
clave, uno consumiéndola) y añadir que el tercero existe por el caso del enlace
privado.

**Evidencia:** `app/cupon/[id]/page.tsx:4,34`; búsqueda de
`process.env.SUPABASE_SERVICE_ROLE_KEY` en `app/`, `lib/` y `components/`:
sólo `app/api/upload-logo/route.ts:46` y `lib/supabase/admin.ts:17,31`.

### D7-10 — La URL compartida se construye con `window.location.origin`, contra el invariante de URL canónica que el documento declara

**Ubicación:** líneas 302-304 (SITE_URL).

**Qué está mal.** El documento declara que `lib/site-url.ts` es «la única fuente
de la URL canónica». El enlace que el usuario comparte por WhatsApp o portapapeles
se arma con `window.location.origin` (`coupon-share-buttons.tsx:18-20`). El valor
no se persiste, así que la regla de `CLAUDE.md:80-82` no se viola; pero un
compartido hecho desde un preview de Vercel o desde localhost divulga el host
equivocado, y el documento no menciona el caso.

**Por qué importa.** Es una vía silenciosa de propagar enlaces que no son de
producción, en la función central del producto (compartir), y contradice la
lectura literal del invariante.

**Arreglo propuesto.** Precisar que el invariante cubre valores persistidos y
decidir explícitamente el origen del enlace compartido.

**Evidencia:** `components/coupon-share-buttons.tsx:18-22,36,41`;
`lib/site-url.ts:1-10`; contraste con `app/dashboard/crear/page.tsx:6,128`, que sí
usa `SITE_URL`.

--------------------------------------------------------------------------------

## OBSERVACIÓN

### D7-11 — `expires_at` se lista como columna con contrato y ningún archivo la lee: no hay caducidad ni revocación en el diseño elegido

**Ubicación:** línea 199 (columnas de `coupons`); Alternativa C, líneas 328-336.

**Qué está mal.** `grep` de `expires_at` y `cta_text` sobre `app/`, `lib/` y
`components/` no devuelve ninguna coincidencia: no hay filtro de caducidad en
ninguna lectura. En la Alternativa B, además, el enlace por UUID es permanente
por construcción, y el documento sólo menciona la revocación como beneficio de la
Alternativa C descartada. No es un defecto del diseño actual, pero un documento
que promete «contratos e invariantes por componente» debería decir que esas dos
columnas son decorativas y que no existe mecanismo de caducidad.

**Por qué importa.** Un agente que lea el mapa asumirá que `expires_at` se respeta
en algún punto, y construirá sobre esa suposición.

**Arreglo propuesto.** Anotar junto a `expires_at` y `cta_text` que ningún
componente las lee, y declarar el riesgo residual «sin revocación» como aceptado.

**Evidencia:** `grep -rn "expires_at\|cta_text"` sobre `app/`, `lib/`,
`components/` sin resultados; `app/cupon/[id]/page.tsx:40-44` (la consulta no las
selecciona); `app/cuponera/page.tsx:13-18` (tampoco filtra por caducidad).

--------------------------------------------------------------------------------

## Lo que el documento hace bien (verificado por mí)

*   El **mapa de rutas** es correcto: los conteos de la tabla (líneas 177-190)
    coinciden con los archivos reales, y la distinción estática/dinámica que
    declara es coherente con el uso de cookies y con los dos `force-dynamic`
    explícitos (`app/cupon/[id]/page.tsx:12`,
    `app/api/coupon-image/route.tsx:6`).
*   La **Alternativa A se rechaza con un motivo correcto y verificable**: la policy
    de `0003_allow_public_coupon_links.sql:16-20` es literalmente `using (true)`
    y permite el listado anónimo completo.
*   **Elegir registrar el historial de migraciones en vez de reescribir las
    migraciones** (Alternativa E, líneas 346-352) es la decisión correcta, y la
    razón que da («dos entornos con el mismo nombre de archivo tendrían contenidos
    distintos») es exacta.
*   El **aislamiento del fallo de la imagen del cupón** respecto del alta
    (`app/dashboard/crear/page.tsx:130-139`) está descrito con precisión, incluida
    la consecuencia de que el cupón existe igual.
*   La descripción de **`upload-logo`** (líneas 268-283) es fiel al código:
    401/500/413, sniffing por bytes, SVG rechazado a propósito, ruta bajo
    `user.id` (`app/api/upload-logo/route.ts:46-97`).
*   Las citas internas de la capa de datos son correctas:
    `increment_views` filtra por `is_public = true`
    (`0002_security.sql:213-216`) e `increment_shares` no filtra
    (`:200-202`), tal como dice la tabla de las líneas 204-212.

## Límites de esta revisión

*   No ejecuté la aplicación, los tests, ni `next build`; no consulté la base de
    datos ni verifiqué el estado real de producción. Todo lo anterior es lectura
    de archivos.
*   No comprobé si existe un entorno de preview ni si la clave de servicio está
    configurada en Vercel: D7-02 se apoya en el código y en lo que `0010` exige,
    no en una observación de producción.
*   No verifiqué el número real de columnas de `profiles` ni el contenido de
    `0001_init.sql`, `0004` a `0009`; el documento los cita y no los puse en duda
    porque no afectan a ningún hallazgo.
*   Z5-02 (HSTS) y Z5-03 (caché de `/api/coupon-image`) ya están en
    `zoom_out_report.md`; no los repito como hallazgos propios.
