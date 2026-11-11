# Lente `egm-structural` — estructura del documento y del argumento

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** auditar la estructura, el orden de lectura y la validez de la
  cadena de razonamiento. Atacar la conclusión central.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** **la cadena de razonamiento es válida hasta su tercera premisa y
  se rompe en la conclusión por sustitución de predicado.** Y la premisa que
  sostiene todo el documento nunca está escrita.

> Síntesis del Elefante. Etiquetas `F-01`–`F-16` del informe original; `F-07`,
> `F-08`, `F-11`, `F-15` y `F-16` no se recuperaron y no se citan en el informe
> consolidado. Los informes crudos no se persistieron.

## El trazado de premisas

El aporte más valioso de este lente: reconstruyó el argumento del brief como una
cadena formal y ubicó el punto exacto donde salta.

| | Enunciado | Estatus |
|---|---|---|
| P1 | El producto no mide el resultado real que el comercio obtiene | Verdadero |
| P2 | `views` y `shares` los escribe el visitante sin autenticación | Verdadero |
| P3 | Por lo tanto esas métricas no son confiables como base de cobro | **Válido** |
| **C1** | **Por lo tanto no hay ninguna unidad de cobro posible** | **Inválido** |
| P4 | *(implícita)* Solo una unidad medible y no inflable es base legítima de precio | **Nunca escrita** |

**El salto está entre P3 y C1.** De «estas métricas no sirven» se concluye «no hay
ninguna unidad». Es una **sustitución de predicado**: se pasa de una propiedad de
*estas* métricas a una propiedad del conjunto vacío. Y la premisa que haría falta
para que el salto fuera válido —P4— es exactamente la que el documento nunca
declara y que los siete lentes rechazan por separado.

## Hallazgos

**F-01 — La cadena oculta su premisa mayor.** `[OR]`
Ver arriba. Sin P4, C1 no se sigue. Con P4, el brief tendría que defender que el
software no puede cobrarse por acceso ni por capacidad, lo que es falso en su
propio stack.

**F-02 — Tres afirmaciones contradicen la garantía de verificación del propio
brief.** `[HV]`
- **F-02a** — §2 declara que un `grep` de `canje`/`redeem` «no devuelve nada».
  Devuelve una coincidencia (`app/auth/confirm/route.ts:9`).
- **F-02b** — §5 invierte el estado del despliegue: `main` local está 3 commits
  **adelante** de `origin/main`, no atrás.
- **F-02c** — §9 cita «Reveniu, verificado antes» sin archivo, línea, fecha ni
  artefacto.
Las tres viven en la sección `:356-358`, donde el brief afirma haberlas
verificado «una por una desde el contexto principal».

**F-03 — «Siete promesas» suma dos sentidos distintos de «no existe».** `[HV]`
El inventario mezcla promesas de features que **están implementadas pero no
limitadas por plan** (cupones ilimitados, marca de agua) con promesas de features
que **no existen** (IA, API, multiusuario). Son dos defectos distintos, con dos
arreglos distintos, contados como uno. Y el conteo es incompleto: la promesa de IA
aparece en al menos nueve lugares más, incluidos los metadatos indexados y el
documento contractual.

**F-04 — `profiles.email` es una clave de unión.** `[HV]`
Existe (`0001_init.sql:39`) y `handle_new_user` la puebla. §4 niega que exista
clave alguna, y el propio brief la usa dos párrafos después («por correo o
monto»). Falta un identificador determinista, no toda clave.

**F-05 — El Overview enumera tres razones que no cubren su propia conclusión, y
omite la sección más repetida.** `[HV]`
Las tres razones de `:12-31` no explican por qué «elegir una pasarela» queda en el
análisis, y omiten §1 (las promesas publicadas), que el propio brief describe como
el hallazgo más repetido de los siete revisores.

**F-06 — §6 declara una jerarquía sin medirla.** `[OR]` sobre `[HV]`
Un «costo dominante» es un resultado de medición. El documento no midió.

**F-09 — El título H1 promete el objeto que el documento descarta.** `[HV]`
«Modelo comercial de EcoCupon.cl: suscripciones, pagos y Smarter.RUT» anuncia una
propuesta de modelo comercial. El documento entrega un conjunto de preguntas
abiertas y concluye que ninguna opción es elegible. El lector que llega por el
título se va sin lo que vino a buscar.

**F-10 — «Alternatives Weighed» no pesa nada.** `[OR]`
El contrato de la plantilla espera alternativas **rechazadas con razón**. El brief
declara que ninguna lo fue. La sección existe por estructura y no por contenido.

**F-12 — Fuente no trazable en §9.** `[HV]`
Ver F-02c.

**F-13 — Las atribuciones a los siete lentes no son auditables.** `[HV]`
El brief cita a lentes individuales y ningún informe de esa ronda está en el
repositorio. La procedencia de la evidencia del documento no se puede verificar.

**F-14 — El brief no se aplica la clasificación que el propietario pidió.** `[HV]`
Ninguna afirmación lleva etiqueta de hipótesis salvo dos bloques de «Límite de
este apartado». Afirmaciones que son hipótesis comerciales están escritas con
sintaxis de hecho: «con clientes pagando, se decide con reembolsos» (`:240`),
«vender ubicación en una vitrina sin público no es vendible» (`:290`), «no genera
ingreso recurrente» (`:280`). Un documento que pide distinguir hechos de
hipótesis debería distinguirlos en sí mismo.

## Su respuesta a las dos preguntas del estándar

**¿A quién le importa?** `[OR]`
El brief no identifica un comprador. No hay una línea sobre quién es el comercio,
cuántos son, ni qué hace hoy en su lugar. El estándar Heilmeier exige esta
pregunta y el documento no la responde.

**¿Cómo sabremos si funcionó?** `[OR]`
No hay métrica de éxito. No hay punto de equilibrio, ni número de clientes
objetivo, ni definición de «esto está funcionando». Sin eso, el brief no se puede
cerrar: no hay condición bajo la cual el propietario pueda decir «listo».

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar?** La pregunta presupone P4. Sin P4,
   no.
2. **¿Madurez técnica confundida con potencial comercial?** Sí: la cadena confunde
   la propiedad de unas métricas con una propiedad del mercado.
3. **¿Modelos sin canjes?** Todos los que no necesiten P4.
4. **¿Valor desde el día uno?** El documento no lo enumera; es su vacío más
   costoso.
5. **¿Suscripción como modelo principal?** Sin punto de equilibrio, la pregunta no
   se puede responder y el brief no lo admite.
6. **¿Alternativas?** Enumeradas sin criterio de elección (F-10).
7. **¿Reveniu y Mercado Pago compiten?** El brief concluye algo que no verificó
   (F-12).
8. **¿SmarterBOT?** Fuera del documento y fuera del repositorio.
9. **¿Riesgo de automatizaciones en precio fijo?** No cuantificado.
10. **¿Empezar sin prometer lo inexistente?** Es la única acción del brief que no
    depende de nada, y la pone tercera.

## Su frase más útil

**«De "estas métricas no sirven" a "no hay ninguna unidad de cobro" hay una
sustitución de predicado, y la premisa que la haría válida nunca está escrita.»**
`[OR]`
