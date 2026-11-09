# Stage 7 — Critic Review: revisor `egm-structural`

*   **Documento auditado**: `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
*   **Rango primario (FeatureRange)**: líneas 1–403 (hasta `## Detailed Implementation Plan`).
    Los hallazgos en 404–487 se marcan con `[plan]` porque pertenecen al rango detallado.
*   **Estándar aplicado**: `feature-spec-standard`
    (`resources/document_standards/feature-spec-standard.md`).
*   **Contexto leído**: `CLAUDE.md`, `AGENTS.md`, `package.json`, `proxy.ts`,
    `next.config.mjs`, `app/**`, `lib/**`, `components/**`, `supabase/migrations/**`,
    `e2e/**`, `docs/designs/2026-11-09-*.md`.
*   **Fecha**: 2026-11-09.

Método: cotejo de cada afirmación del documento contra el archivo que cita, línea por
línea sobre el estado actual del árbol de trabajo (`git status` muestra `proxy.ts` y
`next.config.mjs` modificados). No se modificó ningún archivo.

---

## Recuento

| Severidad | N.º |
|---|---|
| BLOQUEANTE | 2 |
| IMPORTANTE | 7 |
| MENOR | 9 |
| OBSERVACIÓN | 2 |
| **Total** | **20** |

---

## Hallazgos

### S7-01 — BLOQUEANTE — La CSP con nonce en `proxy.ts` no existe; el documento describe un sistema que no es el actual

*   **Ubicación**: sección `### Autenticación`, líneas 231–235; sección
    `## Non-Functional Requirements`, líneas 293–298; línea 31 (límite de fiabilidad);
    `[plan]` línea 437–445.
*   **Qué está mal**: el documento afirma que `proxy.ts` «prefiere una CSP por
    respuesta con un nonce nuevo (`proxy.ts:40-52`)» y que la política «no se define en
    `next.config.mjs` a propósito». Ambas cosas son falsas hoy. `proxy.ts` tiene 25
    líneas, no define cabeceras y solo delega en `updateSession`; su comentario dice
    explícitamente lo contrario («La CSP vive en `next.config.mjs`, no aquí»). La CSP
    vigente sí está en `next.config.mjs` con `script-src ... 'unsafe-inline'`, y su
    comentario declara que el enfoque nonce + `'strict-dynamic'` «se implementó y se
    DESCARTÓ con evidencia». Además, la referencia `proxy.ts:40-52` apunta más allá del
    fin del archivo.
*   **Por qué importa**: el documento se presenta como «el mapa de un sistema que ya
    está en producción». Un lector o agente que lo use como base creerá que producción
    sirve CSP con nonce, evaluará mal el riesgo de XSS y ejecutará el `[plan]` ítem 4
    («comprobar que las rutas estáticas no pierden sus scripts») sobre una configuración
    que ya no existe. El análisis de riesgo de la sección NFR queda sin premisa.
*   **Evidencia**: `proxy.ts:1-25` (sin CSP, comentario en 18-21);
    `next.config.mjs:36-46` (comentario del nonce descartado) y `next.config.mjs:47-61`
    (la CSP real).

### S7-02 — BLOQUEANTE — El plan afirma que nada está hecho y propone dos cambios ya implementados

*   **Ubicación**: `[plan]` líneas 406–407 («Ningún archivo de este plan se ha
    modificado todavía salvo los ya listados en el informe final»), ítem 1 (411–420) e
    ítem 3 (430–436).
*   **Qué está mal**: el ítem 1 propone «añadir `revoke execute on function
    public.handle_new_user() from public`» y el ítem 3 propone «registrar de forma
    explícita cuando no hay `SUPABASE_SERVICE_ROLE_KEY`». Ambos cambios ya están
    escritos: la revocación a `public` existe en `0010:67`, y el aviso existe en
    `app/cupon/[id]/page.tsx:37` con `warnIfNoServiceRole`. El ítem 4 además se marca
    «parcialmente hecho» describiendo una CSP en `proxy.ts` que no está escrita en
    ninguna parte.
*   **Por qué importa**: quien implemente el plan rehace trabajo terminado, o «arregla»
    un archivo que ya cumple. Contradice también la afirmación de la propia sección
    (406–407) sobre el estado de los archivos.
*   **Evidencia**: `supabase/migrations/0010_harden_rls_and_timestamps.sql:64-67`;
    `app/cupon/[id]/page.tsx:36-38`; `lib/supabase/admin.ts:30-36`.

### S7-03 — IMPORTANTE — El valor de HSTS citado no coincide con el código

