# Lente `egm-comprehension` — lector ingenuo y comprensión

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** leer el brief como lo leería su destinatario —un comerciante
  chileno— y también como lo leería alguien sin contexto técnico. Atacar la
  conclusión central.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** el brief **no responde la pregunta que su título promete**, y la
  respuesta que sí tiene está enterrada en el peor lugar posible.

> Síntesis del Elefante. Etiquetas `H1`–`H13` del informe original; `H6`, `H14` y
> `H15` no se recuperaron y no se citan en el informe consolidado. Los informes
> crudos no se persistieron.

## Los hallazgos

**H1 — La frase que decide está escrita como hecho y es una opinión.** `[OR]`
«Sin una unidad de valor que el producto pueda medir, ningún precio es
defendible» (`:79-80`). No lleva marca de hipótesis, no lleva cita, no lleva
autor. Un lector que no sea ingeniero la va a leer como una restricción legal o
técnica. Es un juicio.

**H2 — El brief mezcla «no puedo medir» con «no puedo vender».** `[OR]`
Son dos problemas con dos soluciones distintas y el documento los trata como uno.
De ahí sale la sensación de que el producto no está listo, cuando lo que no está
listo es una feature.

**H3 — El brief nunca dice qué recibe el comercio el día uno.** `[OR]` sobre
`[HV]`
El destinatario no encuentra en 366 líneas la respuesta a «¿qué me dan si pago
hoy?». Es la pregunta 4 del propietario y el brief la rodea sin responderla.

**H4 — No hay evidencia de demanda, y el brief no la pide.** `[OR]`
No hay una línea sobre cuántos comercios podrían comprarlo, quiénes son, ni qué
hacen hoy. Sin eso, «qué modelo» es una pregunta sin sujeto.

**H5 — Contradicción de alcance sobre el precio.** `[HV]`
El brief declara el precio fuera de alcance y después argumenta sobre $9.990 y
$29.990 en tres secciones. El lector no sabe si puede opinar sobre el precio.

**H7 — Las alternativas no se pueden elegir.** `[OR]`
Ocho opciones con ocho objeciones heterogéneas. Ninguna queda marcada como
descartada por un motivo comparable. El lector no puede usar la sección.

**H8 — Ninguna alternativa acota el costo que el brief dice que es el
dominante.** `[OR]`
El documento identifica un costo y luego elige un modelo sin volver a mirarlo.

**H9 — La exposición de §1 es independiente de todo lo demás.** `[OR]`
Se puede cerrar hoy, sin decidir nada. El brief la ordena después de las
decisiones.

**H10 — Jerga en las secciones que llevan el diagnóstico.** `[OR]`
«Entitlement», «clave publicable», «PostgREST», «SSRF», «service role», «RLS».
El propietario del negocio es quien tiene que decidir a partir de estas
secciones, y están escritas para un ingeniero.

**H11 — «Cuponera» no está definida, y el hallazgo del lado de la demanda está
enterrado.** `[OR]` sobre `[HV]`
El brief usa «vitrina» y «cuponera» sin explicar que es una página pública con
cupones de terceros —y que hoy tiene **1 cupón público**. El hallazgo de que no
hay demanda aparece únicamente como objeción a una alternativa, en una sección
que el lector ya aprendió a saltar.

**H12 — Reveniu podría ser un canal de venta, no solo un cobrador.** `[HC]`
El brief lo trata como una decisión de pasarela. Un proveedor con comercios
instalados es una vía de distribución.

**H13 — El valor de los dos productos puede estar invertido.** `[HC]`
El brief asume que el cupón es el producto principal y SmarterBOT el accesorio.
Para un comercio sin audiencia, la automatización del contacto puede valer más
que el cupón. Si eso es cierto, el brief está optimizando el producto secundario.

## Las 18 preguntas que haría el comercio

Escritas en primera persona. Ninguna tiene respuesta en el brief.

**Antes de pagar**
1. ¿Qué me dan si pago hoy?
2. ¿Cuántos cupones al mes? Cada página dice una cifra distinta.
3. ¿Puedo probarlo un mes antes de decidir?
4. ¿Quién más lo usa en mi rubro?
5. ¿Qué pasa si lo dejo de pagar? ¿Se borran mis cupones?
6. ¿Mis clientes tienen que bajarse una app?

**Sobre el producto**
7. ¿Quién ve mi cupón? ¿Quién llega a la cuponera?
8. ¿Puedo imprimir el cupón para el mesón?
9. ¿Puedo tener varias personas trabajando en la misma cuenta? *(respuesta
   verificada: no; no hay multiusuario)*
10. ¿Puedo darle acceso a mi hija sin darle mi clave? *(no)*

**Sobre el dinero**
11. ¿Queda registro de que pagué? ¿Me llega boleta?
12. ¿Me pueden subir el precio sin avisar?
13. ¿Qué pasa si no me resulta? *(el sitio promete 30 días y los términos dicen
    que las tarifas no son reembolsables: `app/precios/page.tsx:168` contra
    `app/condiciones/page.tsx:81`)*
14. ¿Puedo pagar por transferencia? *(el FAQ la promete; es incompatible con un
    cobro automático recurrente)*

**Sobre lo que promete el sitio**
15. ¿Dónde está la IA? *(está anunciada en al menos nueve lugares, incluidos los
    términos)*
16. ¿Cuántos negocios usan esto? *«cientos», dice la portada; hay 5 perfiles*
17. ¿Por qué mi cupón sale con marca de agua si pagué el plan Pro? *(el código la
    emite siempre)*
18. ¿Con quién hablo si algo falla? *(no hay canal de soporte en el producto;
    solo un `wa.me` en la página de precios)*

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar?** El comercio no sabría qué es un
   canje ni por qué se lo cobran.
2. **¿Madurez técnica confundida con potencial comercial?** Sí, y el brief no lo
   nota porque está escrito desde dentro.
3. **¿Modelos sin canjes?** Sí, y el brief no los hace legibles para el comprador.
4. **¿Valor concreto desde el día uno?** Es la pregunta que el brief no responde
   (H3). **Este lente la identificó como el vacío más grave del documento.**
5. **¿Suscripción como modelo principal?** El comerciante pregunta por mes
   («¿cuánto al mes?»); el documento no llega a discutirlo.
6. **¿Alternativas?** Existen; ninguna es evaluable (H7).
7. **¿Reveniu y Mercado Pago compiten?** El comercio reconoce Reveniu (H12).
8. **¿SmarterBOT?** Puede importarle más que el cupón (H13).
9. **¿Riesgo de automatizaciones en precio fijo?** El brief no lo puede
   cuantificar.
10. **¿Empezar sin prometer lo inexistente?** Es lo que el comercio espera por
    defecto, y el sitio hoy no lo cumple.

## Su frase más útil

**«El hallazgo central del brief —que no hay demanda— está enterrado como
objeción a una alternativa, en la sección que el lector aprendió a saltar.»**
`[OR]`
