# Modelo comercial de EcoCupon.cl: suscripciones, pagos y Smarter.RUT

* **Autor:** 4Time Repuestos
* **Fecha:** 2026-11-11
* **Método:** EGM `egm-brainstorm`, modo BRAINSTORM. Siete lentes Goldfish en
  contexto limpio y solo lectura (`egm-design`, `egm-codebase-details`,
  `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`,
  `egm-structural`, `egm-inventive-catalyst`). Ninguno vio esta conversación ni
  los hallazgos de los otros.
* **Estado:** borrador para revisión humana. **No autoriza implementación.**

## Overview

EcoCupon.cl es un SaaS chileno donde un comercio genera un cupón de descuento,
lo comparte por link o QR, y ve cuántas vistas y compartidos tuvo. Hoy el
producto cobra por un solo camino: un enlace a un checkout hospedado de Reveniu
en el plan Pro, a $9.990 al mes.

El concepto que se evaluó es dotar al producto de un modelo comercial real:
definir dos o tres planes con límites aplicados dentro del producto, cobrar por
una pasarela que confirme el pago por webhook y escriba el estado de la
suscripción, y decidir si el producto del repositorio `smarter.rut` (SmarterBOT)
entra como beneficio de un plan o se vende por separado.

Los siete revisores coincidieron en algo que reordena la conversación: **el
problema no es elegir pasarela ni fijar precios.** El producto no puede hoy
sostener ninguno de los dos, por tres razones independientes y verificadas en el
repositorio y en la base: no existe ninguna señal de que un cupón haya producido
una venta, el único campo donde podría vivir el estado de un plan lo puede
escribir su propio dueño, y la vía de migración del repositorio no está
operativa. Fijar precios antes de resolver eso es cotizar sobre supuestos.

## Analysis

### 1. La contradicción de fondo: se vende lo que no se entrega

El catálogo publica siete promesas y ninguna de las siete existe en el código
(`app/precios/page.tsx:20-64`, `app/page.tsx:227-261`):

| Promesa publicada | Estado verificado |
|---|---|
| «Generación básica con IA», «avanzada con IA», «IA premium y personalizada» | **No hay ninguna dependencia de IA.** `package.json` no incluye `openai`, `@ai-sdk/*`, `anthropic` ni equivalente. La imagen se compone de forma determinista con `next/og` + `qrcode` (`app/api/coupon-image/route.tsx`). |
| «50 cupones por mes» / «Cupones ilimitados» | Ningún límite se aplica en el código. Cualquier cuenta crea cupones sin tope. |
| «Estadísticas básicas» / «avanzadas» | Miden vistas y compartidos: contadores inflables, sin canje y sin conversión (ver §2). |
| «API de integración» | No existe. |
| «Dashboard multiusuario» | No existe: una cuenta es una persona. |
| «Soporte prioritario» / «dedicado 24/7» | Sin canal, sin SLA, sin registro. |
| «Marca de agua EcoCupon» como diferenciador del plan gratis | La marca de agua no se decide por plan en ninguna parte. |

Esto no es un problema de copy. La FAQ de `/precios:168` promete garantía de
devolución de 30 días y `/condiciones:81` dice que «las tarifas no son
reembolsables»; la portada dice que el plan gratis da 5 cupones por mes y
`/precios:21` dice 3. **Cobrar por algo que no se entrega, y hacerlo con un
contrato que se contradice a sí mismo, es exposición bajo la Ley 19.496**, no
solo un defecto de producto. Es el hallazgo que más lentes repitieron.

### 2. La contradicción que decide el modelo: no existe la venta

Ningún archivo del repositorio contiene un concepto de canje, redención o
validación. `grep` sobre `canje`, `redeem` y equivalentes no devuelve nada. El
producto mide dos cosas y ninguna sirve para cobrar:

- `views` y `shares_count` se incrementan por RPC invocables **sin sesión y sin
  límite de tasa** (`supabase/migrations/0002_security.sql:193-222`). El propio
  `0010_harden_rls_and_timestamps.sql:103-104` reconoce que son inflables.
- `increment_views` solo cuenta cupones públicos (`0002_security.sql:216-217`).
- `increment_shares` cuenta también cuando el propio dueño copia el link
  (`components/coupon-share-buttons.tsx:41-43`).
- `coupon_code` es **texto libre sin restricción de unicidad**: su único índice
  único es por usuario (`0002_security.sql:185-186`). El sitio vende «códigos
  únicos, rastreables». No lo son.