*   **Ubicación**: líneas 291–292, línea 31, `[plan]` línea 440.
*   **Qué está mal**: se afirma `Strict-Transport-Security:
    max-age=63072000; includeSubDomains`. El valor real es `max-age=63072000`, sin
    `includeSubDomains`, y el archivo documenta por qué se omite.
*   **Por qué importa**: es una cabecera de seguridad; la diferencia cambia el alcance
    declarado del contrato (subdominios) y aparece citada en tres sitios del documento.
*   **Evidencia**: `next.config.mjs:30-35`.

### S7-04 — IMPORTANTE — El mecanismo y el coste del riesgo central se remiten a un documento externo que no está en las fuentes

*   **Ubicación**: líneas 213–216.
*   **Qué está mal**: el `## Goals` (57–58) promete «nombrar, para cada problema abierto,
    el mecanismo exacto de arreglo, lo que cuesta y lo que puede romper». En el punto
    donde toca hacerlo, el documento escribe «El mecanismo de arreglo y su coste están en
    el documento de análisis estructural». Ese documento existe
    (`docs/designs/2026-11-09-egm-analisis-estructural.md`) pero **no aparece** en
    `### Additional Resources` (383–388), que solo lista la auditoría inicial y el
    informe final.
*   **Por qué importa**: rompe la autocontención que exige el estándar (un ingeniero
    nuevo debe entender el diseño sin salir del documento) y deja una referencia sin
    resolver en las fuentes declaradas. La Alternativa B (317–326) mitiga en parte el
    vacío, pero no nombra el coste operativo ni el modo de fallo.
*   **Evidencia**: `docs/designs/2026-11-09-egm-analisis-estructural.md:215-250`
    (sección 7, donde vive el mecanismo); `docs/designs/` (existencia del archivo).

### S7-05 — IMPORTANTE — Los invariantes declarados no están mapeados a criterios de aceptación

*   **Ubicación**: `## Goals` líneas 61–62 frente a `### Verification Plan` líneas 468–481.
*   **Qué está mal**: el documento declara invariantes por componente —«el cliente de
    navegador usa siempre la clave publicable y depende de RLS» (218–223), «ninguna
    página de `/dashboard/*` debe consultar datos antes de comprobar el usuario»
    (246–247), el allowlist de host del logo (263–266), la decisión de tipo por bytes
    (281–282)— pero el plan de verificación solo define cinco comprobaciones: build,
    tipos, lint, E2E y la policy de `coupons`. Ningún invariante de los anteriores tiene
    comando u observación asociada.
*   **Por qué importa**: el objetivo 4 es «criterios de aceptación que se puedan
    comprobar con un comando o una observación». Sin esa correspondencia, el documento
    no sirve para auditarse a sí mismo: los invariantes son prosa, no contrato.
*   **Evidencia**: `docs/designs/2026-11-09-egm-diseno-arquitectura.md:61-62` y
    `:468-481`; código citado en `lib/supabase/client.ts:1-8`,
    `app/dashboard/page.tsx:12-17`, `app/api/coupon-image/route.tsx:11-23`,
    `app/api/upload-logo/route.ts:78-87`.

### S7-06 — IMPORTANTE — Jerarquía de encabezados: dos secciones de primer nivel quedan anidadas bajo `Non-Functional Requirements`

*   **Ubicación**: `## Non-Functional Requirements` (356), `### Additional Resources`
    (381), `### Future Improvements` (390).
*   **Qué está mal**: `Additional Resources` y `Future Improvements` están marcadas como
    H3, por lo que aparecen como subsecciones de `Non-Functional Requirements`, aunque su
    contenido es de nivel de documento (fuentes y mejoras futuras) y van separadas por un
    `---` que sugiere hermanas de `## Alternatives Considered` y `## Detailed
    Implementation Plan`.
*   **Por qué importa**: el estándar de estructura exige jerarquía anidada lógica. Aquí
    dos secciones quedan huérfanas de su nivel real; un índice o una herramienta que lea
    la jerarquía las situará dentro de los requisitos no funcionales.
*   **Evidencia**: `docs/designs/2026-11-09-egm-diseno-arquitectura.md:356`, `:381`,
    `:390`, `:402`.

### S7-07 — IMPORTANTE — El contrato de la capa de datos no incluye las policies ni los privilegios por rol

*   **Ubicación**: `### Capa de datos`, líneas 192–223.
*   **Qué está mal**: el documento lista columnas y funciones, y narra **un** invariante
    de RLS (213–216), pero no tabula qué rol (`anon`, `authenticated`, `service_role`)
    puede `SELECT` / `INSERT` / `UPDATE` / `DELETE` sobre `coupons` y `profiles`, que es
    la parte del contrato que este sistema hace cumplir. Tampoco menciona
    `grant execute` de las RPC a `anon` ni la revocación de `TRUNCATE`.
