# Lente `egm-zoom-out` — simplicidad y alcance

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** alejarse y preguntar si el documento está resolviendo el problema
  correcto. Atacar la conclusión central.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** el brief es **más largo que su hallazgo** y **prohíbe la única
  acción que produciría la evidencia que le falta**.

> Síntesis del Elefante. Etiquetas `Z1`–`Z15` del informe original; el
> identificador `Z7` no se recuperó y no se cita en el informe consolidado. Los
> informes crudos no se persistieron.

## El problema que el brief no nombra

**Z4 — El problema observable no es que no se midan canjes: es que nadie usa el
producto.** `[HV]`
El brief dedica su sección central a una carencia de instrumentación y menciona
de paso, enterrado en la objeción de una alternativa, el dato que sí importa:
**4 cupones y 5 perfiles**, de los cuales 3 cupones son privados. Con esa
magnitud, la pregunta relevante no es «¿cómo cobro?» sino «¿por qué nadie lo
usa?». El brief no se la hace.

## Hallazgos

**Z1 — §2 funde dos cosas distintas.** `[OR]`
*Valor entregado* y *unidad facturable* no son lo mismo. La frase «la única
unidad facturable honesta es un canje confirmado» cambia el predicado a mitad de
camino.

**Z2 — «0 de pago» es evidencia circular.** `[OR]` sobre `[HV]`
Sale de un campo que nadie escribe. El brief lo sabe —lo demuestra en §3 y §4— y
lo usa igual como prueba.

**Z3 — El documento prohíbe la acción que produce la evidencia.** `[OR]`
§7 declara que esta etapa no autoriza implementación; la decisión 1 exige elegir
un modelo con evidencia; la única acción que produce esa evidencia es cobrar a
alguien. El brief se encierra: no se puede saber sin cobrar y no se autoriza
cobrar. La salida —la venta manual, que ya opera— está en el brief como
alternativa a evaluar y no como la salida del círculo.

**Z5 — `plan_type` debería eliminarse.** `[OR]`
Nadie la lee. Mantener una columna que ningún código consulta, en un esquema cuyo
historial de migraciones está desincronizado, es costo sin beneficio.

**Z6 — «Alternatives Weighed» no permite elegir.** `[OR]` sobre `[HV]`
Ocho opciones, cada una con una objeción redactada en un registro distinto, sin
un criterio común. El brief declara que ninguna fue rechazada, así que la sección
es un catálogo, no un análisis.

**Z8 — Los precios ya están publicados, y nadie ha comprado.** `[HV]`
La portada y `/precios` llevan el plan Pro con checkout desde el commit inicial,
y el Business con `wa.me`. La decisión de precio ya está tomada en producción, y
el propietario confirma que **nunca se ha vendido**. El brief discute como
hipótesis algo que el sitio ya afirma desde el primer commit: publicar un precio
no es vender. Cero ventas con precios publicados admite dos lecturas —nadie llegó,
o llegaron y no compraron— y el brief no distingue entre ellas. Esa distinción es
la que decide qué hacer después.

**Z9 — El entregable pendiente de comparar pasarelas no debería existir.** `[OR]`
El brief concluye que la comparación no es la decisión (decisión 6) y aun así la
deja como entregable abierto (`:339-345`). Si no es la decisión, no es un
entregable.

**Z10 — SmarterBOT no tiene relación que decidir.** `[OR]`
Sin producto, sin contrato y sin usuarios en común, la pregunta «¿incluido,
independiente o alianza?» no tiene referente. Producto aparte, sin inclusión.

**Z11 — Retirar las promesas falsas es independiente del modelo.** `[OR]`
El brief lo intuye (`:328`) y lo pone tercero en la cola. Es la única acción que
no depende de ninguna decisión, y por eso debería ir primera.

**Z12 — No hay comprador, competidor ni canal en ningún lugar del documento.**
`[OR]` sobre `[HV]`
El competidor real es **no hacer nada**, que es gratis y ya está funcionando. El
brief no menciona ni una vez qué hace hoy el comercio en lugar de contratar
EcoCupon.

**Z13 — La lectura del panel de Reveniu precede a todo.** `[DP]`
Es el paso 0 y no aparece en la secuencia.

**Z14 — La jerarquía de costos de §6 es una conclusión razonable con un
fundamento inexistente.** `[OR]`
El lente acepta la conclusión y objeta el énfasis: si no se midió, no puede
sostener una decisión.

**Z15 — Ninguna atribución a los siete lentes del brainstorm es auditable.**
`[HV]`
El brief cita a lentes individuales —«el lente de migración fue el más duro»,
«dos lentes llegaron por separado al mismo bloqueante», «el lente de catálogo
inventivo llevó esto a su forma límite»— y **ningún informe de esa ronda está en
el repositorio**. Un `grep` sobre `docs/` no los encuentra. En un documento cuya
virtud declarada es la trazabilidad, la procedencia de su propia evidencia no es
verificable.

## Qué sobra

Criterio del lente sobre qué recortar del documento:

- **§5 (despliegue), §7 (seguridad), §8 (producto abierto), §9 (pasarelas) y §10
  (Smarter.RUT) como argumentos comerciales.** Son correctos y son de otra
  disciplina: no sostienen la conclusión comercial, y su presencia hace que el
  brief parezca el resultado de un análisis que en realidad no se hizo.
- **La narración del método.** El encabezado y los bloques que describen cómo se
  hizo el brainstorming ocupan espacio de la conclusión.
- **Las menciones a los lentes individuales** (Z15), por no auditables.

## Qué debería quedar

1. El problema observable: nadie usa el producto (Z4).
2. Las promesas que no se cumplen (que son más de siete).
3. Los modelos de precio posibles, con criterio común.
4. El paso 0: mirar si alguien pagó (Z13).
5. Nada de implementación.

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar?** No.
2. **¿Madurez técnica confundida con potencial comercial?** Sí, y el brief lo hace
   para justificar una etapa de análisis que no llega a su propia conclusión.
3. **¿Modelos sin canjes?** Todos salvo el cobro por resultado.
4. **¿Valor desde el día uno?** Lo que ya está construido, vendido por el canal
   manual que ya opera (Z8).
5. **¿Suscripción como modelo principal?** El brief no tiene el dato para
   decidirlo y no lo busca (Z13).
6. **¿Alternativas?** Existen y el brief las enumera sin poder elegir entre ellas
   (Z6).
7. **¿Reveniu y Mercado Pago compiten?** No es la decisión (Z9).
8. **¿SmarterBOT?** No hay relación que decidir (Z10).
9. **¿Riesgo de automatizaciones en precio fijo?** Real y no cuantificado.
10. **¿Empezar sin prometer lo inexistente?** Es la única respuesta que el brief
    tiene completa y la coloca en tercer lugar (Z11).

## Su frase más útil

**«El documento prohíbe la única acción que produciría la evidencia que dice
necesitar.»** `[OR]`
