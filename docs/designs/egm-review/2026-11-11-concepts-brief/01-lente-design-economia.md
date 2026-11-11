# Lente `egm-design` — arquitectura y economía del diseño

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** atacar la conclusión central, no confirmarla. Detectar errores de
  razonamiento, alternativas ignoradas, contradicciones y oportunidades.
- **Contexto:** limpio. No vio la conversación que produjo el brief ni los
  informes de los otros seis lentes.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** el brief comete un **error de categoría** en §2 y construye
  encima de él.

> Síntesis del Elefante sobre el informe del lente. Los informes crudos no se
> persistieron — hallazgo que este mismo lente no pudo ver y que `egm-zoom-out`
> (Z15) y `egm-structural` (F-13) sí detectaron. Los identificadores de hallazgo
> son los del informe original.

## Hallazgo principal

**D-H1 — §2 es un error de categoría.** `[OR]`

El brief sostiene que «sin una unidad de valor que el producto pueda medir,
ningún precio es defendible» (`concepts_brief.md:79-80`). Eso confunde tres
relaciones distintas:

1. **Qué entrega el producto** (una relación de valor).
2. **Qué puede medir el sistema** (una capacidad técnica).
3. **Qué puede cobrar legítimamente** (una relación contractual).

Ninguna implica la siguiente. La prueba está en el propio stack del brief: Vercel
se cobra por invocaciones y CPU, Supabase por almacenamiento y peticiones,
Reveniu por transacción. Ninguno mide el resultado del cliente y ninguno tiene un
problema de honestidad al cobrar. **El software se vende por acceso o por
capacidad; el resultado medido es una forma de precio entre varias, no la
condición de posibilidad de cobrar.** `[OR]`

## Hallazgos

1. **D-H1** — §2, error de categoría. Ver arriba. `[OR]`
2. **Tres magnitudes ya son facturables hoy, y el brief no las ve.** `[HV]`
   - **Cupones por comercio y período:** `coupons.user_id` + `coupons.created_at`,
     con índice en `supabase/migrations/0002_security.sql:177`. Exacto hoy.
   - **Cupones públicos:** índice `coupons_public_created_idx`,
     `0002_security.sql:179`.
   - **Objetos en Storage:** el prefijo de ruta es `{user.id}/…`
     (`app/api/upload-logo/route.ts:64`), así que el consumo por comercio es
     atribuible por prefijo.
   Que las tres existan y el brief concluya que no hay unidad de cobro indica que
   buscó en el lugar equivocado: buscó un resultado de negocio donde había
   contadores de sistema.

3. **«Procedencia de un pago» no es «unidad facturable».** `[OR]`
   El brief argumenta que sin saber de dónde vino el pago no se puede facturar
   (`:79-104`). La procedencia resuelve **a quién** se le cobra, no **por qué
   concepto**. Son dos problemas separados y el brief los funde para que uno
   arrastre al otro.

4. **#2 — §6 declara un «costo dominante» sin medirlo.** `[OR]` sobre `[HV]`
   El propio brief admite más adelante que no midió. Además mezcla dos clases
   económicas que no se suman: **costo facturable por operación** (una
   generación de imágenes, un render) y **costo indirecto de instancia**
   (Fluid Compute ocioso, almacenamiento). Una jerarquía así no permite decidir
   un precio.

5. **#3 — El costo que ningún modelo atribuye a un cliente.** `[HV]`
   `lib/supabase/middleware.ts:43` ejecuta `await supabase.auth.getUser()` en
   **cada** petición que pasa por el matcher, incluidos los renders anónimos de
   `/cupon/[id]`, `/cuponera` y `/api/coupon-image`. Ese tráfico no tiene dueño y
   por lo tanto ningún modelo de precio lo cubre. El brief detecta el costo por
   render pero no esta asimetría.