*   **Por qué importa**: para un sistema cuya autorización vive íntegramente en RLS, la
    matriz de policies *es* el contrato de la capa de datos. Sin ella, el documento no
    permite auditar un cambio de permisos, que es justo el fallo que describe el
    `## The Problem` (41–43).
*   **Evidencia**: `supabase/migrations/0002_security.sql:153-172` (policies de
    `coupons`), `0003_allow_public_coupon_links.sql:16-20` (la reescribe como
    `using (true)`), `0010_harden_rls_and_timestamps.sql:32-36` y `:41-57` (policies de
    `profiles`), `0002_security.sql:220-222` (grants), `0010:62`.

### S7-08 — IMPORTANTE — `user_exists` se nombra como oráculo de enumeración y no aparece su mitigación en ninguna sección

*   **Ubicación**: línea 211 (tabla de funciones), líneas 74–93 (`Open Questions`),
    402–466 (`[plan]`).
*   **Qué está mal**: la tabla de funciones lo etiqueta como «oráculo de enumeración»,
    pero el documento no propone mitigación en `Non-Functional Requirements` (seguridad,
    356–377) ni en el plan. La migración que sí la menciona deja el cierre fuera de su
    alcance.
*   **Por qué importa**: el estándar exige identificar riesgos y **cómo se mitigan**. Un
    riesgo nombrado sin mitigación ni criterio de aceptación es un dato, no un contrato, y
    deja al lector sin saber si es deuda aceptada o pendiente.
*   **Evidencia**: `supabase/migrations/0004_user_exists.sql:13-16` (nota de seguridad
    deliberada), `supabase/migrations/0010_harden_rls_and_timestamps.sql:99-104`
    (declarado pendiente y fuera de alcance).

### S7-09 — IMPORTANTE — `[plan]` El ítem 7 pide casos E2E que ya existen

*   **Ubicación**: `[plan]` líneas 461–466.
*   **Qué está mal**: se pide «ampliar la suite existente con los casos que hoy no cubre:
    login correcto, persistencia de sesión, logout, creación de cupón y contadores». Los
    cinco existen ya como especificaciones en `e2e/`.
*   **Por qué importa**: el plan se lee como trabajo pendiente; un implementador
    duplicaría la suite o concluiría que los casos están sin escribir.
*   **Evidencia**: `e2e/login-exitoso.spec.ts:6`, `e2e/persistencia-sesion.spec.ts:5`,
    `e2e/logout.spec.ts:5`, `e2e/crear-cupon.spec.ts:5`,
    `e2e/contadores-vistas-compartidos.spec.ts:3-9`.

### S7-10 — MENOR — La plantilla de `Alternatives Considered` no es simétrica

*   **Ubicación**: líneas 308–352.
*   **Qué está mal**: A, C y D cierran con `**Reason for Rejection**: Rejected by author:
    …`; B cierra con `**Por qué se elige**`; E con `**Por qué no se elige**`. El estándar
    exige una razón de rechazo documentada por alternativa; la forma cambia de idioma y de
    etiqueta entre bloques comparables.
*   **Por qué importa**: rompe la simetría que permite comparar alternativas de un
    vistazo, y mezcla idiomas en un documento que la regla del proyecto fija en español.
*   **Evidencia**: `docs/designs/2026-11-09-egm-diseno-arquitectura.md:313`, `:325`,
    `:335`, `:343`, `:351`; `CLAUDE.md:86`.

### S7-11 — MENOR — La cita de `CLAUDE.md` sobre el directorio de artefactos EGM es falsa

*   **Ubicación**: `Open Questions`, líneas 91–93.
*   **Qué está mal**: se afirma que «`CLAUDE.md` declara `EGM artifact directory:
    docs/egm`» y se concluye que «una de las dos rutas está mal». `CLAUDE.md` dice
    `docs/designs`, que es donde viven los informes. La desalineación no es entre
    `CLAUDE.md` y `docs/designs`, sino entre el documento y `CLAUDE.md`.
*   **Por qué importa**: una pregunta abierta construida sobre un dato incorrecto induce a
    «arreglar» el archivo que está bien.
*   **Evidencia**: `CLAUDE.md:94-96`.

### S7-12 — MENOR — El rango de evidencia de `increment_views` corta antes de la cláusula que prueba la afirmación

