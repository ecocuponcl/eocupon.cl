# Etapa 6 — Prueba de comprensión (revisor `egm-comprehension`)

- **Objetivo:** `docs/designs/2026-11-11-ecocupon-evaluacion-integral.md`
- **Fecha:** 2026-11-11
- **Contexto:** limpio. El revisor no vio esta conversación.

---

## Qué propone este documento

EcoCupon.cl es un SaaS chileno donde los comercios crean cupones de descuento y los
comparten por enlace o QR. El documento es un diagnóstico integral de ese producto
como negocio, del 2026-11-11, y no autoriza implementación. Su argumento: el
problema real no es el modelo de cobro sino que nadie ha comprado nunca y que el
sitio publica promesas que el producto no cumple. Por eso recomienda, en orden:
retirar las promesas falsas, arreglar la puerta de entrada (registro, desborde
móvil, error de hidratación), vender a mano lo que ya existe, y solo después
decidir la forma del precio —acceso más cupo mensual de cupones, cobrado
recurrentemente. Presenta además un diseño completo de suscripción
(Gratis/Pro/Business con mecánica de dunning), requisitos de pasarela, evaluación
de diseño y experiencia, una medición de producción con Playwright, una tabla de
contradicciones entre marketing y producto, y una lista de oportunidades P0–P3.
Una adenda indica qué hallazgos ya se corrigieron y publicaron, y admite que §2–§4
están sobreestimadas para un producto con cero ventas.

## Cómo funciona el sistema existente, según este documento

Un producto con código, cupones, códigos, descuentos, vencimiento, subida de logo
validada por firma de bytes, un PNG del cupón con QR descargable servido desde
`/api/coupon-image`, una página pública por cupón bajo un UUID, botones de
compartir y contadores de vistas y compartidos. Los datos viven en una base con
`coupons.user_id`/`created_at`, `profiles.email`, un trigger `handle_new_user` y
una columna `plan_type` que nada lee. Los pagos pasan por un enlace de checkout de
Reveniu para Pro y un enlace de WhatsApp para Business. Hay 5 cuentas y 4 cupones,
1 público y es un artefacto de prueba. Producción venía por detrás del repositorio;
el documento dice que ya se publicó.

## Hallazgos

**1. Bloqueante — El documento se contradice sobre si algo se cambió.**
El encabezado (`:5-6`) y «Límites de este informe» (`:506-507`) afirman que no se
modificó código, contenido ni despliegue. La adenda (`:11-28`) reporta código
añadido, correcciones hechas y publicación a producción. Un lector no puede saber
si diagnostica un sistema intacto o uno modificado.

**2. Bloqueante — El resumen ejecutivo y §5/§7 presentan como vigente justo lo que
la adenda marca resuelto.**
§1 lista «la evidencia, medida hoy» incluyendo el error de hidratación, el
desborde móvil y el registro sin etiquetas; §5.4, §5.7 y §7.2 los repiten con
números y sin marca en el lugar. La tabla de la adenda los invalida
retroactivamente. Nada en §1–§7 dice qué cifras siguen valiendo.

**3. Bloqueante — Referencias cruzadas rotas.**
La línea 140 cita «§8.3» y la 173 cita «§8.6»; §8 no tiene subsecciones, solo una
tabla. La línea 31 cita «§11.1»; §11 es una lista plana. La línea 28 cita «§3.1 de
`…revision-base-datos.md`» con una ruta elidida y sin resolver. El lector no puede
llegar a la evidencia citada.

**4. Grave — §2, §3 y §4 siguen escritas como recomendaciones mientras la adenda
las degrada.**
La adenda acepta que ese material pertenece a otro documento y que la unidad
recomendada es solo una hipótesis; §1 dice «La forma de precio recomendada», la
tabla de §2.2 dice «**Recomendado**», §3 se titula «Propuesta de suscripciones».
El lector se lleva dos posiciones opuestas.

**5. Grave — El vocabulario EGM nunca se define.**
«El workflow EGM», «etapa 5 de `egm-review`», «los siete Goldfish» / «los siete
lentes» (§10) y `/egm:egm-brainstorm` son internos del proyecto y no están
definidos; un lector nuevo no sabe qué son los siete lentes ni qué le cuesta al
informe la ausencia de §10.

**6. Grave — `[HV]` se define como «hecho verificado, con archivo:línea o
medición» y se aplica a cosas que no son evidencia.**
«Cero ventas, confirmado por el propietario» no tiene archivo, línea ni medición;
tampoco las afirmaciones agregadas de §7.

**7. Menor — Términos de dominio sin definir.**
«dunning», «licencia blanca», «cuponera» (usada en todo el documento, nunca
definida), «Reveniu» (pasarela externa sin enlace) y «4Time Repuestos» (el origen
del cupón real, sin explicar).

**8. Menor — Nunca se declara la moneda.**
$9.990 no está marcado como CLP, mientras §6.1 le reprocha al sitio no mostrar
«ningún CLP».
