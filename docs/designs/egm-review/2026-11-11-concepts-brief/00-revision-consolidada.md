# Revisión independiente de `docs/designs/concepts_brief.md`

- **Fecha:** 2026-11-11
- **Método:** EGM `egm-review`, siete lentes Goldfish en contexto limpio y solo
  lectura, despachados en paralelo. Ninguno vio la conversación que produjo el
  brief, ni los informes de los otros, ni la conclusión de los demás.
- **Documento auditado:** `docs/designs/concepts_brief.md` (366 líneas).
  **No fue modificado.**
- **Estándar de auditoría:** las diez preguntas del propietario, que operaron como
  *Target Standard* en lugar de un documento aparte.
- **Rango:** 1..End. El documento no contiene un `## Detailed Implementation Plan`,
  así que no hay etapa de implementación que auditar.
- **Estado:** revisión terminada. **No autoriza implementación.** Se detiene a
  esperar la decisión del propietario.

## Nota posterior del propietario

Añadida durante su revisión, el mismo 2026-11-11. Se lee antes que el resto porque
reordena sus conclusiones.

**Dato:** **nunca se ha vendido nada.** `[HV]` — confirmado por el propietario.
La fuente es su testimonio, no el repositorio: la base no podía probarlo, porque
`profiles.plan_type` no lo escribe ningún código.

### Qué cierra

- **La pregunta 1 de la sección 7** (§7), que era la que más importaba: existía la
  esperanza de que el panel de Reveniu guardara evidencia de disposición a pagar.
  No la hay.
- **La recomendación 1 de la sección 8**, que era «abrir el panel de Reveniu». Se
  reemplaza (ver §8, recomendación 1).

### Qué cambia

**1. El brief responde la pregunta equivocada.** `[OR]`
El documento pregunta «¿qué modelo de cobro?» cuando el estado real es que **nadie
ha comprado nunca nada, a ningún precio, en ninguna forma**. No es un problema de
unidad de medida: es un problema de demanda. Los cinco perfiles y los cuatro
cupones (uno público) ya lo insinuaban; ahora está confirmado. Con ese punto de
partida, la pregunta «qué se cobra» no tiene forma de responderse: falta el paso
anterior.

**2. La conclusión del brief es correcta por accidente, y el motivo importa.**
`[OR]`
§2 concluye que ningún precio es defendible. Ahora eso es cierto —pero no porque
no se pueda medir el valor, sino porque **nunca se ha intentado vender**. Un
acierto por razonamiento inválido sigue siendo un razonamiento inválido, y la
diferencia es práctica: el brief deduce «hay que construir un sistema de canjes»;
el estado real indica «hay que averiguar si alguien quiere esto».

**3. Corrijo un error propio, de la misma clase que critiqué.** `[OR]` sobre `[HV]`
Este informe afirmaba que «la mitad alta de la oferta se vende hoy por
conversación» (§6.2 y `05`, hallazgo 8), infiriendo actividad comercial de la
existencia de un enlace `wa.me`. **Es el mismo error que el informe le reprocha al
brief**: deducir un hecho de negocio de un mecanismo técnico. El enlace existe; el
canal **nunca ha vendido**. Corregido en ambos archivos. Lo que queda en pie es el
hecho verificado: el plan Business no tiene pasarela, y ahora consta que tampoco
ha convertido por esa vía.

### Qué no cambia

- El error de razonamiento de §2: sigue siendo una sustitución de predicado.
- La exposición de §1: sigue viva y sin realizar, precisamente porque nadie ha
  transaccionado. Es más barata de cerrar que nunca y con menos urgencia práctica.
- El orden de migraciones y `0010`: no depende de si hay ventas.
- La pregunta 8 de la sección 7 (`¿qué son las cinco cuentas?`) sube de
  importancia: si son pruebas del propio propietario, entonces **ninguna persona
  ajena ha usado el producto**.

### La pregunta que ahora gobierna

**¿Alguna vez se intentó vender, o solo se publicó el sitio?** `[DP]`

- Si **no se ha intentado vender**, entonces «cero ventas» no dice nada del
  producto y todo de la ausencia de una acción comercial. El problema es de
  distribución, y ningún modelo de precio lo resuelve.
- Si **se intentó y falló**, las razones —precio, producto, confianza, pitch— son
  el dato más valioso que existe hoy, y no están en ningún archivo.

Sin esta respuesta, las secciones 3 a 6 de este informe son un menú sin comensal.

## Cómo leer este informe

