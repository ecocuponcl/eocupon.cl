# EcoCupon.cl — Evaluación integral

- **Fecha:** 2026-11-11
- **Alcance:** EcoCupon.cl como producto, negocio y unidad comercial.
- **Naturaleza:** análisis y diagnóstico. **No autoriza implementación.** No se modificó
  código, contenido, base de datos, pagos, dependencias ni infraestructura.
- **Método:** reutilización de trabajo previo verificado + medición del sitio en
  producción con Playwright (escritorio y móvil) + lectura del repositorio.
- **Estado de las herramientas:** ver §10. El workflow EGM no se ejecutó.

## Adenda — línea base: `main` frente a producción

Añadida tras la etapa 5 de `egm-review`
(`docs/designs/egm-review/2026-11-11-ecocupon-evaluacion-integral/zoom_out_report.md`),
que señaló con razón que **este documento mide producción y no distingue «sin
construir» de «sin desplegar»**. Varias secciones quedaron superadas por trabajo
posterior, ya en `main` y ya publicado.

| Sección | Estado |
|---|---|
| §5.4 registro sin etiquetas ni legales | **Resuelto**: tenía `id`, `name`, `autocomplete`, etiquetas y enlaces legales en `main`; se le añadieron `<h1>` y consentimiento. Publicado |
| §5.1, §5.2 hero con maqueta y sello de IA | **Resuelto**: el hero muestra un cupón real de 4Time Repuestos |
| §7.3 metadatos idénticos | **Resuelto y desplegado**: cada página tiene los suyos |
| §8 filas 1, 2, 4 (IA, marca de agua, «cientos») | **Retiradas** del sitio |
| §7.2 desbordamiento móvil | **Resuelto** en `main` y desplegado; ya no se reproduce |
| §7.4 buscador inerte de la cuponera | **Resuelto**: filtra en vivo |
| §5.7 error de hidratación #418 | **Resuelto**: causa localizada y corregida |
| §3.1 de `…revision-base-datos.md`, cupones privados legibles por `anon` | **Cerrado**: se aplicó `0010` y se verificó ejecutando como `anon` (de 3 privados expuestos a 0) |

**Lo que sigue vigente sin cambios:** la ausencia de demanda medida (§1), la
pregunta sin responder sobre si alguna vez se intentó vender (§1 y §11.1), las
promesas que quedan en `/precios` sobre Business, y todo lo que depende de datos
que no tengo (login, dashboard, subida de logo).

**Lo que este informe sobreestima, según el revisor:** §2, §3 y §4 diseñan
facturación recurrente completa para un producto con cero ventas, y §2.2 elige la
unidad de cobro por costo de consulta y no por valor entregado. Ambas objeciones
se aceptan: ese material debería vivir en un documento aparte, y la unidad
recomendada queda como hipótesis hasta que exista un comprador.

## Cómo leer este informe

| Etiqueta | Significado |
|---|---|
| **[HV]** | Hecho verificado, con archivo:línea o medición |
| **[HC]** | Hipótesis comercial, sin evidencia todavía |
| **[OR]** | Opinión del analista |
| **[DP]** | Decisión que solo puede tomar el propietario |

---

## 1. Resumen ejecutivo

**El problema de EcoCupon no es el modelo de cobro. Es que nadie ha comprado nunca
nada, y que el sitio promete cosas que el producto no hace.** `[HV]` + `[OR]`

La evidencia, medida hoy:

- **Cero ventas**, confirmado por el propietario. `[HV]`
- **5 cuentas y 4 cupones**, de los cuales **1 es público** — y ese único cupón
  público es un artefacto de prueba: negocio «www.tienda.co», título «maquina»,
  código `ERP50%`, 20% de descuento. **La vitrina pública del producto contiene
  exactamente un cupón de prueba.** `[HV]`
- **El registro pide correo y contraseña sin un solo enlace a privacidad o
  condiciones**, y sus tres campos no tienen `id`, `name`, `autocomplete` ni
  etiqueta asociada: solo `placeholder`. `[HV]`
- **La portada se desborda horizontalmente en móvil**: 417px de contenido en una
  pantalla de 390px. La cuponera, 405px. `[HV]`