*   **Ubicación**: línea 82.
*   **Qué está mal**: se afirma que `increment_views` solo incrementa `where is_public =
    true` y se cita `0002_security.sql:206-215`. La función termina en la línea 218 y el
    filtro `and is_public = true` está en la 216: el rango citado no contiene la evidencia.
*   **Por qué importa**: la trazabilidad exige que la cita sostenga la afirmación; quien
    verifique el rango verá una función sin el filtro.
*   **Evidencia**: `supabase/migrations/0002_security.sql:206-218` (el filtro, línea 216).

### S7-13 — MENOR — Deriva en tres referencias `archivo:línea`

*   **Ubicación**: línea 235, línea 243, líneas 103–107.
*   **Qué está mal**: (a) la nota sobre `/protected` se cita en
    `lib/supabase/middleware.ts:10-13`, pero está en las líneas 5–10; (b)
    `components/google-button.tsx:38-43` para `signInWithOAuth` con `redirectTo`: la
    llamada abre en la 37 y `redirectTo` está en la 40; (c)
    `app/dashboard/crear/page.tsx:104-119` para el `insert`: el insert va de la 103 a la
    117.
*   **Por qué importa**: en un documento cuyo valor es ser verificable línea a línea,
    tres citas desplazadas obligan al lector a buscar a mano.
*   **Evidencia**: `lib/supabase/middleware.ts:5-10`; `components/google-button.tsx:37-42`;
    `app/dashboard/crear/page.tsx:103-117`.

### S7-14 — MENOR — «cada petición que no sea estático» describe mal el matcher del proxy

*   **Ubicación**: líneas 231–234.
*   **Qué está mal**: `proxy.ts` no excluye «lo estático»; excluye exactamente
    `_next/static`, `_next/image`, `favicon.ico` y las extensiones de imagen. Las rutas
    de página prerenderizadas **sí** pasan por el proxy.
*   **Por qué importa**: es la premisa del análisis de riesgo de nonce de la propia
    sección; describirla al revés invierte la conclusión (el proxy sí ve las rutas
    estáticas).
*   **Evidencia**: `proxy.ts:8-24`.

### S7-15 — MENOR — La tabla de rutas dice que `/cupon/[id]` «cuenta vistas» sin excepción, contra el resto del documento

*   **Ubicación**: línea 183, frente a líneas 82–84 y 124–125.
*   **Qué está mal**: CUJ 3 y las `Open Questions` dicen que las vistas de un cupón
    privado **no** se cuentan; la tabla de rutas lo presenta sin matiz, aunque el código
    llama a la RPC sin condición y el no-op depende de la policy.
*   **Por qué importa**: dos secciones del mismo documento describen el mismo
    comportamiento de forma distinta; un lector que use solo la tabla medirá mal.
*   **Evidencia**: `app/cupon/[id]/page.tsx:57` (llamada incondicional) y
    `supabase/migrations/0002_security.sql:216` (filtro).

### S7-16 — MENOR — «ocho llamadas a `.from("coupons")` con listas de columnas copiadas» es inexacto

*   **Ubicación**: `[plan]` líneas 458–459.
*   **Qué está mal**: la cifra de ocho es correcta, pero solo cinco de esas llamadas
    llevan lista de columnas; las de `delete` y `update` no.
*   **Por qué importa**: es la justificación del módulo `lib/data/`; el conteo correcto
    cambia el tamaño real de la duplicación.
*   **Evidencia**: `app/dashboard/page.tsx:20-24`, `app/dashboard/crear/page.tsx:103-117`
    y `:132-135`, `app/dashboard/mis-cupones/page.tsx:41-45`, `:67-70` y `:82-85`,
    `app/cupon/[id]/page.tsx:40-44`, `app/cuponera/page.tsx:13-18`.

### S7-17 — MENOR — CUJ 1 afirma una navegación que el código no hace

*   **Ubicación**: líneas 105–106.
*   **Qué está mal**: «El cupón aparece en `/dashboard/mis-cupones`». Tras guardar, la
    página permanece en `/dashboard/crear` y solo ofrece un botón para ir a Mis Cupones.
*   **Por qué importa**: el `Then` de una CUJ es un criterio comprobable; tal como está
    escrito, un test que espere la navegación automática fallará.
*   **Evidencia**: `app/dashboard/crear/page.tsx:141-142` y `:236-238`.

### S7-18 — MENOR — Todos los encabezados están en inglés en un documento en español

*   **Ubicación**: H1 y todos los H2/H3 (líneas 1, 9, 35, 53, 64, 74, 95, 153, 306, 356,
    381, 390, 404, 409, 468, y los de `Alternatives`).