Consecuencia directa: **el comercio no puede saber si el cupón produjo una
venta, y EcoCupon no puede saberlo tampoco.** Un cupón que nadie canjea y un
cupón que genera cien ventas son indistinguibles. Eso significa que no existe
ninguna unidad de valor sobre la cual cobrar de forma defendible: ni «cupones
creados» (el costo marginal en reposo es una fila), ni «vistas» (inflables), ni
«compartidos» (inflables y autoinfligidos). El lente de catálogo inventivo
llevó esto a su forma límite: **la única unidad facturable honesta es un canje
confirmado por el comercio**, y esa unidad no existe en el producto.

### 3. El estado del plan no tiene dónde vivir sin ser falsificable

`profiles.plan_type text default 'free'` (`0001_init.sql:42`) es el único lugar
natural para el estado de una suscripción. Dos lentes llegaron por separado al
mismo bloqueante:

- No tiene `check`, ni enum, ni tabla de planes: admite cualquier cadena, y el
  vocabulario lo fijaría el primer lugar que escriba.
- La policy `profiles_update_own` (`0010:51-53`) da al titular de la fila
  `UPDATE ... using (auth.uid() = id)`. **Con la clave publicable que viaja al
  navegador, cualquier comercio autenticado puede darse el plan que quiera por
  API directa** (PostgREST). Esa policy ya está viva en la base, según
  `docs/designs/2026-11-11_DRIFT_REPORT.md:51`.
- `plan_type` no distingue `'pro'` de `'Pro'` ni de `'business'`, y las
  etiquetas publicadas tampoco forman un conjunto: `/precios` ofrece tres
  niveles y la portada dos.
- No hay segundo eje. Una suscripción necesita al menos dos: qué plan y en qué
  estado (al día, en gracia, impago, cancelado, en prueba). Una columna de texto
  sólo expresa el primero, y sin historial de transiciones.
- `profiles.id references auth.users on delete cascade` (`0001_init.sql:37`):
  borrar la cuenta borra el perfil y, con él, cualquier estado de suscripción.

**Un límite que lee `plan_type` desde el cliente es decorativo.** Cualquier
diseño que se apoye ahí hay que rehacerlo entero cuando se descubra, y se
descubrirá.

### 4. Quien ya pagó no está registrado en ninguna parte

El checkout es un `<a>` a `app.reveniu.com` con `target="_blank"`
(`app/precios/page.tsx:44,142`; mismo enlace en `app/page.tsx:269`), en
producción desde el commit inicial. En el repositorio no hay webhook, ni ruta,
ni dependencia de Reveniu; `app/api/` sólo contiene `coupon-image/route.tsx` y
`upload-logo/route.ts`. No hay URL de retorno ni identificador de correlación:
**el pago no deja ninguna clave que lo una con la fila del comercio.**

Por eso, el día que se enciendan límites, un comercio que hoy paga se trataría
como gratis. La pregunta «¿alguien ha pagado?» no se puede responder desde el
sistema: hay que abrir el panel de Reveniu y cruzar por correo o monto. Hoy la
base dice 5 perfiles y 0 con `plan_type` distinto de `free`.

### 5. La fase de despliegue está rota antes de empezar

El lente de migración fue el más duro, y con razón:

- `main` despliega solo y v0 puede hacer push directo a `main` (`CLAUDE.md:7-8`).
- Producción está **3 commits atrás** de `origin/main`
  (`DRIFT_REPORT.md:23-39`). Durante este rollout, «mergeado» no equivale a «en
  producción».
- El historial de migraciones está desincronizado: cinco aplicadas sin
  registrar, dos con versión timestamp en remoto
  (`docs/runbooks/migraciones-procedimiento.md:21-59`).
- Un `db push` nuevo se detendría re-ejecutando lo ya aplicado. Verificado:
  `0007_consolidate_coupon_image_column.sql:26-31` hace
  `drop column if exists generated_image_url` —que **hoy es la columna viva**—
  y luego falla al renombrar `image_url`, que ya no existe. La transacción
  revierte, pero el push se detiene ahí y **la migración nueva no se aplica**,
  con la aplicación ya desplegada leyendo un esquema que no existe.

La consecuencia práctica: cualquier modelo de planes que necesite esquema nuevo
aterriza sobre un repositorio que ya demostró que su esquema puede vivir fuera
de las migraciones. `0010:39-40` tuvo que versionar retroactivamente policies
que existían sólo en producción.

### 6. El costo dominante del sistema es anónimo y no está topado