- **La página pública del cupón —el objeto que el comercio le manda a su
  cliente— lanza un error de hidratación de React (#418) en producción.** `[HV]`
- **Ocho promesas publicadas no tienen producto detrás**, entre ellas la IA y el
  «Sin marca de agua» del plan Pro. `[HV]`

**Conclusión central.** Discutir qué unidad facturar es prematuro: no hay demanda
medida ni percepción de valor, y hay exposición comercial activa. El orden correcto
es (1) retirar lo falso, (2) arreglar la puerta de entrada, (3) vender a mano lo
que ya existe, y solo después (4) decidir la forma del precio. `[OR]`

**La forma de precio recomendada, cuando toque decidirla:** suscripción de acceso
con límite de cupones por mes — la única unidad que el sistema ya mide con
exactitud y que el sitio ya vende en texto. `[HC]`

---

## 2. Modelo comercial recomendado

### 2.1 Qué se vende hoy, verificado

No es una lista de deseos: es lo que el código hace y la producción muestra. `[HV]`

1. Crear un cupón con código, título, descuento y vencimiento.
2. Subir un logo, validado por **firma de bytes** (rechaza SVG) y con límite de 5 MB.
3. Generar una **imagen PNG del cupón con QR descargable**, servida desde
   `/api/coupon-image` y cacheada 24 h.
4. Publicar el cupón en una página pública con UUID, con botones de WhatsApp,
   copiar enlace y compartir.
5. Ver contadores de **vistas** y **compartidos**.
6. Publicarlo en la cuponera (mecánicamente funciona; de valor, hoy no: §7.4).

Eso es un producto real y acotado: **«una oferta con imagen, enlace y QR, sin
diseñar nada»**. No es poco. `[OR]`

### 2.2 El modelo

**Acceso + límite de consumo, con asistencia humana en el tramo alto.** `[OR]`

Por qué esa forma y no otra:

| Modelo | ¿Se puede construir hoy sin medir canjes? | Veredicto |
|---|---|---|
| Por resultado (canje) | No: exige un sistema nuevo y el que paga reporta el evento | **Descartar** |
| Acceso plano | Sí, pero no acota el costo por render ni distingue uso | Insuficiente |
| **Acceso + cupones/mes** | **Sí: `coupons.user_id` + `created_at` ya son exactos** | **Recomendado** |
| Prepago de créditos | Sí, y acota el costo de imagen | Complemento útil |
| Licencia blanca | No depende de nada de esto | Alternativa paralela |

La unidad de cobro no es una decisión moral sobre la honestidad: es una
consecuencia de la forma del precio. Elegida la forma «acceso con cupo», la unidad
aparece sola y ya está en la base. `[OR]`

### 2.3 Qué NO hacer todavía

- **No construir canjes.** Resuelve un problema que el negocio no tiene. `[OR]`
- **No elegir pasarela antes de verificar tarifas.** `[OR]`
- **No prometer transferencia bancaria** mientras el cobro se anuncie como mensual
  automático: son incompatibles. `[HV]`
- **No vender el plan Business con las features actuales.** `[DP]`

---

## 3. Propuesta de suscripciones

Diseño recomendado. Los precios **no** se fijan aquí: `[DP]`

### Gratis — entrada y prueba

- **A quién:** comercio que quiere ver si el resultado le sirve.
- **Qué incluye:** cupones con código, imagen con QR, enlace público, compartir.
- **Límite:** N cupones por mes, contados por el servidor. **Hoy no existe ningún
  límite en el código** y el sitio publica dos cifras distintas (§8.3). `[HV]`
- **Marca de agua:** sí, explícita y honesta.
- **Motivo de upgrade:** pasar el cupo mensual.

### Pro — uso comercial recurrente

- **A quién:** comercio que publica promociones todas las semanas.
- **Qué incluye:** cupo mayor, sin marca de agua, publicación en cuponera,
  estadísticas de vistas y compartidos.
- **Requisito técnico:** que la marca de agua dependa de un estado de plan real.
  Hoy se estampa siempre y `plan_type` no se lee en ninguna parte. `[HV]`
- **Motivo de permanencia:** el cupo se renueva y las promociones anteriores
  siguen publicadas.

### Business — asistido, no autoservicio

- **A quién:** quien necesita varias personas trabajando y acompañamiento.
- **Realidad:** no existe multiusuario, ni API, ni soporte 24/7, ni branding
  custom. Las cuatro están publicadas y ninguna está construida. `[HV]`
- **Recomendación:** mantenerlo como **venta asistida** (el canal de WhatsApp que
  ya usa) con una promesa honesta: cupo alto + acompañamiento humano. `[HC]`
- **Riesgo:** cada feature falsa del plan Business es una promesa contractual.

### Mecánica de suscripción (requisitos, no implementación)

| Pieza | Requisito comercial |
|---|---|
| Prueba | 7–14 días sin tarjeta, o sin prueba si se vende asistido |
| Upgrade | inmediato, con prorrateo |
| Downgrade | al final del período, nunca retroactivo |
| Cancelación | autoservicio, sin llamada |
| Impago | 3 reintentos + 7 días de gracia antes de degradar |
| Renovación | aviso previo por correo |
| Reembolso | política única; hoy `/precios` y `/condiciones` se contradicen (§8.6) |
| Recuperación | correo de recuperación a los 7 y 21 días |

**Fijar primero el período de gracia, después el precio.** Sin dunning definido, un
cobro mensual de bajo ticket produce más soporte que ingreso. `[OR]`

---

## 4. Requisitos de pagos

Antes de elegir proveedor, la pasarela debe cumplir: `[OR]`

1. **Suscripción recurrente nativa**, no cobro único repetido a mano.
2. **Webhook idempotente** para alta, cobro, fallo y cancelación.
3. **Clave de conciliación determinista**: hoy `profiles.email` existe y el trigger
   `handle_new_user` la puebla, así que sirve de unión. Falta un identificador
   propio emitido al crear la suscripción. `[HV]`
4. **Documento tributario chileno** (boleta o factura) automático.
5. **Tarifa compatible con un ticket de $9.990.** No verificada: pendiente. `[DP]`
6. **Checkout con la misma marca**, no un salto a `app.reveniu.com`. Hoy el pago
   ocurre fuera del sitio, justo en el momento de decidir (§5.5). `[HV]`
7. **Estado de plan escrito por el webhook**, no por el navegador.
8. **Cancelación y downgrade** sin intervención humana.

**Comparación de pasarelas: no ejecutada.** Requiere verificar tarifas vigentes y
capacidad de documento tributario. Sin ese dato, elegir es adivinar. `[DP]`

---

## 5. Evaluación de diseño y experiencia

### 5.1 La portada vende una interfaz, no un cupón

El bloque principal muestra una **maqueta de navegador** con tres círculos y barras
grises (`app/page.tsx:82-121`), y un sello «Potenciado por Inteligencia Artificial»
(`app/page.tsx:55-58`). El comerciante no ve un cupón: ve una app vacía. Y el sello
es falso — la imagen se genera de forma determinista, sin IA. `[HV]` + `[OR]`

**Lo más «producto» que tiene el sitio es el PNG generado**: descuento, código
monoespaciado y QR. Eso debería estar en el primer pantallazo. `[OR]`

### 5.2 Jerarquía invertida

Orden actual: sello IA → titular → maqueta → 3 pasos → 6 beneficios → precios →
recién al final, el problema del comercio (`app/page.tsx:284-288`). El ojo aterriza
en una promesa falsa antes que en el trabajo que el producto resuelve. `[HV]`

### 5.3 Cinco cabeceras distintas, cinco logos distintos

Cada página escribe su propia cabecera: logo de 40×40 y `text-xl` en la portada,
32×32 y `rounded-lg` en `/precios`, 36×36 en las páginas legales, y en la página
del cupón ni siquiera es fija. Pies también distintos; «Contacto» apunta a `#`
(`app/page.tsx:312`); el copyright dice **2024** en un producto de 2026. `[HV]`

Un comercio que compara dos pantallas ve dos productos. `[OR]`

### 5.4 El registro se ve como un formulario incompleto

Medido en producción, `/auth/registro`: `[HV]`

- Tres campos (`text`, `email`, `password`) **sin `id`, sin `name`, sin
  `autocomplete`, sin `aria-label` y sin etiqueta asociada**. Solo `placeholder`.
- **Sin `<h1>`** en la página.
- **Sin enlaces a `/condiciones` ni `/privacidad`** en el formulario.
- Botón «Crear cuenta» de 36px de alto.

Consecuencias concretas: el gestor de contraseñas no autocompleta, el lector de
pantalla anuncia «campo de edición» sin decir qué pide, y en Chile se están
pidiendo datos personales sin ofrecer la política al lado. `[OR]`

### 5.5 El pago salta de marca

El CTA de Pro abre
`https://app.reveniu.com/checkout-custom-link/xKK23b48El4xxc6ANca8FfyMlHq43P0N`
(`app/precios/page.tsx:44`). Es decir: en el pago, que es donde el comerciante
decide si confía, el sitio cambia de dominio y de identidad visual. `[HV]`

El plan Business ni siquiera tiene pasarela: abre un `wa.me`
(`app/precios/page.tsx:61-62`). Ese canal existe y **nunca ha convertido**; es una
venta asistida disponible, no un canal probado. `[HV]`

### 5.6 Contraste y objetivos táctiles

No pude calcular ratios de contraste con herramientas de accesibilidad: los agentes
especializados no se ejecutaron (§10). Lo que sí está medido:

- **19 objetivos táctiles por debajo de 44×44px** en la portada móvil, incluidos
  todos los CTA principales (32–40px). En `/precios`, los seis botones miden entre
  32 y 38px. `[HV]`
- Dos «botones» son en realidad enlaces de texto de **21px de alto**
  («Comenzar gratis», «Suscribirse») dentro de las tarjetas de precio. `[HV]`

### 5.7 La página pública del cupón falla en el navegador

En `/cupon/7884f3be-…` la consola registra **React error #418** (fallo de
hidratación: el HTML del servidor no coincide con el del cliente). Es la página que
el comercio le manda a sus clientes. `[HV]`

