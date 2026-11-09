# Review EGM consolidada — documento de diseño de EcoCupon.cl

Método: Elephant-Goldfish Model, preset **"Consolidated report with all review
rubrics"** (recorrido completo sin checkpoints intermedios).
Documento evaluado: `docs/designs/2026-11-09-egm-diseno-arquitectura.md`.
Fecha: 2026-11-09.

Los revisores Goldfish corrieron **en contexto limpio**, sin la conversación que
produjo el documento. Ningún hallazgo de este informe está inventado ni atribuido a
un agente que no lo emitió: cada uno está en el archivo de su etapa.

## Etapas ejecutadas

| Etapa | Revisor(es) | Hallazgos | Informe |
|---|---|---|---|
| Stage 5 — Initial Zoom Out | `egm-zoom-out` | 9 (1 bloqueante) | `zoom_out_report.md` |
| Stage 6 — Comprehension | `egm-comprehension` | 9 (1 bloqueante) | `comprehension_report.md` |
| Stage 7 — Critic | `egm-design` · `egm-structural` · `egm-style` | 13 · 20 · 14 | `critic_design_report.md`, `critic_structural_report.md`, `critic_style_report.md` |
| Stage 8 — Intermediate Zoom Out | `egm-zoom-out` | seguimiento de 63 + 5 nuevos | `intermediate_zoom_out_report.md` |
| Stage 9 — Implementation Readiness | `egm-implementation-readiness` | veredicto **NO LISTO** | `implementation_readiness_report.md` |

## Resultado del seguimiento (Stage 8)

De los 63 hallazgos acumulados hasta Stage 7: **15 RESUELTO, 9 PARCIAL,
39 ABIERTO**. Restringido a bloqueantes e importantes (28): 9 resueltos,
6 parciales, 13 abiertos.

Los tres bloqueantes coincidentes de Stage 7 (D7-01, S7-01, Y7-01) eran el mismo
hecho: el documento afirmaba que la CSP se generaba con nonce en `proxy.ts`, cuando
esa implementación se había revertido tras comprobarla contra un build de
producción. **Cerrado en el documento y verificado en el código.**

## Correcciones aplicadas tras la review

| Hallazgo | Corrección |
|---|---|
| CSP con nonce (D7-01/S7-01/Y7-01) | Sección de cabeceras reescrita: CSP estática en `next.config.mjs`, motivo documentado y evidencia del descarte |
| HSTS con `includeSubDomains` (Z5-02/Y7-03) | Corregido a `max-age=63072000` sin `includeSubDomains`, con el motivo |
| CUJ de registro, cambio de contraseña y logout (Z5-01) | Añadidos como CUJ 7, 8 y 9 con `archivo:línea` |
| Análisis estructural no citado (C6-02/S7-04) | Añadido a *Additional Resources* junto al runbook y estos informes |
| `/api/coupon-image` "cara por visita" (Z5-03) | Corregido: tiene caché CDN `s-maxage=86400` |
| Errores "hoy en inglés" (Z8-01) | Corregido: `lib/auth-errors.ts` ya los traduce |
| Plan decía "ningún archivo modificado" (S7-02/Z8-02) | Reemplazado por el estado real por ítem |
| Aviso de 404 descrito como actual (Z8-03) | Precisado: ocurre **tras** aplicar `0010` |
| Falta el paso de aplicar `0010` (Stage 9) | Añadido Paso 0, remitiendo al runbook |
| Comandos apuntaban a la base local (Stage 9) | Runbook reescrito con `--linked` en todos los comandos |
| `0005`/`0006` con versión timestamp (Stage 9) | Documentadas las dos salidas: alinear nombres con `git mv` (recomendada) o reparar también esas dos |
| Criterios no verificables (Stage 9) | Runbook Paso 5 con SQL y HTTP exactos y línea base obligatoria |

## Veredicto

- **Documento de diseño**: utilizable. Tres revisores independientes coincidieron en
  que, tras la remediación, no quedan afirmaciones falsas sobre el código; los 39
  hallazgos abiertos son en su mayoría trabajo futuro legítimo, no defectos de
  redacción o de diseño.
- **Implementación**: **NO LISTA**. Bloqueos reales: (1) falta el paso que aplica
  `0010`; (2) los comandos de Supabase deben llevar `--linked`; (3) el historial no
  puede quedar consistente sin resolver `0005`/`0006`; (4) el enlace privado no se
  puede verificar en local sin `SUPABASE_SERVICE_ROLE_KEY`.

## Límites de esta review

No se pudo verificar: la cabecera servida en producción real (solo en un build
local), la presencia de `SUPABASE_SERVICE_ROLE_KEY` en Vercel, la ejecución de los
flujos E2E que requieren cuenta autorizada (están en `test.fixme`), ni el efecto de
aplicar `0010` (no se aplicó).