`app/api/coupon-image/route.tsx:48` es un `GET` **sin sesión** que toma `title`,
`business`, `code`, `discount`, `logo` y `url` de la query string, es
`force-dynamic`, renderiza con `next/og` (Satori, intensivo en CPU) más
`QRCode.toDataURL`, y si hay logo descarga de Storage con `cache: "no-store"`.
Tiene allowlist de hosts para el logo (protección SSRF correcta), pero no tiene
cuota, ni autenticación, ni límite de tasa: cualquiera puede generar imágenes
arbitrarias —con QR a donde quiera— en el dominio del producto.

Y el costo escala con el número de **claves de caché distintas**, no con los
comercios: cada combinación de parámetros es un render nuevo. La unidad que se
vende («cupones por mes») no acota este costo. «Ilimitados» recae precisamente
sobre el recurso cuyo costo marginal real sí es ilimitado.

El segundo costo es la ruta pública: `app/cupon/[id]/page.tsx:12` es
`force-dynamic` con el comentario explícito de que `increment_views` debe correr
en cada visita. Cada vista es una lectura con service role, un `UPDATE` sobre la
misma fila y un `getUser()` del middleware (`lib/supabase/middleware.ts:43`). Un
cupón viral concentra todas las escrituras en una fila, y la ruta **no se puede
servir desde CDN justamente porque el diseño de la métrica lo impide**.

### 7. Observabilidad: el camino del dinero nacería ciego

No hay SDK de errores, ni logs estructurados, ni endpoint de salud. Los
`console.error` del proyecto no adjuntan id de cupón, id de usuario ni plan
(`app/cupon/[id]/page.tsx:48,60`, `app/dashboard/page.tsx:27`,
`app/cuponera/page.tsx:29`, `lib/supabase/admin.ts:32`, entre otros).
`@vercel/analytics` mide tráfico de navegador y sólo en producción
(`app/layout.tsx:53`).

Tres preguntas quedaron sin respuesta posible desde el sistema:

- **«Este comercio dice que pagó y no tiene acceso»**: indiagnosticable. No hay
  order id, ni timestamp de pago, ni estado consultable.
- **«¿El cobro está roto o nadie compra?»**: indistinguible. No existe contador
  de checkout iniciado del lado propio: el clic sale por un ancla externa.
- **«¿Se perdió un webhook?»**: indetectable sin un job de reconciliación contra
  la lista de suscripciones del proveedor, que nadie corre a las 3 AM.

Además hay degradaciones silenciosas que ya existen y que un operador leería mal:
si falta `SUPABASE_SERVICE_ROLE_KEY`, `warnIfNoServiceRole`
(`lib/supabase/admin.ts:30-35`) emite un `console.warn` y el código cae a RLS,
de modo que un cupón privado devuelve 404 sin distinguir «no existe», «RLS lo
negó» y «falta la clave».

### 8. El producto abierto por diseño: el drift report ya lo había encontrado

La policy `coupons_select_own_or_public` quedó en `using (true)`
(`0003_allow_public_coupon_links.sql:18-20`), y su propia justificación escrita
dice que los UUID son inguessables, «así que exponerlos por link es
efectivamente privado (no hay forma de enumerarlos)». **Esa premisa es falsa:**
con `using (true)` sobre PostgREST, un `select *` enumera la tabla entera,
incluidos los cupones privados. Se agrega a lo ya reportado en el drift report:
`0010` no está aplicada y la policy sigue viva.

### 9. Comparación de proveedores: Reveniu vs Mercado Pago

Verificado contra la documentación de Mercado Pago Chile (versión `.md`, no el
HTML): **sí ofrece suscripciones.** «Creas una suscripción a través de nuestra
API definiendo la frecuencia deseada, y compartes el enlace de pago... Después
del primer pago, los cobros siguientes ocurren automáticamente». Disponible en
CL; reintentos automáticos si un cobro es rechazado; frecuencia semanal, mensual
o anual; planes de suscripción con y sin plan asociado; webhooks con validación
por header `x-signature`, con preferencia explícita de webhooks sobre IPN y
soporte de `X-Idempotency-Key`; simulador de webhooks; tarjetas y cuentas de
prueba; cancelaciones y reembolsos; reportes de dinero.

Reveniu, verificado antes, ofrece el mismo conjunto: suscripciones, cobros
recurrentes, webhooks, reembolsos, sandbox y API REST.

**La conclusión incómoda es que la comparación de pasarelas no es la decisión
relevante.** El proyecto usa hoy una plataforma de suscripciones como si fuera
un link de pago. Las dos opciones cubren lo que se necesita; ninguna de las dos
arregla que el producto no sepa reconocer un pago ni que no exista canje.

