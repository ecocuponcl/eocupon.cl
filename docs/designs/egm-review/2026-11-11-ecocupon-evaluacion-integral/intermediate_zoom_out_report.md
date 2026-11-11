# Etapa 8 — Zoom Out intermedio (revisor `egm-zoom-out`, segundo pase)

- **Objetivo:** `docs/designs/2026-11-11-ecocupon-evaluacion-integral.md`
- **Fecha:** 2026-11-11
- **Contexto:** limpio. Vio los informes de las etapas 5, 6 y 7, y el documento ya
  corregido.

**Veredicto de conjunto:** como registro de medición fechado, con correcciones, se
sostiene. Como evaluación vigente, no: coexisten tres capas de verdad, y dos
documentos de la misma fecha se contradicen sobre qué está desplegado.

---

**Z8-01 — Bloqueante. La columna «Publicado» contradice al documento hermano de la
misma fecha.** `[HV]`

La adenda marca §5.4, §5.6, §7.2 y §7.4 como «**Resuelto**… Publicado». El
documento que describe esos mismos cambios,
`2026-11-11-ecocupon-entrega-funcional.md:6`, decía «cambios aplicados y
verificados en local. **No desplegados**», y enumeraba exactamente esos ítems.
La única evidencia de despliegue que la adenda ofrecía era el documento que la
negaba.

**Corregido:** el informe de entrega ahora declara los commits publicados y la
verificación contra `www.ecocupon.cl`.

**Z8-02 — Grave. §10 pide ejecutar un proceso cuyo resultado ya existe y no se
cita.** `[HV]`

`docs/designs/egm-review/2026-11-11-concepts-brief/` contiene siete informes de
lente (00–07) y `docs/designs/concepts_brief.md` es su síntesis: misma fecha,
mismo autor, mismo repositorio. El documento no los menciona en ninguna línea y
declara como requisito que el propietario corra `/egm:egm-brainstorm` para
completar §10. **La laguna declarada no existe.**

**Z8-03 — Grave. §2–§4 diseñan una suscripción sobre un estado que un documento
hermano declara falsificable.** `[HV]`

`concepts_brief.md:82-106`: `profiles_update_own` permite al titular escribir su
propio `plan_type`. Cualquier límite que lo lea queda decorativo. El documento pide
que la marca de agua dependa de un «estado de plan real» sin decir dónde vive, ni
notar que la única columna existente es escribible por el usuario: es el dead-end
que propone construir.

Además §3 sigue vendiendo «estadísticas de vistas y compartidos» como beneficio de
Pro, mientras el bloque de seguridad de §9 dice que esos contadores son
falsificables. **El aviso de vigencia se aplicó a §9 y no se propagó a §3.**

**Z8-04 — Grave. Superficie a recortar, ya reconocida y no ejecutada.** `[OR]`

La adenda admite que §2–§4 «debería vivir en un documento aparte» y los conserva
completos, unas 110 líneas, con §1 y §11.2 presentando la misma recomendación. El
documento aparte ya existe. Mantenerlo aquí duplica la recomendación en dos fuentes
y conserva el bloque más largo justo donde §1 declara que el problema no está.

**Z8-05 — Grave. El patrón de arreglo explica el defecto de fondo.** `[OR]`

Las correcciones se aplicaron reclamación por reclamación, así que conviven tres
capas de verdad: la tabla de la adenda, los avisos en §1 y §9, y los tachados en
§8. Ninguna lectura única entrega el estado actual. Es defecto estructural, no de
redacción.

**Lo que sigue sin abordarse:**

- El «Alcance» declara *producto, negocio y unidad comercial*, y **«negocio» nunca
  se analiza**: sin comprador, sin segmento, sin canal, sin sustitutos.
- **Nunca se hace la pregunta YAGNI a nivel de negocio**: un comercio ya tiene
  WhatsApp, Instagram y una impresora. ¿Por qué pagaría?
- No hay criterio de continuar o detener, ni lado de costo.
- El problema raíz se enuncia como «nadie compró» y **nunca se pregunta si la
  necesidad existe**.