---

## 6. Resultados de las evaluaciones de diseño disponibles

**Ningún plugin de diseño está instalado.** El entorno tiene solo dos plugins:
Playwright y EGM. «Taste», «UI Design Review», «Web Design Guidelines» y «Awesome
Design» existen como fichas de marketplace, no como paquetes activos. No se
instaló nada, por no haber autorización. Se usó lo único real disponible: un agente
de revisión de interfaz y la medición directa del sitio. `[HV]`

### 6.1 Revisión de interfaz (agente `UI Finish-Gate Reviewer`) — ejecutada

**Decisión: HOLD.** Su veredicto: la portada no muestra un solo cupón real; muestra
un wireframe. Hallazgos principales:

- El sello de IA en el hero es el cliché número uno de landing generada **y además
  es falso** (`app/api/coupon-image/route.tsx:4` dice «sin IA externa»).
- El H1 «Crea cupones de descuento irresistibles» no dice nada de Chile ni del
  rubro.
- Rejilla de seis beneficios intercambiable con cualquier SaaS; «Rápido y simple»
  es relleno literal.
- Cero señal local: ninguna comuna, ningún CLP, ninguna referencia a boleta.
- Pro y Business se ven idénticos salvo icono; lo que los separa no existe.
- `/precios` está escrito **sistemáticamente sin tildes** mientras la portada sí
  las usa: es un pase descuidado, no una decisión de estilo.
