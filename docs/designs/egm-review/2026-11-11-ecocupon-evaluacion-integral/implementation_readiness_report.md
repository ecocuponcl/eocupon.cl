# Etapa 9 — Aptitud de implementación

Revisores: `egm-implementation-readiness` y `egm-codebase-details`. Contexto limpio.

- **Objetivo:** `docs/designs/2026-11-11-ecocupon-evaluacion-integral.md`
- **Rango:** archivo completo. El documento no tiene plan de implementación, así que
  no hay `DetailedRange` que auditar por separado.
- **Fecha:** 2026-11-11

---

## Bloqueantes

### B1 — El remedio propuesto para `user_exists` no cierra el oráculo. `[HV]`

§9 prescribe «mover la comprobación a una ruta de servidor y luego revocar
`EXECUTE`». El llamador es una página pública
(`app/auth/recuperar/page.tsx:33`), servida a visitantes anónimos: **una ruta de
servidor pública devuelve el mismo booleano al mismo llamador anónimo.** El
hallazgo sobrevive al arreglo.

Lo único que cierra el oráculo es limitar la tasa, exigir captcha o responder de
forma indistinguible. Nada de eso está en §9. Tampoco se menciona que
`e2e/recuperacion-correo-inexistente.spec.ts` afirma el comportamiento de
enumeración actual: el cambio rompe un test existente sin reemplazo especificado.

### B2 — El aviso de §9 sobreestima lo hecho, y el ítem que dice saltarse sigue
vivo. `[HV]`

§9 declara que los ítems P1 6-10 «ya están hechos y desplegados». **El ítem 8, todos
los CTA a 44 px, no lo estaba:** `components/ui/button.tsx:24,26` definían
`default` = 36 px y `lg` = 40 px, y la portada usa `size="lg"`.

**Corregido en esta misma ronda:** los tamaños base pasaron a 44 px (`h-11`) y 48 px
(`h-12`). El ítem ya no es falso.

### B3 — Ningún ítem pendiente es ejecutable. `[OR]`

El documento declara en su cabecera que no autoriza implementación y no tiene plan.
Para los ítems que declara pendientes (§9: 15, 16, 17 y el bloque de seguridad) no
hay archivo, ni cambio de esquema, ni firma, ni prueba de aceptación.

El ítem 16 —«estado de plan escrito por el servidor, con marca de agua y cupo
dependientes»— omite: qué tabla o columna cambia (`plan_type` existe en
`0001_init.sql:42` y nadie la escribe), quién la escribe (el contrato del webhook
no está especificado en §4), dónde va la compuerta de la marca de agua
(`app/api/coupon-image/route.tsx:183` es una cadena fija) y cómo se cuenta el cupo
mensual. El ítem 17 no nombra proveedor de analítica, ni eventos, ni destino.
Un ingeniero solo puede inventarlos.

---

## Graves

### G1 — El «riesgo legal» de §8 es falso hoy. `[HV]`

Afirma que las promesas 1, 2, 3, 6 y 8 están «también en los términos y
condiciones». `app/condiciones/page.tsx` **no contiene ninguna** de ellas, y para la
6 dice lo contrario. Era cierto cuando se escribió el documento: la promesa de IA
estaba en `:44` y se retiró después. La exposición sobre la que se construye el
argumento ya no existe en el documento contractual que nombra.

### G2 — Varias citas `[HV]` dejaron de resolver. `[HV]`

`app/page.tsx:55-58` es hoy el sello «Imagen, enlace y código QR», no el de IA.
`:82-121` es el cupón real, no la maqueta. `:257` es un `/mes`. `:312` es el botón
«Suscribirse», no el enlace muerto de «Contacto». La sustancia está marcada como
superada, pero los números de línea no.

### G3 — §5.3 quedó sin marcar y es parcialmente falsa. `[HV]`

Ya no queda ningún `href="#"` en `app/`. El «2024» sobrevivía **solo en `/precios`**
(`app/precios/page.tsx:176`); la portada y la cuponera ya usaban el año dinámico.

**Corregido en esta misma ronda:** `/precios` también usa año dinámico.

### G4 — §6.1 y §7.1 siguen afirmando que el hero muestra una maqueta y un sello
falso de IA. `[HV]`

El hero renderiza hoy un cupón real de 4Time Repuestos (`app/page.tsx:87-157`). La
adenda cubrió §5, no estas dos secciones.

### G5 — La marca de agua no aparece en ninguna parte y la fila 2 de §8 queda sin
evidencia. `[HV]`

La cadena «Sin marca de agua» no existe en `app/page.tsx` ni en
`app/precios/page.tsx`. La fila cita una promesa que ya no se publica.

### G6 — El cupo gratis sigue sin aplicarse, y las promesas realmente falsas no
están en P0. `[HV]`

La tarjeta viva de Business (`app/precios/page.tsx:52-59`) lista «Cupones
ilimitados», «Cupones con tu logo», «Atención por WhatsApp», «Acompañamiento
personalizado», «Vistas y compartidos» y «Soporte dedicado». API, multiusuario,
24/7 y branding custom **ya no están**. Las que sí siguen sin respaldo detrás
—«Cupones ilimitados», porque no hay ningún tope en código, y «Vistas y
compartidos», porque los contadores son falsificables— **no aparecen en P0**.

### G7 — La «con IA» del interior del producto. `[HV]`

`app/dashboard/page.tsx:109` y `app/dashboard/mis-cupones/page.tsx:155` seguían
diciendo «con IA». El ítem P0.1 acotaba la retirada a «portada, precios, metadatos y
términos», así que los dejaba fuera.

**Corregido en esta misma ronda:** ambos textos ya no mencionan IA.

### G8 — La precondición de `0010` quedó sin registrar en el archivo. `[HV]`

`supabase/migrations/0010_harden_rls_and_timestamps.sql:3` seguía diciendo «NO
aplicada todavía», y su precondición sobre `SUPABASE_SERVICE_ROLE_KEY` no tenía
constancia de haberse verificado.

**Corregido en esta misma ronda:** el archivo declara que se aplicó el 2026-11-11,
que la sonda respondió 401 antes de aplicarla, y el efecto medido.

---

## Verificado correcto contra el repositorio

`coupons.user_id` + `created_at` existen (`0001_init.sql:18,32`); `profiles.email`
(`:39`) lo puebla `handle_new_user` (`:48-60`); `plan_type` (`:42`) no lo lee nadie
y la marca de agua es incondicional (`app/api/coupon-image/route.tsx:183-185`);
`user_exists` sigue concedida a `anon` (`0004_user_exists.sql:31`) y los contadores
también (`0002_security.sql:221-222`), porque `0010` solo revoca `TRUNCATE` y el
`EXECUTE` de `handle_new_user`; no hay cupo en ninguna parte del código; la
validación de logo por firma de bytes, el rechazo de SVG y el límite de 5 MB están
en `app/api/upload-logo/route.ts:9,13-43,71-87`; la imagen se cachea 24 h
(`app/api/coupon-image/route.tsx:207-208`).

## No verificable desde el repositorio

Los 5 usuarios, 4 cupones, 1 público, el artefacto `ERP50%`, los 19 objetivos
táctiles y los anchos de 417 y 405 px son datos de producción, medidos con
Playwright y no reproducibles desde el código.