6. **#5 — La objeción contra el prepago se aplica solo al prepago.** `[OR]`
   El brief lo descarta porque «el costo dominante seguiría sin estar acotado»
   (`:290`). Es una objeción a la **unidad**, no a la **forma**: un prepago por
   renders o por posiciones vivas acota exactamente ese costo. La objeción es
   además circular, porque se apoya en un costo que el brief no midió (D-#4).

7. **#7 — «0 de pago» es evidencia circular.** `[OR]` sobre `[HV]`
   El dato sale de `profiles.plan_type`, campo que **ningún archivo de `app/`,
   `lib/`, `components/` ni `hooks/` lee o escribe**. Un campo que nadie actualiza
   no puede evidenciar que nadie pagó.

8. **#8 — No hay punto de equilibrio.** `[OR]`
   Un documento que discute $9.990 no contiene cuántos clientes cubren el costo
   fijo ya comprometido. Sin ese número, la elección de modelo no tiene criterio
   de éxito.

9. **#10 — El costo de llegar al primer peso está invertido.** `[OR]`
   El brief ordena tercero lo único ejecutable (retirar promesas) y primero lo
   que exige construir un sistema (el canje). Retirar texto es una edición de
   minutos; instrumentar canjes es un proyecto. La secuencia contradice la
   economía del propio plan.

10. **#1 — La unidad de canje tiene incentivo perverso.** `[OR]`
    En un cobro por canje, **quien reporta el evento es quien paga por él**. Se
    sustituye un contador inflable por un tercero (vistas, que `0010:103-104`
    admite como inflables) por un contador deflactable por el propio cliente.

11. **#6 — Lectura previa obligatoria.** `[DP]`
    Antes de cualquier decisión de modelo, abrir el panel de Reveniu y determinar
    si alguien ha pagado. Es el único dato real sobre disposición a pagar y el
    brief declara no haberlo mirado.

12. **#11 — La comparación de pasarelas importa, pero no por lo que el brief
    cree.** `[OR]`
    No por capacidades —como concluye `:198-200`— sino por **tarifas** contra un
    ticket de $9.990 y por **quién emite el documento tributario**, que el sitio
    ya promete (`app/condiciones/page.tsx:80`).

13. **#12 — SmarterBOT: el brief nombra el mecanismo, no la forma del
    ingreso.** `[OR]`
    «Contrato de URL o de capacidad» (`:225`) describe la integración. Lo que
    decide la economía es si se cobra por asiento, por evento o por licencia
    plana, y el brief no lo dice.

14. **El almacenamiento crece sin techo.** `[HV]`
    `app/api/upload-logo/route.ts:64` nombra el objeto con `Date.now()`, así que
    `upsert: true` nunca sobrescribe: cada subida crea un objeto nuevo. No existe
    una sola llamada a `.remove(` en todo el repositorio. El costo que el brief
    llama dominante ignora un sumidero que solo crece.

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar una suscripción?** No. Es un error de
   categoría. El software se vende por acceso o capacidad.
2. **¿Se confunde madurez técnica con potencial comercial?** Sí, y en la
   dirección peor: el brief lee una **carencia** técnica como una **imposibilidad**
   comercial.
3. **¿Qué modelos funcionan sin canjes?** Los tres primeros que ya son
   facturables hoy (D-2): cupones, cupones públicos, Storage.
4. **¿Qué valor concreto vende desde el día uno?** Cupones generados, logo
   validado por firma de bytes, imagen PNG con QR descargable, enlace público,
   publicación en vitrina y dos contadores. Todo existe.
5. **¿Tiene sentido la suscripción mensual como modelo principal?** No hay
   evidencia en el brief para decidirlo: falta el punto de equilibrio (D-8).
6. **¿Qué alternativas hay?** Las cuatro formas de precio son independientes del
   canje; solo la de resultado lo exige.
7. **¿Reveniu y Mercado Pago compiten?** El eje relevante es tarifa y documento
   tributario, no capacidad (D-12).
8. **¿SmarterBOT incluido, independiente o alianza?** Ninguna: la pregunta útil es
   quién trae al comercio y quién carga el costo variable.
9. **¿Riesgo de meter automatizaciones y WhatsApp en precio fijo?** Alto y no
   cuantificado: el brief no mide el costo por evento, así que no puede acotar el
   riesgo.
10. **¿Qué modelo permite empezar sin prometer lo que no existe?** Vender lo que
    ya está construido (D-4) y retirar las promesas falsas el mismo día.

## Límites que este lente declara

Sin shell ni red: no midió QPS, consumo de Fluid Compute, egress de Storage ni
tarifas de proveedor. Todas sus cifras de costo son estimaciones no verificadas y
están marcadas `[OR]`.