**Límite de este apartado:** las **tarifas** de Mercado Pago Chile no se pudieron
extraer. Su centro de ayuda (`https://www.mercadopago.cl/ayuda/33399`) se
renderiza por JavaScript y no expone el contenido al fetch automatizado. No
entrego cifras de comisión estimadas: quedan como dato pendiente para quien
tenga acceso al panel.

### 10. Smarter.RUT no es un validador de RUT

`smarter.rut` (SmarterBOT) es un producto aparte de ERP y automatización sobre
Odoo, n8n, Chatwoot y WhatsApp Cloud API, con su propio Supabase y su propio
stack. **No ofrece servicio de validación de RUT**, pese al nombre. Tampoco está
referenciado en ningún archivo de este repositorio: el único rastro es una
mención de autoría de commit en `docs/designs/2026-11-09-auditoria-inicial.md:16`.

Si entra como beneficio de un plan, el entitlement tendría que concederse y
revocarse en un segundo sistema, sin identidad compartida y sin que una baja o
un reembolso se propague. WhatsApp Cloud API es un servicio facturado por
conversación: adjuntar ese costo variable a un plan de $9.990 cambia el signo de
la economía unitaria, y hoy nadie ha medido ese costo. Con 5 perfiles y 0 de
pago esto se decide gratis; con clientes pagando, se decide con reembolsos.

## Goals vs. Non-Goals

**Alcance propuesto** (sujeto a aprobación explícita; nada de esto está
autorizado):

* **In-Scope Goals:**
  * Definir el modelo comercial de EcoCupon: qué se cobra, por qué unidad, y a
    qué precio, con las cifras publicadas reconciliadas en una sola fuente.
  * Decidir el destino de `profiles.plan_type` y dónde vive el estado que
    concede derechos, con la condición de que no sea escribible por el titular
    de la cuenta.
  * Decidir el camino del pago: qué proveedor, cómo se confirma, dónde queda el
    registro, y cómo se reconcilia lo que ya se cobró sin registrar.
  * Decidir la relación con SmarterBOT: beneficio de plan, producto aparte, o
    canal. Con contrato explícito si hay relación.
  * Definir la unidad de valor medible. Si el modelo se apoya en uso, esa unidad
    debe existir antes que el precio.

* **Out-of-Scope Non-Goals:**
  * Implementación, migraciones, cambios de RLS, configuración de pasarelas,
    variables de entorno, dependencias, push o deploy. **No autorizados en esta
    etapa.**
  * Fijar precios definitivos antes de tener un costo medido y una unidad de
    valor defendible.
  * Rediseñar la cuponera o construir el lado de la demanda.
  * Cualquier promesa de IA mientras no exista integración de IA.

## Alternatives Weighed

Ninguna de estas alternativas fue rechazada por el autor: son las que los
revisores levantaron, con la objeción que cada una enfrenta. Se listan para que
`/egm-draft` las herede.

* **Suscripción mensual con límites por plan** (la hipótesis original). Objeción
  principal: cobra por una unidad que el producto no mide y sobre un estado que
  el cliente puede reescribir. Requiere resolver §2 y §3 antes de tener sentido.
* **Paquetes prepagados de cupones o créditos.** Ventaja: el proveedor de pagos
  es la única fuente de verdad, no hay estado de suscripción que reconciliar, ni
  webhook que pueda desordenarse. Objeción: no genera ingreso recurrente, y el
  costo dominante (renders de imagen) seguiría sin estar acotado por la unidad
  vendida.
* **Cobro por canje confirmado.** Es la unidad que sí corresponde al valor
  entregado y la única no inflable. Objeción: **requiere construir el canje**,
  que hoy no existe en ninguna parte, más un actor (el comercio) dispuesto a
  confirmarlo.
* **Escasez pagada: ubicación destacada en la cuponera.** Ventaja: se cobra por
  algo escaso y verificable, sin estado de suscripción. Objeción: la cuponera
  hoy es un mercado de dos lados con el lado de la demanda vacío; vender
  ubicación en una vitrina sin público no es vendible.
* **Servicio asistido** (campaña hecha a mano, precio alto, pocos clientes).
  Ventaja: ingreso inmediato sin construir nada; valida si alguien paga.
  Objeción: no escala y no es el producto que el repositorio describe.
* **Gratis por ahora, cobrar cuando exista canje.** Ventaja: elimina la
  exposición de §1 y compra tiempo. Objeción: exige quitar del sitio la promesa
  de cobro y las siete features inexistentes, que es trabajo real y visible.
