# Stage 6 — Comprehension Test

**TargetFile:** `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
**Persona:** egm-comprehension (Naive Reader / Goldfish)
**Regla de la etapa:** el test se hizo leyendo SOLO el documento. El código se abrió
después, únicamente para confirmar si un hallazgo es un defecto real y para citar
`archivo:línea`.
**Fecha:** 2026-11-09

--------------------------------------------------------------------------------

## Paraphrase

### What this proposes
*(Qué propone este documento)*

El documento es el mapa de arquitectura de EcoCupon.cl, un servicio web donde un
comercio crea cupones de descuento, los comparte por enlace o QR y ve cuántas
veces se ven y se comparten. No propone una función nueva: fija por escrito cómo
está construido hoy —rutas, capa de datos, autenticación y dos rutas de API— y qué
debe quedar. Su núcleo es un problema de seguridad y de soporte: la tabla `coupons`
es enumerable por cualquiera con la clave publicable porque su policy de `SELECT`
es `using (true)`; el arreglo elegido (Alternativa B) es acotar la policy a
"público o propio" y leer el cupón privado por UUID con service role, de modo que
el UUID actúe como capacidad y el enlace compartido siga funcionando. El documento
cierra con un plan de implementación de siete archivos/operaciones, alternativas
descartadas, requisitos no funcionales y un plan de verificación con comandos.

### How the existing system works, per this document
*(Cómo funciona el sistema existente, según este documento)*

Tiene tres superficies —landing comercial, cuponera pública y panel privado— más
flujos de cuenta y dos rutas de API. El navegador usa siempre la clave publicable
y depende de RLS; la service role aparece solo en `app/api/upload-logo/route.ts` y
`lib/supabase/admin.ts`. El panel se protege leyendo el usuario en
`app/dashboard/layout.tsx` y redirigiendo a `/auth/login`. Las escrituras sensibles
pasan por funciones `security definer` (`increment_views`, `increment_shares`,
`user_exists`, `handle_new_user`). La imagen del cupón se compone al vuelo con
`next/og` + `qrcode`; la subida de logo valida por bytes, rechaza SVG y guarda bajo
`<user.id>/<timestamp>.<ext>`. El despliegue es Vercel con HSTS en `next.config.mjs`
y CSP con nonce por respuesta en `proxy.ts`.

--------------------------------------------------------------------------------

## Findings

### C6-01 — Estado actual y estado objetivo del enlace privado/RLS se contradicen

*   **Severidad:** BLOQUEANTE
*   **Ubicación:** línea 31 (intro); CUJ 3, líneas 118-126; "Capa de datos",
    líneas 213-223; NFR, líneas 375-377; Plan, líneas 411-420; Verificación,
    líneas 474-481.
*   **Qué no se entiende:** el documento afirma a la vez que el endurecimiento
    del enlace privado ya está hecho y que está pendiente. No se puede responder
    a la pregunta básica del documento —¿está hoy la tabla `coupons` enumerable
    por anónimos?— porque dos secciones dan respuestas opuestas en presente:
    *   Línea 31: lista "enlace privado resuelto" entre cambios en vuelo ya hechos.
    *   CUJ 3 (líneas 124-125): "El UUID hace de capacidad: sin él no se llega, y
        **no se puede listar la tabla**" — enunciado como hecho actual.
    *   Línea 213-216: "**Invariante de datos que hoy no se cumple** … La policy
        vigente (`using (true)`) permite leerlo a cualquiera que liste la tabla."
    *   Línea 221-222: `admin.ts` "existe para un único caso — leer un cupón por
        UUID **cuando la policy ya no permite** el listado anónimo".
    *   Plan (línea 414) y NFR (líneas 375-377): la migración `0010` "no aplicar
        sin autorización" / "se aplica aparte y se verifica de inmediato".
*   **Por qué importa:** es el tema central del documento y su lectura de mayor
    riesgo. Un lector nuevo (o un agente de IA) no puede decidir si la tabla está
    abierta hoy, si `lib/supabase/admin.ts` está en uso o es código dormido, ni si
    un enlace privado funciona por la policy abierta o por el cliente con service
    role. Si el documento mapea "el sistema tal como está construido hoy", CUJ 3
    es incorrecto como descripción de hoy.
*   **Evidencia:** `supabase/migrations/0010_harden_rls_and_timestamps.sql:3-4`
    dice "NO aplicada todavía: requiere autorización"; `supabase/migrations/0003_allow_public_coupon_links.sql:20`
    deja `using (true)`; `app/cupon/[id]/page.tsx:4,33-40` usa el cliente admin
    (`createAdminClient`). Es decir: hoy la policy sigue abierta (0003) y `0010`
    está pendiente, por lo que la afirmación en presente de CUJ 3 no se cumple.

### C6-02 — Referencia a "el documento de análisis estructural" sin nombrarlo ni enlazarlo

*   **Severidad:** IMPORTANTE
*   **Ubicación:** línea 216.
*   **Qué no se entiende:** el documento delega el mecanismo y el coste del arreglo
    del RLS a "el documento de análisis estructural", pero nunca lo nombra ni lo
    enlaza. Tampoco aparece en *Additional Resources* (líneas 383-388), que solo
    lista `auditoria-inicial.md` e `informe-final.md`. El lector no puede localizar
    la fuente a la que se le remite.
*   **Por qué importa:** el documento se declara autosuficiente para un lector
    nuevo; una referencia cruzada sin ruta obliga a salir y adivinar. Además
    contradice la convención del propio repo de citar rutas completas.
*   **Evidencia:** el archivo existe (`docs/designs/2026-11-09-egm-analisis-estructural.md`),
    pero el TargetFile no lo nombra en ninguna línea.

### C6-03 — `user_exists` se señala como oráculo de enumeración y nunca se dispone qué se hará

*   **Severidad:** IMPORTANTE
*   **Ubicación:** tabla de funciones, línea 211; CUJ 5, líneas 135-141.
*   **Qué no se entiende:** la tabla marca `user_exists` como "**es un oráculo de
    enumeración**" (en negrita), y CUJ 5 describe su uso. No hay ninguna sección
    —Open Questions, Non-Goals o Implementation Plan— que diga si se acepta como
    riesgo, se mitiga o se elimina.
*   **Por qué importa:** uno de los Goals (línea 57-58) es "nombrar, para cada
    problema abierto, el mecanismo exacto de arreglo, lo que cuesta y lo que puede
    romper". Aquí se nombra un problema de seguridad propio (enumerar cuentas
    registradas) sin mecanismo ni decisión, así que el documento incumple su propio
    contrato con el lector: no se sabe si es defecto aceptado o tarea pendiente.
*   **Evidencia:** el uso real está en `app/auth/recuperar/page.tsx:30-33`, que
    llama la RPC `user_exists` antes de decidir. No hay ninguna migración ni ítem
    del plan que la trate.

### C6-04 — La tabla de rutas de auth omite el prefijo `/auth/` en cinco entradas

*   **Severidad:** MENOR
*   **Ubicación:** línea 184.
*   **Qué no se entiende:** la fila lista "`/auth/login`, `/registro`,
    `/recuperar`, `/nueva-contraseña`, `/error`, `/verificar`". Las cinco últimas
    van sin el prefijo `/auth/`, aunque todas viven bajo `/auth/`. El lector puede
    interpretarlas como rutas de primer nivel (`/registro`, `/recuperar`, …).
*   **Por qué importa:** es el mapa de rutas, material de navegación directa para
    quien llega nuevo; una URL mal copiada produce 404.
*   **Evidencia:** las rutas reales son `app/auth/registro/page.tsx`,
    `app/auth/recuperar/page.tsx`, `app/auth/nueva-contraseña/page.tsx`,
    `app/auth/error/page.tsx`, `app/auth/verificar/page.tsx`. Las demás filas del
    mismo documento sí usan el prefijo completo (p. ej. `/auth/callback`).

### C6-05 — `SITE_URL` se usa sin definir y no coincide con el nombre de la variable de entorno

*   **Severidad:** MENOR
*   **Ubicación:** línea 241 (`${SITE_URL}/auth/callback`) frente a líneas
    299-304 (`NEXT_PUBLIC_SITE_URL`, `lib/site-url.ts`).
*   **Qué no se entiende:** el símbolo `SITE_URL` aparece en un fragmento de código
    sin definición; la lista de variables de entorno tiene `NEXT_PUBLIC_SITE_URL`,
    no `SITE_URL`. El lector debe inferir (más abajo, línea 302) que `SITE_URL` es
    un export de `lib/site-url.ts` derivado de `NEXT_PUBLIC_SITE_URL`. Nunca se dice.
*   **Por qué importa:** la sección insiste en que `lib/site-url.ts` es "la única
    fuente de la URL canónica"; no conectar `SITE_URL` con ese archivo deja al
    lector sin el vínculo entre el código citado y la variable de entorno.
*   **Evidencia:** `lib/site-url.ts:8-10` define la constante a partir de
    `process.env.NEXT_PUBLIC_SITE_URL`; `components/google-button.tsx:6,40` la importa.

### C6-06 — `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` se lista pero no se explica

*   **Severidad:** MENOR
*   **Ubicación:** línea 301 (lista de variables); la sección de Autenticación
    (líneas 225-247) no la menciona.
*   **Qué no se entiende:** la variable aparece en el inventario de entorno sin
    decir qué hace, cuándo se necesita ni que solo se usa en los flujos de correo
    (registro y recuperación). Un desarrollador nuevo no sabe si debe definirla.
*   **Por qué importa:** el documento declara servir a "una persona que llega nueva
    al repositorio" (línea 19); una variable de entorno sin propósito declarado es
    exactamente el tipo de conocimiento asumido que la etapa busca.
*   **Evidencia:** se usa en `app/auth/registro/page.tsx:34` y
    `app/auth/recuperar/page.tsx:50` como `emailRedirectTo`, pero el documento no
    lo refleja.

### C6-07 — La columna `plan_type` (y la noción de "planes") no tiene semántica

*   **Severidad:** MENOR
*   **Ubicación:** línea 202 (`profiles` → `plan_type`); línea 180 (`/precios`,
    "Catálogo de planes (sin pasarela)").
*   **Qué no se entiende:** `plan_type` se lista como columna con contrato, pero
    nunca se dice qué valores admite ni qué efecto tiene (¿entitlements?), ni qué
    "planes" existen.
*   **Por qué importa:** el documento dice describir contratos por componente; una
    columna en el mapa de datos sin dominio declarado deja el contrato incompleto.
*   **Evidencia:** la columna existe en el esquema según el propio listado del
    documento (línea 202) y no hay ninguna otra mención en el TargetFile.

### C6-08 — Open Question sobre el "EGM artifact directory" parte de un dato ya desactualizado

*   **Severidad:** OBSERVACIÓN
*   **Ubicación:** líneas 91-93.
*   **Qué no se entiende:** la pregunta abierta afirma que `CLAUDE.md` declara
    `EGM artifact directory: docs/egm`. En el repositorio actual, `CLAUDE.md` dice
    `docs/designs`, la misma ruta donde viven los informes. La premisa de la
    pregunta ya no se sostiene, pero el lector no puede saberlo sin abrir otro
    archivo.
*   **Por qué importa:** no bloquea la comprensión, pero una pregunta "abierta" que
    ya está resuelta en el repo resta confianza al resto del documento como fuente
    exacta.
*   **Evidencia:** `CLAUDE.md:96` → "EGM artifact directory: docs/designs".

### C6-09 — No hay un arranque local ni prerrequisitos para el lector nuevo

*   **Severidad:** OBSERVACIÓN
*   **Ubicación:** línea 19 (audiencia declarada); "Despliegue e integraciones"
    (líneas 285-304) y "Verification Plan" (líneas 468-481).
*   **Qué no se entiende:** las variables de entorno y los comandos (`pnpm build`,
    `tsc`, `lint`, `test:e2e`) están repartidos, pero no hay un bloque que diga cómo
    levantar el proyecto localmente ni qué prerrequisitos hacen falta (gestor de
    paquetes, Supabase CLI para las migraciones).
*   **Por qué importa:** el documento declara servir "a una persona que llega nueva
    al repositorio"; sin un punto de entrada operativo, esa persona no puede pasar
    del mapa al uso.
*   **Evidencia:** los comandos aparecen solo en el contexto de verificación; no
    existe sección de setup en el TargetFile.

--------------------------------------------------------------------------------

## Recuento por severidad

| Severidad | Hallazgos |
|---|---|
| BLOQUEANTE | 1 (C6-01) |
| IMPORTANTE | 2 (C6-02, C6-03) |
| MENOR | 4 (C6-04, C6-05, C6-06, C6-07) |
| OBSERVACIÓN | 2 (C6-08, C6-09) |
| **Total** | **9** |

## Lo que el documento responde bien

*   El **mapa de rutas** es correcto en su conteo: las 18 rutas del texto coinciden
    con los archivos de `app/` (15 `page` + 3 `route` handlers: `coupon-image`,
    `upload-logo` y `auth/callback`).
*   Las **CUJ 1, 2, 4, 5 y 6** son autosuficientes: cada una tiene Given/When/Then
    con archivo:línea y efecto observable, y no requieren contexto externo.
*   Las **funciones `security definer`** y las dos tablas (`coupons`, `profiles`)
    están listadas con su invariante y su número de columnas, sin ambigüedad.
*   Las **Alternativas A-E** declaran pros, cons y motivo de rechazo: se entiende
    por qué se eligió B frente a A y C.
*   El **Subida del logo** se describe paso a paso (401/500/413, sniff por bytes,
    rechazo de SVG, ruta de guardado) y es verificable sin salir del documento.