- Único contacto del sitio: un Gmail. Sin teléfono, sin razón social, sin RUT.
- Buscador de la cuponera muerto: `Input` sin handler y `Button` sin acción.

**Lo que conserva:** la imagen del cupón tiene estructura propia y es lo más
producto del sitio; los estados vacíos y de error están bien resueltos y en
español; `/condiciones` es la vista que más parece de una empresa real.

### 6.2 Accesibilidad — **no ejecutada por agente**

Los dos intentos de despachar un auditor de accesibilidad fallaron por cuota de la
cuenta (HTTP 429 y luego 402), no por el trabajo. Lo que sigue es medición directa
mía, acotada a lo observable: ver §5.4 y §5.6. **Los ratios de contraste de los
tokens de color no se calcularon.** `[HV]`

### 6.3 Diseño de recorrido comercial — **no ejecutado por agente**

Mismo motivo. Reemplazado por el análisis propio del embudo en §5 y §9. `[HV]`

---

## 7. Hallazgos de Playwright, escritorio y móvil

Medición del 2026-11-11 contra `https://www.ecocupon.cl`.

### 7.1 Escritorio (1440×900)

| Página | Estado |
|---|---|
| `/` | Renderiza completa. Hero con maqueta y sello IA. Sin cupón real visible |
| `/precios` | Tres planes, seis CTA bajo 44px, tildes ausentes |
| `/auth/registro` | Formulario de 3 campos; sin etiquetas, sin legales, sin `h1` |
| `/cuponera` | **1 cupón** |
| `/cupon/[id]` | Renderiza; **error de hidratación** en consola |

**[HV]**

### 7.2 Móvil (390×844)

| Página | Desbordamiento horizontal | Objetivos < 44px |
|---|---|---|
| `/` | **417 px** (27 px de exceso) | 19 |
| `/precios` | no | 6 de 6 |
| `/cuponera` | **405 px** (15 px de exceso) | — |
| `/auth/registro` | no | 1 de 1 |
| `/cupon/[id]` | no | — |

