# Etapa 7 — Crítica (revisores `egm-design`, `egm-structural`, `egm-style`)

- **Objetivo:** `docs/designs/2026-11-11-ecocupon-evaluacion-integral.md`
- **Fecha:** 2026-11-11
- **Contexto:** limpio, tres revisores independientes.
- **Nota de proceso:** el protocolo pide las etapas en serie; las etapas 6 y 7 se
  ejecutaron en paralelo por tiempo. Se declara aquí.

---

## Bloqueantes

### B1 — La adenda no se propaga. Los tres revisores lo encontraron por separado.

La adenda marca §5.4, §5.7, §7.2, §7.3, §7.4 como resueltos y desplegados, pero
esas secciones siguen leyéndose como defectos vivos, y §1 las repite como
«evidencia medida hoy». Peor: **§9 ordena trabajo ya hecho** (ítems P0 1-5 y P1
6-10). Un lector que siga el plan rehace lo desplegado.

El revisor de estructura lo dice con precisión: la columna de línea base «satisface
el formato, no el requisito». Una tabla desprendida arriba de §1 no evita que el
cuerpo se lea como estado actual.

### B2 — Dos filas de §8 son falsas contra el repositorio. `[HV]`

- Fila 3 («3 vs 5 cupones»): `app/page.tsx` dice **3**, igual que `/precios`. No
  existe el «5».
- Fila 5 («50 vs Cupones ilimitados»): `app/page.tsx` y `/precios` dicen **50**.
  «Cupones ilimitados» es de **Business**, no de la portada ni de Pro.

La premisa de la sección —«Cada fila es verificable»— falla en dos filas. La adenda
retira las filas 1, 2 y 4 sin tocar estas dos.

### B3 — Las citas `[HV]` dejaron de resolver. `[HV]`

- §5.1 cita `app/page.tsx:55-58` para el sello de IA. Esas líneas son hoy el sello
  del ticket.
- §8 fila 2 cita `app/page.tsx:257` para «Sin marca de agua». La cadena ya no existe
  en ese archivo.

Causa: el código se movió después de escribirse el documento. El documento nunca
separa «la línea se movió» de «la afirmación nunca fue cierta», así que ninguna
etiqueta es auditable.

### B4 — La superficie de abuso quedó fuera de las prioridades, y una de las cosas
que el plan propone vender **es** esa superficie. `[HV]`

`0010:99-104` documenta dos problemas abiertos: `increment_views` y
`increment_shares` son invocables por `anon` sin límite, y `user_exists(text)` es
un oráculo de enumeración de correos. El informe marca la fuga de RLS como
«Cerrada» y **nunca lleva ninguno de los dos a §9**.

Consecuencia doble: no hay mitigación ni monitoreo para un oráculo de enumeración
abierto; y el plan Pro promete «vistas y compartidos» que el propio repositorio
declara falsificables.

---

## Graves

### G1 — La hipótesis del cupo la falsifican los datos del propio informe. `[HV]`

Cinco cuentas han producido cuatro cupones en total. Un cupo mensual es un límite
que ninguna cuenta observada puede alcanzar, así que el «motivo de upgrade»
declarado no puede dispararse. La «N» queda indefinida siendo el único límite
definido del producto, y §9 P0.3 tampoco se puede construir sin el estado de plan
que se difiere a P3.16.

### G2 — La recomendación central es circular e intesteable. `[OR]`

Vender a mano exige un precio; el precio se difiere a una comparación de pasarelas
que nunca se ejecutó. La única acción recomendada no tiene precio, ni prospecto
nombrado, ni plazo, ni criterio de éxito, así que no puede producir el dato de
demanda que el documento dice que falta. Y la instrumentación (§9 P3.17) queda
**debajo** de elementos cosméticos de P2, cuando el diagnóstico es «no hay demanda
medida».

### G3 — Se afirma un fracaso donde el informe admite ignorancia. `[OR]`

§5.5: «Ese canal existe y nunca ha convertido». §11.1 dice que se desconoce si
alguna vez se intentó vender. Con cero ventas, **ningún canal ha convertido**: es
un resultado nulo, no un hallazgo sobre WhatsApp. Y esa afirmación se usa para
degradar Business a venta asistida.

### G4 — El logo se declara verificado en §2.1 y excluido en la adenda. `[HV]`

§2.1 lo lista como producto verificado; la adenda excluye «subida de logo» como
dato que el autor no tiene.

### G5 — Sin reproducibilidad ni reversión. `[OR]`

Las mediciones viven solo en `.playwright-mcp/`: sin scripts, sin método para el
conteo de «19 objetivos <44px», sin artefacto retenido para comparar tras el
próximo despliegue. «Publicar `main`» no tiene verificación ni reversión.

### G6 — Números inventados presentados como requisitos. `[OR]`

«3 reintentos + 7 días de gracia», «7–14 días sin tarjeta», «correos a los 7 y 21
días» están bajo el encabezado «Requisito comercial» sin ninguna base. Deben ir
como propuesta, no como requisito.

### G7 — §9 afirma un ordenamiento sin datos. `[OR]`

«Ordenadas por relación entre valor y esfuerzo»: no hay estimación de esfuerzo ni
de valor por ítem; «horas», «días» y «semanas» se afirman sin derivación.

### G8 — §2.2 retracta la premisa y conserva la conclusión. `[OR]`

La adenda acepta la objeción de sesgo de disponibilidad, pero el cuerpo mantiene
«la unidad aparece sola y ya está en la base» y §11.2 sigue pidiendo aprobarla.

### G9 — §7.3 «Esto confirma» es una inferencia etiquetada como hecho. `[OR]`

Un `<title>` idéntico no confirma falta de despliegue: `metadata` no aplicada o
caché estática producen el mismo síntoma, y esa alternativa no se probó.

---

## Menores

- **«Ocho promesas»** contra 10 filas de §8 y un párrafo legal que cita las filas
  1, 2, 3, 6 y 8: sin reconciliación.
- **Vocabulario EGM sin definir**: «el workflow EGM», «etapa 5 de `egm-review`»,
  «los siete Goldfish», `/egm:egm-brainstorm`.
- **Jerga que el propietario no puede accionar**: `dunning`, webhook idempotente,
  prorrateo, `anon`, UUID, migración `0010`, `[HV]/[HC]/[OR]/[DP]`.
- **Adjetivos de calidad sin respaldo etiquetados como hallazgos**: «es un producto
  real y acotado», «están bien resueltos», «el cliché número uno».
- **Repetición**: el error #418 aparece en §1, §5.7, §7.1 y §7.5; el fallo de cuota
  de agentes aparece cinco veces; §6.1 repite §5.1, §5.3 y §7.4.
- **`N cupones por mes`**: un marcador que oculta un dato que el documento ya tiene.
- **La moneda nunca se declara**: $9.990 sin marcar como CLP, mientras §6.1 le
  reprocha al sitio no mostrar ningún CLP.
- **§6 anuncia resultados que luego niega**: abre con «ningún plugin de diseño está
  instalado» y después reporta un agente de revisión de interfaz.
- **§6.1 y §10 duplican** el mismo material dos veces.
- **Clave de conciliación**: `profiles.email` es PII mutable y el checkout externo
  no lleva identificador de cuenta; la idempotencia debe llavearse sobre el id del
  evento de la pasarela, no sobre la identidad.
