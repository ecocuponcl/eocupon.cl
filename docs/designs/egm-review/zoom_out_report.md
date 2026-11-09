# Stage 5 — Initial Zoom Out Review

Documento revisado: `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
Revisor: agente Goldfish `egm-zoom-out`, contexto limpio (sin la conversación de origen).
Fecha: 2026-11-09. Persistido por el contexto principal (el revisor es de solo lectura).

Recuento: **1 BLOQUEANTE · 3 IMPORTANTE · 4 MENOR · 1 OBSERVACIÓN**

## BLOQUEANTE

### Z5-01 — Faltan flujos de autenticación completos
Ubicación: CUJ (líneas 95-151) y sección "Autenticación" (225-248).
Falta el registro, el cambio de contraseña y el cierre de sesión; solo hay CUJ de
login, recuperación y callback, así que el "mapa de autenticación" que el propio
documento promete queda incompleto.
Evidencia: `app/auth/registro/page.tsx:30` (`signUp`),
`app/auth/nueva-contraseña/page.tsx:47` (`updateUser`),
`components/dashboard-nav.tsx:26` (`signOut`).

## IMPORTANTE

### Z5-02 — HSTS descrito de forma incorrecta
Ubicación: líneas 292 y 440.
El documento afirma `max-age=63072000; includeSubDomains`, pero el código omite
`includeSubDomains` a propósito y lo justifica. Seguir el documento llevaría a
deshacer una decisión deliberada.
Evidencia: `next.config.mjs:21-26`.

### Z5-03 — `/api/coupon-image` mal caracterizada
Ubicación: líneas 369-373.
Dice que compone la imagen "en cada petición" y que es "la ruta más cara por
visita", pero la ruta fija caché de CDN; además el documento se contradice al
llamarla determinista.
Evidencia: `app/api/coupon-image/route.tsx:205-209` (`s-maxage=86400`).

### Z5-04 — Invariantes de escritura ausentes
Ubicación: "Capa de datos" (192-223).
Documenta solo la policy de SELECT y omite los invariantes de escritura
(INSERT/UPDATE/DELETE solo del dueño) y la restricción única
`(user_id, coupon_code)`, que es la que hace fallar un alta duplicada.
Evidencia: `supabase/migrations/0002_security.sql:158-172` y `:185-186`.

## MENOR

- **Z5-05** (91-93): afirma que `CLAUDE.md` declara `docs/egm`; declara
  `docs/designs`. La Open Question parte de una premisa falsa.
- **Z5-06** (196-202): lista `expires_at`, `cta_text` y `plan_type` sin señalar
  que ningún archivo los lee ni escribe.
- **Z5-07**: la capa de datos no incluye el contrato de Storage (buckets `logos`
  y `ecocupon`); solo aparece en el diagrama.
- **Z5-08** (99-107): CUJ 1 impreciso — el insert ya persiste
  `generated_image_url`; el update posterior añade el QR.
  Evidencia: `app/dashboard/crear/page.tsx:103-139`.

## OBSERVACIÓN

- **Z5-09**: el plan de la migración dice "no aplicar sin autorización" mientras
  el análisis estructural afirma que ya se otorgó. Hay que unificar el criterio:
  la instrucción vigente es NO aplicar sin autorización explícita nueva.

## Límites de esta revisión

El revisor no verificó la clasificación estática/dinámica de rutas (requiere
`next build`). No declaró nada como correcto sin evidencia.