El desbordamiento móvil de la portada es el hallazgo más visible: en un teléfono,
la primera impresión del producto es una página que se mueve de lado. `[HV]`

### 7.3 Metadatos idénticos en todas las páginas

El `<title>` de `/`, `/precios`, `/cuponera`, `/auth/registro` y `/cupon/[id]` es
el mismo: **«EcoCupon - Genera cupones de descuento con IA»**. `[HV]`

Esto confirma que **producción está por detrás del repositorio**: el commit de SEO
con metadata por página existe en `main` y no está desplegado. También explica por
qué el sitio sigue publicando «con IA» en el único texto que Google indexa.
`[HV]` + `[DP]`

### 7.4 La cuponera contiene un cupón de prueba

El único cupón público es `ERP50%`, negocio «www.tienda.co», título «maquina»,
20% de descuento, del 14 de julio. El buscador tiene placeholder pero **no tiene
`name`, ni `id`, ni etiqueta, ni manejador de evento**. `[HV]`

Consecuencia comercial: **vender «publicar en la cuponera» como beneficio del plan
Pro es vender espacio en una vitrina que hoy tiene un cupón de prueba y un buscador
que no busca.** `[OR]`

### 7.5 La página del cupón es el activo y está a medio terminar

Muestra bien el descuento, el código y los botones de compartir. Pero: el título de
la pestaña es genérico, el `alt` de la imagen es «maquina», lleva el sello «Cupón
creado con EcoCupon» y falla la hidratación. `[HV]`

---

## 8. Contradicciones entre marketing y producto real

Cada fila es verificable y cada una es una promesa que un comercio puede comprobar
en cinco minutos. `[HV]`

| # | Lo que dice el sitio | Lo que hace el producto |
|---|---|---|
| 1 | «Generación con IA» en portada, precios, metadatos y términos | No existe ninguna integración de IA |
| 2 | «Sin marca de agua» en Pro (`app/page.tsx:257`) | La marca se estampa siempre, ignore el plan |
| 3 | «3 cupones por mes» gratis (`precios:21`) | La portada dice «5 cupones por mes» y ningún código limita |
| 4 | «Únete a cientos de negocios» | 5 cuentas en total |
| 5 | «50 cupones por mes» en Pro (`precios:36`) | La portada dice «Cupones ilimitados» |
| 6 | «Garantía de devolución de 30 días» | «Las tarifas no son reembolsables» en los términos |
| 7 | «Los cambios se aplican inmediatamente» | Nada lee `plan_type`: pagar no cambia nada |
| 8 | Business con API, multiusuario, 24/7 y branding custom | Ninguna de las cuatro existe |
| 9 | «Publicar en cuponera» como beneficio | La cuponera tiene 1 cupón de prueba |
| 10 | FAQ: «transferencia bancaria vía Reveniu» | Incompatible con cobro recurrente automático |

**Riesgo legal.** Las promesas 1, 2, 3, 6 y 8 están también en los **términos y
condiciones**, que es un documento contractual. Que nadie haya pagado todavía no
las vuelve inocuas: vuelve el problema barato de arreglar **ahora** y caro después
de la primera venta. `[OR]`

---

## 9. Oportunidades priorizadas

Ordenadas por relación entre valor y esfuerzo. Ninguna requiere permiso técnico
más allá de editar texto, salvo donde se indica.

### P0 — Cerrar la exposición (texto, horas)

1. Retirar «IA» de portada, precios, metadatos y términos. `[DP]`
2. Quitar «Sin marca de agua» del Pro o implementar el plan real. `[DP]`
3. Unificar el cupo gratis en una cifra y aplicarlo en código, o dejar de
   publicarlo. `[DP]`
4. Quitar «cientos de negocios», «API», «multiusuario», «24/7», «branding custom».
5. Resolver la contradicción reembolso sí / reembolso no. `[DP]`

### P1 — Arreglar la puerta de entrada (días)

6. Etiquetas accesibles y `autocomplete` en el registro; `h1`; enlaces a
   privacidad y condiciones junto al botón. `[HV]` §5.4
7. Corregir el desbordamiento horizontal en móvil (417px y 405px). `[HV]` §7.2
8. Llevar todos los CTA a 44px de alto. `[HV]` §5.6
9. Corregir el fallo de hidratación de la página del cupón. `[HV]` §5.7
10. Publicar `main` (metadata por página, cabecera móvil, robots y sitemap).