Cada afirmación lleva una etiqueta. La distinción es el punto del encargo: sin
ella, una opinión de un revisor se lee como un dato de mercado.

| Etiqueta | Significado |
|---|---|
| **[HV]** Hecho verificado | Comprobado contra archivo y línea del repositorio |
| **[HC]** Hipótesis comercial | Creencia a validar. No es un dato |
| **[OR]** Opinión del revisor | Juicio del lente, no un hecho |
| **[DP]** Decisión del propietario | Solo el dueño del negocio puede resolverlo |

Los siete informes individuales están en este mismo directorio, uno por archivo:
`01` a `07`. Este documento los sintetiza.

## 1. Veredicto

**El brief es sólido en sus hechos y su conclusión central no se sigue de ellos.**

Los lentes no encontraron un solo hecho de repositorio mal verificado en el
sentido de inventado: casi todas las citas de archivo y línea se confirmaron. Lo
que encontraron es un **error de razonamiento** en el punto que gobierna todo el
documento, y **siete errores factuales** en afirmaciones periféricas, tres de
ellos en la sección de la que depende la acción.

La coincidencia más fuerte de la ronda: **§2 funde tres cosas distintas** —qué
entrega el producto, qué puede medir y qué puede cobrar legítimamente— y deduce
la tercera de la primera. Los siete lentes llegaron ahí por caminos independientes
y con palabras distintas.

## 2. Coincidencias

Lo que dos o más lentes afirmaron por separado, sin verse entre sí.

**2.1 — La conclusión de §2 es un error de razonamiento, no un hallazgo.**
Coinciden los siete: `design` (H1), `exactitud` (H3, H5), `simplificación` (Z1),
`comprensión` (H1, H2), `viabilidad` (bloqueante del encargo), `estructura`
(F-01) y `catálogo` (F2). La formulación más precisa es la de `estructura`:
**de P2/P3 (las métricas no son confiables) a C1 (no hay unidad de cobro) hay una
sustitución de predicado.** Se deduce una imposibilidad contractual de una
imposibilidad técnica. Y la más útil para actuar es la de `catálogo`: la unidad
es consecuencia de la **forma del precio**, no al revés. Hay cuatro formas
—plana, por activo, prepago de recurso, por resultado— y **solo la cuarta
necesita medir un resultado**. `[OR]` sobre `[HV]`.