*   **Qué está mal**: `The Problem`, `Goals`, `Non-Goals`, `Open Questions`, `Critical
    User Journeys`, `Technical Plan (Architecture)`, `Alternatives Considered`,
    `Non-Functional Requirements`, `Additional Resources`, `Future Improvements`,
    `Detailed Implementation Plan`. El cuerpo está en español de Chile.
*   **Por qué importa**: la regla del proyecto fija el idioma (UI, rutas, comentarios,
    textos legales) en español; el índice del documento es su superficie más visible.
*   **Evidencia**: `CLAUDE.md:86-87`.

### S7-19 — OBSERVACIÓN — «18 rutas, tal como las reporta `next build`» no es verificable en esta revisión

*   **Ubicación**: línea 175; `[plan]` línea 470.
*   **Qué está mal**: no ejecuté `pnpm build` (fuera del alcance de una revisión de solo
    lectura y dependiente de variables de entorno). Conté 18 rutas desde el árbol de
    `app/` (6 públicas + 7 de `auth` + 3 de `dashboard` + 2 de `api`), lo que **coincide**,
    pero no puedo confirmar el número que produce el build ni si este cuenta `/_not-found`.
*   **Por qué importa**: se declara como dato de un comando reproducible; queda como
    afirmación no verificada por mi parte, no como error.
*   **Evidencia**: `docs/designs/2026-11-09-egm-diseno-arquitectura.md:175`, `:470`;
    conteo sobre `app/**`.

### S7-20 — OBSERVACIÓN — La cabecera de la tabla de funciones mislabela la función que introduce el plan

*   **Ubicación**: líneas 204–211, frente a `[plan]` líneas 416–418.
*   **Qué está mal**: la tabla se titula «Funciones (`security definer`, con `search_path`
    fijado)» y el plan introduce `set_updated_at()`, que es `security invoker` con
    `search_path` fijo. Si el lector extiende la tabla siguiendo su cabecera, documentará
    mal los atributos de la función.
*   **Por qué importa**: los atributos de seguridad de una función son parte del contrato;
    en este caso la distinción es la que hace segura la función.
*   **Evidencia**: `supabase/migrations/0010_harden_rls_and_timestamps.sql:72-85`.

---

## Lo que está bien (verificado)

*   **Cumple las exigencias de contenido del estándar**: hay problema (35–51), objetivos y
    no-objetivos (53–72), arquitectura propuesta (153–304), alternativas con razón de
    rechazo (306–352) y riesgos con reservas explícitas (356–377). La *Alternatives Rule*
    se cumple: cinco alternativas, ninguna rechazada sin motivo técnico.
*   **Las afirmaciones de código que verifiqué fuera del bloque CSP son correctas**:
    los dos usos de la service role (218–223 → `app/api/upload-logo/route.ts:46`,
    `lib/supabase/admin.ts:17`) son exactamente dos; el rechazo de SVG y la decisión por
    bytes (275–282 → `app/api/upload-logo/route.ts:13-43`, `:78-87`); el allowlist de
    host anti-SSRF (263–266 → `app/api/coupon-image/route.tsx:11-23`); el `force-dynamic`
    (265 → `app/api/coupon-image/route.tsx:6`); la protección del panel (236–239 →
    `app/dashboard/layout.tsx:10-15`, `app/dashboard/page.tsx:12-17`); el callback
    (145–149 → `app/auth/callback/route.ts:7-17`); `SITE_URL` (302–304 →
    `lib/site-url.ts:8-10`); el número de WhatsApp (89–90 →
    `app/precios/page.tsx:54`); las cinco migraciones sin registrar (44–45, 425 →
    `CLAUDE.md:63-66`); los 16 y 8 columnas de `coupons` y `profiles` (196–202 →
    `0001_init.sql:17-45` con `0005` y `0007` aplicadas).
*   **La jerarquía H1→H2→H3→H4 no salta niveles** en ningún punto; los H4 de
    `Target Files to Create/Modify` (411–467) cuelgan correctamente del H3.
*   **Los límites de fiabilidad están declarados** en cuatro sitios (29–33, 86, 373,
    367), lo que el estándar no exige pero mejora la auditabilidad. Es la práctica
    correcta; el problema de S7-01 y S7-03 no es que falte declaración, sino que lo
    declarado como hecho se contradice con el código.
*   **Integridad de formato**: sin tablas rotas, sin bloques de código sin cerrar, sin
    enlaces ancla huérfanos. Las cinco tablas (177–190, 206–211, 254–261) están bien
    formadas.