### P2 — Percepción de valor (semanas)

11. Reemplazar la maqueta del hero por **un cupón real** con negocio chileno,
    logo y código.
12. Unificar cabecera y pie en un componente, con año dinámico y contacto real.
13. Pasar `/precios` por tildes y unificar capitalización.
14. Dar señal de empresa chilena antes de pedir la tarjeta: teléfono y razón social.

### P3 — Producto (decisiones de fondo)

15. Decidir la cuponera: **construirla** (buscador real, masa crítica, criterios de
    publicación) o **retirarla** del sitio y del plan Pro. `[DP]`
16. Estado de plan escrito por el servidor, con marca de agua y cupo dependientes.
17. Instrumentar el embudo: alta → primer cupón → primer compartido → conversión.

### La oportunidad que no está en la lista

**Vender a mano lo que ya existe, esta semana, a un comercio concreto.** No hay
código que escribir. Es la única acción que produce el dato que falta: si alguien
paga por esto. `[OR]` + `[DP]`

---

## 10. Opiniones de los siete Goldfish

**No se ejecutaron. No participaron en esta evaluación.**

`/egm:egm-brainstorm` está marcado como `disable-model-invocation`: solo puede
invocarlo el propietario desde su interfaz. Intenté invocarlo y el plugin lo
rechazó; su mensaje indica explícitamente que no se replique el procedimiento por
otra vía. Por eso este informe **no contiene opiniones de los siete lentes**, y no
las simularé.

**Requisito único para completar esta sección:** que ejecutes

```
/egm:egm-brainstorm
```

en tu prompt. Con eso los siete Goldfish corren en contextos limpios sobre este
material y §10 se completa. Todo lo anterior en este documento es análisis propio y
medición, no revisoría EGM. `[HV]`

### Herramientas que sí y no se usaron

| Herramienta | Estado |
|---|---|
| Playwright (instalado) | **Ejecutado**: escritorio 1440 y móvil 390, 5 páginas |
| Agente de revisión de interfaz | **Ejecutado** (§6.1) |
| Auditor de accesibilidad | **Falló 2 veces** por cuota de la cuenta (429, 402) |
| Investigador de recorrido comercial | **Falló 2 veces**, mismo motivo |
| Plugins de diseño del marketplace | **No instalados** |
| `/egm:egm-brainstorm` | **Bloqueado**: requiere invocación del propietario |

---

## 11. Decisiones que requieren aprobación del propietario

1. **¿Alguna vez se intentó vender, o solo se publicó el sitio?**
   Sigue abierta y es la que más cambia las conclusiones. Si no se intentó, el
   problema es de distribución; si se intentó y falló, las razones son el dato más
   valioso que existe. `[DP]`

2. **¿Aceptas cobrar por acceso con un cupo de cupones por mes**, sin medir
   canjes ni atribuir ventas? `[DP]`

3. **¿Se retira la cuponera o se construye?** Hoy es un beneficio de plan sin
   contenido. `[DP]`

4. **¿Se cierra la promesa de IA o se construye la IA?** No ambas, y no dejarla
   publicada sin decidir. `[DP]`

5. **¿El plan Business sigue siendo asistido por WhatsApp**, con una promesa
   reducida a lo que existe? `[DP]`

6. **¿Qué precio tiene el Pro**, y con qué tarifa de pasarela deja margen? Requiere
   la comparación de proveedores que no se ejecutó. `[DP]`

7. **¿Se autoriza salir de la fase de diagnóstico?** Este documento no autoriza
   nada: es la base para decidir. `[DP]`

---

## Límites de este informe

- No se modificó nada: ni código, ni contenido, ni base de datos, ni pagos, ni
  configuración, ni dependencias. No hubo commit ni deploy.
- Las mediciones son del 2026-11-11 y cambian con el próximo despliegue.
- **No se calcularon ratios de contraste** ni se ejecutó auditoría automatizada de
  accesibilidad: los agentes fallaron por cuota.
- **No se verificaron tarifas de pasarelas** ni el panel de cobros. La comparación
  Reveniu / Mercado Pago sigue pendiente.
- **No se verificaron las variables de entorno de Vercel.** Su ausencia explicaría
  parte del comportamiento de los cupones privados, pero no se comprobó.
- Los fallos de agentes se informan tal como ocurrieron; no se presentó ninguna
  herramienta no ejecutada como si hubiera participado.