**2.2 — El canje, tal como lo propone el brief, es peor que lo que reemplaza.**
`design` (#1, nota) y `catálogo` (F1) llegaron por separado al mismo punto: en un
cobro por canje **la parte que reporta el evento es la que paga por él**, y tiene
incentivo a no reportarlo. Se cambia un contador inflable por el visitante
(vistas) por uno deflactable por el cliente. `[OR]` sobre `[HV]`.

**2.3 — «0 de pago» no es un dato que el sistema tenga.**
`design` (#7), `simplificación` (Z2), `viabilidad`, `estructura` y `comprensión`
(H4). El propio brief demuestra en §3 y §4 que `plan_type` no lo lee ni lo
escribe nadie. Un campo que nadie escribe no puede evidenciar que nadie pagó:
solo evidencia que nadie lo actualizó. Verificado: cero coincidencias de
`plan_type` en `app/`, `lib/`, `components/`, `hooks/`. `[HV]` + `[OR]`.

**2.4 — La exposición de §1 es independiente de la decisión comercial y está mal
ordenada.** `design` (#10), `simplificación` (Z11), `comprensión` (H9),
`viabilidad` (primer bloqueante), `catálogo` (F5) y `estructura` (F-05). Retirar
lo que se publica y no se entrega no depende de decidir qué se cobra. El brief ya
tiene la intuición escrita («mientras estén publicadas, la exposición de §1 sigue
viva», `:328`) y la anula al ponerla tercera en la cola. `[HV]` + `[DP]`.

**2.5 — Ninguna de las alternativas acota el costo que el propio brief declara
dominante.** `design` (#2, #5), `comprensión` (H8), `catálogo` (F3, F7) y
`viabilidad`. El brief detecta el costo por render y después decide el precio sin
usarlo como criterio. `[OR]`.

**2.6 — Falta la línea base de costo y el punto de equilibrio.**
`design` (#8), `viabilidad`, `catálogo` (F7) y `estructura`. Un documento titulado
«modelo comercial» discute un precio de $9.990 y no contiene una sola vez cuántos
clientes hacen falta para cubrir el costo fijo que ya se está pagando. `[OR]`.

**2.7 — No hay comprador en ningún lugar del documento.**
`simplificación` (Z12), `comprensión` (H4, y 18 preguntas de comercio),
`catálogo` (F10) y `estructura` (respuesta 2). El estándar Heilmeier exige
«¿a quién le importa?» y «¿cómo sabremos si funcionó?». No hay una línea sobre
quién es el comercio, cuántos son, qué hace hoy en su lugar ni por qué pagaría.
`[OR]` sobre `[HV]`.

**2.8 — El brief enumera lo que falta y nunca lo que existe.**
`exactitud` (respuesta 4, la más detallada), `viabilidad` (nit) y `catálogo`
(F4). Un comercio recibe hoy: crear cupón con validación en base, subir logo con
verificación por firma de bytes, imagen PNG descargable con QR, enlace público
por UUID, publicación en cuponera y dos contadores. Eso responde la pregunta 4 del
propietario y el brief no lo escribe. `[HV]`.

**2.9 — «Alternatives Weighed» no permite decidir.**
`comprensión` (H7), `simplificación` (Z6), `estructura` (F-10) y `catálogo`
(F14). Ocho opciones, cada una con una objeción distinta, sin criterio común. El
contrato de la plantilla espera alternativas **rechazadas con razón**, y el brief
declara que ninguna lo fue. `[HV]`.

## 3. Desacuerdos

Donde los lentes difieren. Ninguno se resuelve aquí: se exponen para que el
propietario decida.

**3.1 — Qué hacer con `plan_type`.**
`catálogo` (F13) propone conservarla como **derivada de solo lectura**, escrita
por trigger desde la fuente de verdad del pago. `simplificación` (Z5) propone
**eliminarla**, porque nadie la lee. `design` y `estructura` no la deciden.
`[OR]` en ambos casos; `[DP]` la elección.

**3.2 — Si la comparación de pasarelas importa o no.**
`viabilidad` y `design` (#11) sostienen que **sí importa**, pero no por
capacidades: por **tarifas** (contra un ticket de $9.990) y por quién emite el
documento tributario, que el sitio promete (`app/condiciones/page.tsx:80`).
`simplificación` (Z9) sostiene que el entregable pendiente **no debería existir**,
porque el brief ya concluyó que no es la decisión. Los tres coinciden en que la
conclusión del brief está mal fundada; difieren en qué hacer con ella. `[OR]`.

**3.3 — SmarterBOT.**
`simplificación` (Z10): no hay relación que decidir; producto aparte, sin
inclusión. `catálogo` (F9): hay al menos cinco direcciones, incluidas dos
**invertidas** (SmarterBOT como revendedor; EcoCupon como módulo dentro de
SmarterBOT) que resolverían el lado de la demanda vacío. `viabilidad`: es la única
decisión con un reloj ajeno, así que se inicia temprano o se descarta.
`design` (#12): el brief nombra el mecanismo técnico («contrato de URL o de
capacidad») y no la forma del ingreso, que es lo que decide la economía. `[HC]` +
`[OR]`; `[DP]`.

**3.4 — Gravedad del fallo de `0007`.**
`viabilidad` sostiene que la consecuencia descrita está sobreactuada.
Verificado: `0007` está envuelta en `begin;`/`commit;` (`:23`, `:37`), así que al
re-ejecutarse revierte y el esquema queda como estaba. El daño real es que el
push se detiene y las migraciones siguientes no se aplican. `[HV]`.

**3.5 — Cuán grave es que §6 afirme una jerarquía de costos sin medir.**
`simplificación` (Z14) acepta la conclusión y objeta el énfasis. `design` (#2)
sostiene que un documento no puede declarar un «costo dominante» y admitir 200
líneas después que no midió nada, y que además mezcla dos clases económicas
(costo facturable por operación y costo indirecto de instancia). `[OR]`.

## 4. Errores del brief, verificados contra el repositorio

Esta sección existe porque los siete lentes la produjeron y porque contradice una
afirmación del propio brief: `:356-358` declara que las afirmaciones se
verificaron «una por una desde el contexto principal». Tres de los errores que
siguen son exactamente de ese tipo.

**4.1 — §5 invierte el estado del despliegue.** `[HV]`
El brief dice «Producción está **3 commits atrás** de `origin/main`
(`DRIFT_REPORT.md:23-39`)». El drift report dice lo contrario y el repositorio lo
confirma: `main` local está **3 commits adelante** de `origin/main`
(`a28ae7c`, `0c2da22`, `a254a8d`), y producción coincide con `origin/main`.
La acción correcta es la que ya está en la decisión 5 (publicar); la
justificación de §5 está invertida. Encontrado por `exactitud` (H1),
`viabilidad` y `estructura` (F-02b) por separado.

**4.2 — §5 sobreactúa la consecuencia del fallo de `0007`.**
Verificado en el punto 3.4. La frase «con la aplicación ya desplegada leyendo un
esquema que no existe» (`:138`) no se sostiene. Encontrado por `viabilidad`.
`[HV]`

**4.3 — §2 declara un método de búsqueda que no reproduce su resultado.**
El brief: «`grep` sobre `canje`, `redeem` y equivalentes no devuelve nada». Sí
devuelve: `app/auth/confirm/route.ts:9` contiene «`/auth/callback` canjea un
`code`, y ese canje usa PKCE». La conclusión de fondo resiste —no existe unidad
de canje en el dominio— pero el procedimiento que el brief declara es falso.
Encontrado por `exactitud` (H2) y `estructura` (F-02a). `[HV]`

**4.4 — §4 niega que exista clave de unión, y existe.**
El brief: «el pago no deja ninguna clave que lo una con la fila del comercio».
`profiles.email` existe (`0001_init.sql:39`) y el trigger `handle_new_user` lo
puebla con `new.email` (`:54-56`). El propio brief usa esa clave dos párrafos más
abajo («cruzar por correo o monto»). Falta un identificador determinista y
automático, no toda clave. La consecuencia importa porque de eso depende la
reconciliación que el brief manda hacer en la decisión 3. Encontrado por
`estructura` (F-04). `[HV]`

**4.5 — §1 llama «siete promesas» a un inventario incompleto.**
La promesa de IA está publicada en al menos nueve lugares más, incluidos los
metadatos del layout que indexa Google (`app/layout.tsx:14,17`) y el propio
documento contractual (`app/condiciones/page.tsx:44`). Además:
- La fila de la marca de agua está **invertida**. `app/api/coupon-image/route.tsx:184`
  emite «Creado con EcoCupon.cl» incondicionalmente, así que lo falso no es la
  marca de agua del plan gratis sino el **«Sin marca de agua» del Pro**
  (`app/page.tsx:257`), que no se cumple nunca.
- Falta la promesa más falsable del sitio: «Únete a cientos de negocios que ya
  usan EcoCupon» (`app/page.tsx:288`), contra 5 perfiles.
- Falta «Los cambios se aplican inmediatamente» (`app/precios/page.tsx:160`) y
  «Logo y branding custom» (`:59`).
- El buscador de la cuponera es inerte: `Input` y `Button` sin `onChange` ni
  `onSubmit` (`app/cuponera/page.tsx:74-81`), mientras su metadata promete
  «Filtra por negocio». `[HV]`

Consecuencia: la instrucción de la decisión 3 («quitar del sitio las siete
features inexistentes») **no cierra la exposición que el brief denuncia**.
Encontrado por `exactitud` (H4, H6), `catálogo` (F4) y `estructura` (F-03).

**4.6 — §6 afirma más de lo que el código permite: «protección SSRF correcta».**
La allowlist acepta cualquier subdominio de `supabase.co`
(`app/api/coupon-image/route.tsx:19-21`: `u.hostname.endsWith("." + h)`), no solo
el host del proyecto. La protección existe y es razonable, pero admite contenido
del Storage público de cualquier proyecto Supabase de terceros. Encontrado por
`exactitud` (H8.1). `[HV]`

**4.7 — §7 llama `console.error` a un `console.warn`.**
`lib/supabase/admin.ts:32` emite un aviso explícito, y el archivo existe para
hacer ruidoso el fallback. Lo silencioso es el 404 del usuario final, no el aviso
al operador. El drift report ya había registrado este matiz como inexactitud que
el brief reintroduce. Encontrado por `exactitud` (H8.2). `[HV]`

**4.8 — §9 apoya su conclusión en una fuente no trazable.**
«Reveniu, verificado antes, ofrece el mismo conjunto» no lleva archivo, línea,
fecha ni artefacto. Ningún documento del repositorio describe esas capacidades de
Reveniu. En un documento cuya virtud declarada es la trazabilidad. Encontrado por
`viabilidad` (nit), `estructura` (F-12) y `exactitud`. `[HV]`

**4.9 — Citas sin referencia, en un brief que se juzga por citarlas.**
«Códigos únicos, rastreables» (`:70-71`) es una fusión de dos campos de
`app/page.tsx:186` sin citar archivo: es la única cita sin referencia del
documento. Rango de la portada citado como `:227-261` cuando las cadenas que
sostienen la contradicción están en `:223` y `:265`. Encontrado por `exactitud`
(H7). `[HV]`

**4.10 — El brief no se aplica a sí mismo la clasificación que el propietario
pidió.** `[HV]` + `[DP]`
Ninguna afirmación está etiquetada como hipótesis salvo dos bloques de «Límite de
este apartado». Afirmaciones que son hipótesis comerciales están escritas con
sintaxis de hecho: «con clientes pagando, se decide con reembolsos» (`:240`),
«vender ubicación en una vitrina sin público no es vendible» (`:290`), «no genera
ingreso recurrente» (`:280`). Encontrado por `estructura` (F-14).

**4.11 — Los siete informes del brainstorm no están en el repositorio.**
Todas las atribuciones a lentes individuales («el lente de migración fue el más
duro», «dos lentes llegaron por separado al mismo bloqueante», «el lente de
catálogo inventivo llevó esto a su forma límite») son **no auditables**. El
`grep` de `docs/` no encuentra ningún informe de esa ronda. Encontrado por
`simplificación` (Z15) y `estructura` (F-13). `[HV]`

## 5. Conclusiones del primer brainstorm que deben revisarse

Ordenadas por consecuencia. Ninguna se retira sin tu decisión.

| # | Conclusión del brief | Qué debe pasar | Etiqueta |
|---|---|---|---|
| 1 | §2 / decisión 1: «sin una unidad de valor que el producto pueda medir, ningún precio es defendible» | **Revisar.** Es un error de razonamiento. Separar tres cosas: qué entrega, qué mide, qué puede cobrar. El conteo de cupones por comercio y por período ya es exacto (`coupons.user_id` + `created_at`, índices en `0002_security.sql:177,179`) y es la unidad que el sitio ya vende | `[OR]` sobre `[HV]` |
| 2 | §2: «la única unidad facturable honesta es un canje confirmado» | **Revisar y rebajar.** Además, el canje autodeclarado por el comercio tiene incentivo perverso: lo reporta quien paga por él | `[OR]` |
| 3 | Decisión 1: «la opción que sobrevivió mejor al escrutinio es el canje confirmado» | **Revisar.** El criterio de «sobrevivió mejor» no está definido en ninguna parte del documento, y el canje es la opción más cara de construir | `[HV]` |
| 4 | §6: «el costo dominante del sistema» | **Rebajar a estimación** y declarar la jerarquía como conjetura. Añadir los dos sumideros que faltan: objetos de Storage que nunca se borran (no existe un solo `.remove(` en el repo) y el `getUser()` que el middleware cobra en cada render anónimo | `[HV]` |
| 5 | Overview: «los siete revisores coincidieron» y sus tres razones | **Reescribir.** La convergencia es real, pero la síntesis es del Elefante, no una cita; una de las tres razones (pasarela) queda refutada por §9 del propio brief, y la que el brief llama la más repetida (§1) no está en la lista | `[HV]` |
| 6 | Goals («si el modelo se apoya en uso») vs decisión 1 (absoluto) | **Unificar.** Dos secciones dan a la misma premisa estatus distinto; el propietario leerá la decisión primero | `[HV]` |
| 7 | §5: «la fase de despliegue está rota antes de empezar» | **Corregir el referente** (4.1) y **bajar la consecuencia** (4.2). El riesgo es real; la descripción no | `[HV]` |
| 8 | §10: «cambia el signo de la economía unitaria» | **Reformular como condicional.** Una afirmación de signo es cuantitativa y el brief declara no entregar cifras | `[OR]` |
| 9 | §8: «el producto abierto por diseño» | **Reducir al aporte nuevo.** El hallazgo ya está en el drift report; lo que aporta el brief es refutar la premisa escrita en la migración (que los UUID son inguessables bajo `using (true)`) | `[HV]` |
| 10 | «Key Decisions & Staging for Next Steps» | **Reordenar y renombrar.** Son seis preguntas abiertas, no decisiones; «las cuatro primeras son bloqueantes entre sí» no es operativo; y el párrafo de entregables pendientes (`:339-345`) no es una decisión y su lugar es «Límites» | `[HV]` + `[DP]` |
| 11 | §1: «el catálogo publica siete promesas y ninguna de las siete existe» | **Reescribir el conteo y la tabla.** Omitir la fila invertida y las promesas que sí existen debilita la sección que el brief presenta como la más repetida por los lentes | `[HV]` |
| 12 | Decisión 2: «ningún dato que conceda cuota puede residir en una fila que su titular pueda escribir» | **Reescribir como enunciado positivo.** Es una prohibición, no una resolución, y está redactada como invariante de esquema dentro de una etapa que no autoriza especificación técnica | `[OR]` + `[DP]` |

## 6. Alternativas comerciales nuevas

Las que los lentes levantaron y **no están** en el brief. Ninguna es una
recomendación: son opciones para el propietario.

**6.1 — Prepago con la unidad corregida.** `catálogo` (F3, modelos A y B).
El brief descarta el prepago con la objeción de que «el costo dominante seguiría
sin estar acotado». Eso es una objeción a la unidad elegida, no a la forma: un
prepago **por renders** o **por posiciones vivas en la vitrina** acota exactamente
el costo que §6 declara no acotado, y conserva las ventajas que el propio brief le
reconoce al prepago. `[HC]`

**6.2 — El canal de venta manual existe, y no ha vendido.** `viabilidad`. El plan
Business, el de $29.990, **no se vende por ninguna pasarela**: su botón es un
`wa.me` (`app/precios/page.tsx:61-62`). Es un canal disponible, no un canal
probado: **nunca ha convertido** (ver Nota posterior del propietario). El brief lo
trata como alternativa a evaluar cuando ni siquiera está validado — y, a la
inversa, tampoco lo cuenta como intento fallido, que sería la lectura más
informativa. `[HV]` + `[HC]`

**6.3 — Cobro por transferencia con contador del servidor.** `catálogo` (F7,
respuesta 7). El FAQ ya promete transferencia bancaria (`app/precios/page.tsx:164`).
Es el arranque más barato posible: sin webhook, sin conciliación, sin dunning.
Nota: la transferencia es incompatible con un cobro recurrente automático, lo que
obliga a decidir si el plan «/mes» es una cobranza manual o un cobro único
disfrazado de suscripción. `[HC]`

**6.4 — Licencia blanca a quien ya tiene los comercios.** `catálogo` (modelo R).
Un revendedor —SmarterBOT, un proveedor de POS, un gremio, una municipalidad—
paga una licencia plana y trae la demanda. No exige canje, no exige webhook
propio, no carga costo variable. Es el único modelo que resuelve **a la vez** los
dos activos que el brief identifica por separado: el lado de la demanda vacío y la
imposibilidad de medir valor. `[HC]`

**6.5 — SmarterBOT en la dirección invertida.** `catálogo` (F9). El brief compara
tres vías en las que **EcoCupon es el que concede**. Faltan las inversas:
SmarterBOT como revendedor de EcoCupon (EcoCupon no toca WhatsApp, no carga costo
variable, hereda demanda), y EcoCupon como módulo dentro de la oferta de
SmarterBOT. La pregunta que ordena no es la forma sino **quién trae al comercio y
quién carga el costo variable**. `[HC]`

**6.6 — Cuota como contador del servidor, no como bandera.** `catálogo` (F8). Si
la cuota es un conteo de eventos cuyo único escritor es el servidor, no hay ningún
booleano que falsificar y la pregunta «dónde vive el derecho» desaparece: no hay
derecho que vivir, hay un medidor que sumar. `[OR]`

**6.7 — Escasez sobre audiencia ajena.** `catálogo` (modelo D). No vender
ubicación en la vitrina propia (vacía), sino acceso a la audiencia de un tercero.
Convierte un producto de catálogo en un producto de alianza. `[HC]`

**6.8 — Material impreso.** `comprensión` (respuesta 3). Póster, stickers QR,
letrero de mesón, con precio fijo y pago anticipado. El entregable se verifica al
enviarlo y el QR ya se genera (`app/dashboard/crear/page.tsx:163-178`). `[HC]`

**6.9 — Híbridos.** `catálogo`. Los dos con mejor comportamiento: **prepago más
servicio asistido** (la única combinación vendible esta semana sin construir nada)
y **asiento más prepago de renders** (acota costo y da recurrencia, al precio de
reintroducir el estado de suscripción). `[HC]`

## 7. Preguntas para el propietario

Las que los revisores no pueden responder y que bloquean el resto. Las primeras
cuatro son de lectura, no de ingeniería: se responden abriendo un panel.

**Sobre lo que ya ocurrió**
1. **¿Alguien ha pagado alguna vez?** Es el único dato existente sobre disposición
   a pagar y vive en el panel de Reveniu, que el brief declara no haber revisado.
2. **¿El enlace de Reveniu cobra una vez o recurrentemente?** El FAQ promete
   «tarjetas, débito y transferencia»; la transferencia no admite recurrencia
   automática.
3. **¿Cuál es el costo fijo mensual que ya estás pagando?** Vercel, Supabase,
   dominio y cualquier costo del proveedor de pagos. Sin ese número no hay punto de
   equilibrio, y sin punto de equilibrio no se sabe si el objetivo es 50 comercios
   o 5.000.

**Sobre el negocio**
4. **¿Quién es el comercio al que le vendes?** ¿Qué hace hoy en su lugar
   —Instagram, estado de WhatsApp, un volante, Canva— y por qué pagaría por esto?
5. **¿Aceptas cobrar por acceso, sin prueba de resultado medido?** Es la decisión
   que el brief tomó por ti sin declararlo.
6. **¿Qué relación quieres con SmarterBOT, y quién trae al comercio?**
7. **¿Aceptas vender hoy solo lo que existe?** Es la vía más barata al primer peso
   cobrado y la que el brief califica de «trabajo real y visible».

**Sobre las cinco cuentas actuales**
8. **¿Qué son?** ¿Pruebas tuyas, conocidos, comercios reales? Determina si hay
   alguna señal de uso que el brief no leyó.
9. **¿Qué pasa si alguna dejara de funcionar hoy?** ¿Hay alguien del otro lado?

**Sobre la exposición**
10. **¿Cuál es la urgencia de cerrar la exposición de §1?** Si la respuesta es
    «alta», es independiente de toda decisión de modelo.

**Las que el comercio haría y el documento no responde** (de `comprensión`, que
las escribió en primera persona): ¿qué me dan si pago hoy? ¿quién ve mi cupón?
¿cuántos cupones al mes, si cada página dice una cifra? ¿queda registrado que
pagué, me llega boleta? ¿puedo darle acceso a mi hija sin darle mi clave? ¿con
quién hablo si algo falla? ¿puedo imprimir el cupón? ¿mi cliente tiene que
bajarse una app? ¿me suben el precio? ¿puedo probarlo un mes?

## 8. Recomendaciones ordenadas por importancia

Cada una indica si es lectura, edición o decisión. **Ninguna autoriza
implementación.**

**1. Determinar si alguna vez se intentó vender.** `[DP]`
*Reemplaza la recomendación original —«abrir el panel de Reveniu»— tras la
confirmación del propietario: **nunca se ha vendido** (ver Nota posterior).* La
pregunta es ahora si el problema es de intento o de resultado. Si no se ha
intentado vender, el problema es de distribución y ningún modelo de precio lo
resuelve; si se intentó y falló, las razones son el dato más valioso que existe y
no está en ningún archivo. `design` (#6), `viabilidad` (paso 0) y `simplificación`
(Z13) coincidían en que este paso precede a toda decisión de modelo: ahora precede
también a este informe.

**2. Cerrar la exposición de §1.** `[DP]` — edición de textos.
Retirar las promesas falsas **completas** (no las siete: las de IA en metadatos,
contrato y portada; «cientos de negocios»; «Sin marca de agua» del Pro; «Los
cambios se aplican inmediatamente»), alinear las cifras de cupones gratis y
resolver la contradicción de reembolso entre `app/precios/page.tsx:168` y
`app/condiciones/page.tsx:81`. No depende de ninguna decisión comercial.

**3. Establecer la línea base de costo y el punto de equilibrio.** `[DP]`
Cuánto se paga hoy al mes y cuántos clientes lo cubren. Sin esto, «qué se cobra»
no produce un precio: produce un deseo.

**4. Reformular §2 y la decisión 1.** `[OR]` → `[DP]`
Separar **unidad de cuenta** de **unidad de valor**, y **forma del precio** de
**unidad**. Decidir la forma primero —plana, por activo, prepago de recurso, por
resultado— y solo si se elige la cuarta aparece la necesidad del canje.

**5. Decidir qué se vende el día uno, con lo que ya existe.** `[DP]`
La lista verificada del punto 2.8, más el canal manual del plan Business que ya
opera.

**6. Corregir los once errores factuales de la sección 4.** `[OR]`
Es trabajo de edición sobre el brief. Los cuatro primeros cambian decisiones; el
resto cambia la confianza que el documento merece.

**7. Fijar el orden de `plan_type` y de `0010`.** `[DP]`
Verificado: `0010:51-53` **versiona** `profiles_update_own` tal cual. Aplicar
`0010` antes de decidir dónde vive el derecho convierte en código versionado la
policy que hoy permite al titular reescribir su propio plan, y obliga a una
segunda migración que deshaga la primera.

**8. Reparar el historial de migraciones y publicar `main`, como dos pasos
separados.** `[DP]`
`CLAUDE.md:7-8` dice que cada merge despliega solo; el runbook exige una ventana
sin despliegues en curso. Publicar `main` **crea** el despliegue. Y faltan
precondiciones que el brief no nombra: `SUPABASE_SERVICE_ROLE_KEY` en Vercel
(sin ella, `0010` deja de resolver el enlace privado, que es lo único que un
comercio que paga usa), respaldo, y `supabase login` — el proyecto no está
enlazado (`supabase/.temp/project-ref` no existe).

**9. Decidir SmarterBOT con las dos preguntas correctas.** `[DP]`
Quién trae al comercio y quién carga el costo variable. Bajo ese criterio, el
empaquetado dentro de un precio fijo es la peor de las opciones.

**10. Añadir al brief lo que le falta y no sobra.** `[OR]`
Una sección sobre el comprador y su alternativa actual; una tabla de «costo de
llegar al primer peso cobrado» por alternativa; y la enumeración de lo que sí
existe, que es lo único que responde la pregunta 4.

## 9. Informes individuales

Cada archivo es la síntesis fiel del informe de ese lente, condensada por el
Elefante. Los informes crudos se produjeron en contexto limpio y no se
persistieron; esta es la limitación que el propio lente de estructura señaló en el
brief anterior (punto 4.11), y no se repite: cada archivo conserva todos los
hallazgos con su severidad, su alcance y su clasificación, y las diez respuestas.

| Archivo | Lente | Su aporte más distintivo |
|---|---|---|
| `01-lente-design-economia.md` | `egm-design` | El costo por petición anónima que el brief subestima: el middleware cobra un `getUser()` en cada render, y ningún modelo lo atribuye a un cliente |
| `02-lente-exactitud-codigo.md` | `egm-codebase-details` | El inventario de las ocho magnitudes medibles: dos son exactas hoy, y una es la que el sitio ya vende |
| `03-lente-simplicidad-alcance.md` | `egm-zoom-out` | El círculo del brief: prohíbe la única acción que produce evidencia, que es cobrar |
| `04-lente-comprension.md` | `egm-comprehension` | Las 18 preguntas del comercio, y que el hallazgo central del brief (el lado de la demanda vacío) está enterrado en una objeción |
| `05-lente-viabilidad-secuencia.md` | `egm-implementation-readiness` | Que el plan Business ya se vende por WhatsApp, y que `0010` debe esperar a la decisión 2 |
| `06-lente-estructura-argumento.md` | `egm-structural` | El trazado de la cadena: dónde salta, y que la premisa mayor nunca está escrita |
| `07-lente-catalogo-inventivo.md` | `egm-inventive-catalyst` | Seis modelos de monetización sin canje y el Resultado Final Ideal: facturar eventos del servidor, reportar resultados del comercio |

## 10. Límites de esta revisión

- **No se modificó `concepts_brief.md`.** No se creó ninguna migración, archivo de
  código ni configuración. No se tocó la base, ni las políticas RLS, ni ningún
  proveedor de pagos, ni variables de entorno.
- **No se ejecutó ningún push, deploy, migración ni cambio.** Todo fue lectura de
  archivos, `grep`, `git log` de solo lectura y consultas SQL de solo lectura de
  sesiones anteriores.
- Las afirmaciones de los siete revisores sobre el repositorio **se verificaron
  una por una desde el contexto principal** antes de escribirse aquí. Once se
  confirmaron como errores del brief (§4); el resto se sostuvo.
- **Los revisores no tienen shell ni red.** No midieron QPS, consumo de Fluid
  Compute, egress de Storage, ni tarifas de ningún proveedor. Ninguna cifra de
  costo de esta revisión es una medición.
- **No se verificó el panel de Reveniu**, ni las variables de entorno de Vercel,
  ni si alguien ha pagado. La pregunta 1 de la sección 7 sigue abierta.
- **Las tarifas de Mercado Pago Chile y de Reveniu siguen sin verificar.** Es la
  misma laguna que el brief declara, y ninguno de los siete lentes pudo cerrarla.
- **No se verificó `smarter.rut`**: no es alcanzable desde este repositorio. Todo
  lo que se afirma de SmarterBOT es heredado del brief y del encargo.
- Este informe **no autoriza implementación** y no propone plan de trabajo,
  código, migraciones ni configuración de pasarelas. Las decisiones de la sección 8
  son del propietario y están marcadas como tales.