* **SmarterBOT como beneficio de plan vs producto separado.** Los revisores
  plantearon que es una falsa dicotomía: la tercera vía es tratarlo como
  **canal** —un contrato de URL o de capacidad entre dos productos— en vez de
  como cláusula de marketing en una página.
* **Conservar `plan_type` como bandera manual vs eliminarlo.** Objeciones: si se
  conserva, hay que decidir si queda de solo lectura o se deprecia, y qué pasa
  con las 5 filas existentes (todas `free`); si se elimina, no rompe nada,
  porque hoy nadie lo lee ni lo escribe.
* **Marca de agua evaluada al crear vs al renderizar.** Si se evalúa al
  renderizar, una imagen ya descargada e impresa cambia sin aviso al cambiar de
  plan, y el CDN seguiría sirviendo la variante vieja hasta 7 días
  (`stale-while-revalidate=604800`) — la activación o la baja no serían ni
  inmediatas ni verificables. Al crear, el cupón queda como instantánea
  inmutable.

## Key Decisions & Staging for Next Steps

Decisiones que deben resolverse **antes** de cualquier especificación técnica, en
este orden. Las cuatro primeras son bloqueantes entre sí.

1. **Qué se cobra.** Sin una unidad de valor que el producto pueda medir, ningún
   precio es defendible y ningún límite es aplicable. La opción que sobrevivió
   mejor al escrutinio es el canje confirmado; la que requiere menos construcción
   es el prepago. Es una decisión de negocio, no técnica.
2. **Dónde vive el derecho de uso.** Debe quedar escrito que ningún dato que
   conceda cuota puede residir en una fila que su titular pueda escribir por
   PostgREST. Esto invalida `plan_type` tal como está.
3. **Qué se hace con lo ya prometido y lo ya cobrado.** Hay que decidir si el
   enlace de Reveniu se retira, se mantiene o se convierte en cobro real, y hay
   que reconciliar el panel de Reveniu contra las cuentas antes de encender
   cualquier límite. Además hay que quitar del sitio las siete features
   inexistentes: mientras estén publicadas, la exposición de §1 sigue viva.
4. **Qué relación tiene SmarterBOT con EcoCupon.** Beneficio, producto aparte o
   canal. Con contrato explícito si hay relación.
5. **Publicar los 3 commits de `main`** y reparar el historial de migraciones.
   Son precondiciones operativas, no parte del modelo comercial, pero sin ellas
   ningún cambio de esquema llega a producción de forma confiable.
6. **Reconciliar las tres fuentes de la oferta** (`/precios`, la portada, el
   panel de Reveniu) y resolver la contradicción de reembolso entre
   `app/precios/page.tsx:168` y `app/condiciones/page.tsx:81`. De ella depende
   todo camino de anulación y devolución del modelo.

**Entregables del brief original que siguen pendientes** (no se abordan en este
`concepts_brief.md`; corresponden a una etapa de análisis posterior a la
aprobación del modelo comercial): comparación económica detallada Reveniu vs
Mercado Pago con tarifas verificadas, análisis funcional completo de Smarter.RUT,
experiencia de contratación del comercio paso a paso, mapa conceptual de
planes/pagos/funcionalidades, y la recomendación estratégica final con
alternativas y consecuencias.

## Límites de este brief

- **No se implementó nada.** No hubo cambios de código, migraciones, RLS,
  pasarelas, variables de entorno, dependencias, push ni deploy. Sólo lectura de
  archivos, consultas SQL de solo lectura y `GET` a las documentaciones públicas
  de Mercado Pago.
- Los siete lentes reportaron. Cuatro de ellos fallaron en el primer intento por
  agotamiento de cuota del modelo gratuito y se relanzaron con éxito en un
  segundo despacho; este brief sintetiza los siete informes.
- La síntesis, la deduplicación y la verificación contra archivo y línea son del
  Elefante. Las afirmaciones de los revisores sobre el repositorio se
  verificaron una por una desde el contexto principal antes de escribirse aquí.
- Las **tarifas** de Mercado Pago Chile no se pudieron verificar (centro de ayuda
  renderizado por JavaScript). No se entregan cifras estimadas.
- No se verificaron las variables de entorno de Vercel, ni el panel de Reveniu,
  ni si alguien ha pagado alguna vez. La base dice 5 perfiles y 0 de pago.
- Los revisores no tienen shell ni red: no midieron QPS, consumo de Fluid
  Compute ni egress de Storage. Ninguna cifra en pesos o dólares de este brief es
  una medición.
