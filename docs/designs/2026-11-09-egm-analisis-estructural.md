# EcoCupon.cl — Análisis estructural, seguridad y escalabilidad

*   **Author:** 4Time Repuestos (`git config user.name` del repositorio)
*   **Status:** Draft
*   **Date:** 2026-11-09

Acompaña a `2026-11-09-egm-diseno-arquitectura.md`. Ese documento describe el
sistema y sus contratos; este evalúa **qué está mal estructurado**, qué riesgo
corre y en qué orden conviene arreglarlo. Los defectos tácticos ya listados en la
auditoría inicial no se repiten aquí salvo que tengan causa estructural.

## 1. Método y límites

Fuentes: los dos informes previos, lectura directa de `app/`, `lib/`, `components/`,
`supabase/migrations/`, `next.config.mjs`, `package.json`, `playwright.config.ts`,
`CLAUDE.md` y `git status`. No ejecuté la aplicación ni la suite E2E, no consulté
la base de datos y no apliqué nada. Cuando afirmo algo que no leí, lo marco como
**inferencia** o **no verificado**.

Trabajo en vuelo detectado durante la escritura (hecho por otras sesiones el mismo
día, **leído pero no verificado en ejecución**): `app/api/upload-logo/route.ts`
endurecido (límite 5 MB, sniffing por bytes, SVG rechazado),
`app/cupon/[id]/page.tsx` + `lib/supabase/admin.ts` para el enlace privado, y una
suite E2E de 7 archivos en `e2e/` con `playwright.config.ts`.

## 2. Estado de implementación

**Completo** (leído y coherente):

*   Las 18 rutas compilan y responden; `/dashboard/*` está protegido.
*   Alta de cupón: insert + composición de imagen + persistencia de la URL, con el
    fallo de imagen aislado del alta (`app/dashboard/crear/page.tsx:104-137`).
*   Imagen determinista del cupón con `next/og` + `qrcode`, con lista blanca de
    host para el logo y límite de 5 MB (`app/api/coupon-image/route.tsx:25-59`).
*   Subida de logo: sesión obligatoria, tamaño, tipo por bytes, ruta bajo
    `user.id`, SVG excluido (`app/api/upload-logo/route.ts:9-97`).
*   Lectura de cupón por UUID sin enumeración (`app/cupon/[id]/page.tsx:18-49`).

**A medias**:

*   Registro y recuperación: los formularios y las llamadas están, el envío real de
    correo y la confirmación nunca se probaron con una cuenta autorizada.
*   E2E: hay 7 especificaciones, ninguna cubre login correcto, sesión persistente,
    logout, creación de cupón ni contadores. **No verificado** si pasan.
*   Documentación: este par de documentos es el primer mapa de arquitectura.
*   Contadores: `increment_views` solo cuenta cupones públicos
    (`supabase/migrations/0002_security.sql:206-215`) y `increment_shares` no
    filtra nada. La asimetría no está decidida en ningún sitio.

**Roto o peligroso**:

*   La policy de SELECT de `coupons` sigue abierta en producción (`using (true)`).
*   El historial de migraciones está desincronizado: registradas `0001`, `0002`,
    `0005` y `0006`; sin registrar `0003`, `0004`, `0007`, `0008` y `0009`, cuyos
    efectos sí están aplicados. Un `supabase db push` reejecutaría DDL sobre
    objetos existentes.
*   Google OAuth falla con `redirect_uri_mismatch`.

## 3. Problemas estructurales

Ordenados por lo que bloquean, no por lo que lucen.

### 3.1 No existe capa de acceso a datos, así que el contrato del esquema está copiado ocho veces

Ocho llamadas a `.from("coupons")` repartidas en cinco archivos
(`app/dashboard/page.tsx:21`, `app/dashboard/crear/page.tsx:104,133`,
`app/dashboard/mis-cupones/page.tsx:38,63,77`, `app/cupon/[id]/page.tsx:37`,
`app/cuponera/page.tsx:14`), cada una con su propia lista de columnas escrita a
mano. No hay tipos generados de Supabase ni script para generarlos: los `select`
devuelven tipos inferidos por la librería, no por el esquema real.

Mecanismo del daño: renombrar o eliminar una columna no rompe la compilación; el
error aparece en producción como una respuesta vacía que la página interpreta como
"no hay cupones". La auditoría inicial ya encontró ese patrón dos veces.

Consecuencia: cada cambio de esquema exige buscar a mano todos los select, y no hay
forma de saber si la lista de `cuponera` y la de `mis-cupones` siguen coincidiendo.

### 3.2 La base de datos no es reproducible desde el repositorio

Dos causas independientes que se refuerzan: migraciones aplicadas sin registrar, y
el RLS más las policies de `profiles` existiendo solo en producción (ninguna
migración los crea; comprobado con `grep` sobre `supabase/migrations/`).

Consecuencia práctica: no se puede levantar un entorno de pruebas fiel, y `db push`
es un comando con carga: puede intentar recrear objetos existentes **y** —esto es
lo grave— reejecutar `0003`, que vuelve a crear la policy de SELECT abierta. Es
decir: aplicar el arreglo de seguridad sin reparar antes el historial deja el
arreglo a merced del siguiente `db push`.

### 3.3 La autorización vive en un solo sitio (RLS) y hay una ruta que la omite por completo

No hay capa de autorización en el código: quien decide es Postgres. Eso está bien
mientras todas las consultas pasen por el cliente con RLS. Pero
`app/cupon/[id]/page.tsx:34` usa la service role, que la omite entera: si alguien
añade mañana un filtro, un `join` o recicla ese cliente para otra consulta, la
protección desaparece sin que nada avise. La única barrera que queda ahí es la
expresión regular de UUID (`app/cupon/[id]/page.tsx:18`) y la disciplina de no
tocar la consulta.

Consecuencia: la seguridad de esa ruta es frágil frente a ediciones futuras; es el
punto donde una refactorización inocente se convierte en una fuga.

### 3.4 Cincuenta y cinco primitivas generadas conviven con el código propio sin marcarlas

`components/ui/` tiene 55 archivos de shadcn/ui. El lint recién instalado tuvo que
exceptuar dos reglas del React Compiler precisamente para ese directorio
(`eslint.config.mjs`), y no hay registro de qué versión generó cada componente ni
script para regenerarlos. Un `shadcn add` posterior puede sobrescribir cambios
manuales, y una revisión no puede distinguir "código propio" de "código copiado".

### 3.5 Cero verificación automática

No hay CI, no hay tests de integración, y hasta hoy el lint no funcionaba. La
consecuencia directa ya se vio en esta misma auditoría: cambiar una policy de RLS
solo se puede validar a mano, en producción, mirando si la cuponera quedó vacía.

### 3.6 El producto promete cosas que el código no hace

La landing, el metadata (`app/layout.tsx:10-11`) y `/precios` prometen generación
con IA y planes de pago; el código compone la imagen de forma determinista y la
columna `plan_type` existe en `profiles` (`supabase/migrations/0001_init.sql:42`)
pero **ningún archivo la lee ni la escribe** — verificado con `grep`. No hay
pasarela de pago entre las dependencias ni ruta de checkout.

Consecuencia: no es solo un problema de marketing. Cualquier trabajo futuro tiene
que decidir antes si los planes son reales, porque de eso depende el modelo de
datos (`plan_type`, límites por plan) y no al revés.

### 3.7 Código muerto que confunde la lectura

El guard de `/protected` ya se eliminó —`lib/supabase/middleware.ts:10-13` deja
constancia de que estaba de más—. Sigue habiendo código muerto:
`app/auth/verificar/page.tsx` es una página que ningún flujo enlaza;
`app/auth/error/page.tsx` solo se alcanza desde el callback; el bucket privado
`ecocupon` guarda 2 objetos que ningún archivo menciona. Nada de esto rompe, pero
cada uno hace perder tiempo a quien audita y sugiere funciones que no existen.

## 4. Estado de seguridad (tal como está hoy)

| Control | Estado | Evidencia |
|---|---|---|
| Enumeración de cupones por anónimos | **ABIERTO** | policy SELECT `using (true)`; `0010` escrita, sin aplicar |
| RLS de `profiles` versionado en el repo | **ABIERTO** | RLS activo en producción; ninguna migración lo crea |
| Historial de migraciones consistente | **ABIERTO** | 5 migraciones aplicadas sin registrar |
| Uso de la service role | **ACOTADO** | solo `app/api/upload-logo/route.ts:90` y `lib/supabase/admin.ts`, verificado con `grep` |
| Subida de logos | **CERRADO** | tamaño, sniffing por bytes, SVG rechazado, ruta bajo `user.id` |
| Enumeración de correos | **ABIERTO** | `user_exists(text)` ejecutable por `anon`, y la UI confirma al usuario si el correo existe |
| Integridad de los contadores | **ABIERTO** | RPC abiertas a `anon`, sin límite ni comprobación de existencia del cupón |
| Secretos versionados | **CERRADO** | sin claves en el repo ni en el historial; `.env.local` ignorado por `.gitignore:18` (verificado con `git check-ignore`) |
| Cabeceras HTTP | **PARCIAL** | HSTS presente (`next.config.mjs:21-24`); CSP con nonce por respuesta en `proxy.ts:20-52`; `style-src` aún con `'unsafe-inline'` |
| Mensajes de error al usuario | **PARCIAL** | los de Supabase salen en inglés (`app/auth/login/page.tsx:34`) |
| SSRF en la composición de la imagen | **CERRADO** | lista blanca de host para el logo |

**Riesgo abierto detectado al revisar el cambio de CSP (no verificado).** La CSP
con nonce se genera por respuesta en `proxy.ts:40-52` y en producción usa
`'nonce-…'` + `'strict-dynamic'`. Ese mecanismo exige que el HTML se renderice por
petición: el nonce tiene que aparecer en los `<script>` del documento. El build
marca `/`, `/precios`, `/auth/*`, `/condiciones` y `/privacidad` como **estáticas**
(○ en la salida de `next build`), así que su HTML se genera en el build, sin nonce.
Con `strict-dynamic` los navegadores modernos ignoran `'self'` para scripts. Si esa
combinación se confirma en un preview de producción, esas páginas pierden sus
scripts y la landing se rompe. Es la razón por la que este cambio no debe darse por
bueno sin abrir un preview y mirar la consola.

Nota sobre el oráculo de correos: no es un descuido, es una decisión visible en el
código — `/auth/recuperar` prefiere decir "este correo no está registrado" antes
que fingir que envió un enlace (`app/auth/recuperar/page.tsx:32-47`). El problema
es que para lograrlo expone una función que cualquiera puede llamar en bucle. Hay
una forma de conservar el mensaje sin exponer el oráculo: mover la comprobación a
una ruta de servidor con la service role y limitar la frecuencia por IP.

## 5. Escalabilidad: qué se rompe primero

Marcado como análisis, no como medición. **No verificado**: latencias, consumo ni
límites reales del plan contratado.

1.  **La cuponera, por diseño.** Limita a 50 filas sin paginación ni búsqueda en
    servidor (`app/cuponera/page.tsx:13-18`), y el buscador de `mis-cupones` filtra
    en el navegador sobre lo ya cargado. Con más de 50 cupones públicos, la
    cuponera deja de mostrar el catálogo real sin que nada lo indique.
2.  **Los contadores, por contención.** Cada visita a `/cupon/[id]` hace un
    `UPDATE` (`increment_views`) sobre la misma fila. Un cupón que se vuelva viral
    serializa escrituras en esa fila; es el recurso más disputado del sistema.
3.  **El coste por visita.** Las dos rutas de cupón son dinámicas
    (`force-dynamic`): no hay caché posible mientras las vistas se cuenten en cada
    carga. La composición con `next/og` es la operación más cara y se repite por
    cupón compartido.
4.  **La ausencia de índices verificados.** No comprobé qué índices existen sobre
    `created_at` ni si el orden de la cuponera está cubierto; el informe previo
    contó 6 índices en `coupons` sin detallar cuáles sirven a esta consulta.
5.  **El abuso antes que la carga.** Al no haber límite por IP en los contadores ni
    en `user_exists`, el primer problema de escala probablemente sea tráfico
    artificial inflando métricas o enumerando correos, no usuarios legítimos.

## 6. Propuestas priorizadas

Impacto sobre esfuerzo. "Local" = se puede hacer sin tocar producción.

| # | Propuesta | Impacto | Esfuerzo | Ámbito |
|---|---|---|---|---|
| 1 | Reparar el historial de migraciones (`0003`, `0004`, `0007`, `0008`, `0009`) | Alto: sin esto, `0010` puede deshacerse sola | Bajo | **Requiere autorización** (escribe en la tabla de historial) |
| 2 | Aplicar `0010` tras confirmar los nombres reales de las policy de `profiles` | Alto: cierra la fuga | Bajo | **Requiere autorización** |
| 3 | Endurecer `0010`: `revoke … from public` en `handle_new_user`, `search_path` y `revoke` en `set_updated_at` | Medio: sin esto quedan avisos del asesor | Bajo | Local (editar el archivo) |
| 4 | Capa de datos en `lib/data/` con tipos generados por `supabase gen types` | Alto: elimina la causa de los errores silenciosos | Medio | Local |
| 5 | Suite E2E de los flujos que faltan (login, sesión, logout, alta, contadores) | Alto: es la red de seguridad que hoy no existe | Medio | Local, exige cuenta de prueba autorizada |
| 6 | Trasladar `user_exists` a una ruta de servidor con límite por IP | Medio: cierra la enumeración conservando el mensaje | Medio | Local + autorización si cambia grants |
| 7 | Límite por IP en las RPC de contadores | Medio | Medio | Local |
| 8 | Verificar la CSP con nonce en las rutas estáticas (riesgo de scripts bloqueados) y valorar quitar `style-src 'unsafe-inline'` | Alto si rompe la landing en producción | Medio: exige preview de producción | Local + verificación en preview |
| 9 | Traducir los mensajes de error de Supabase | Bajo-medio (experiencia) | Bajo | Local |
| 10 | Limpiar el código muerto restante (página `/auth/verificar` sin enlaces, bucket `ecocupon` sin uso) | Bajo | Bajo | Local |
| 11 | Decidir y corregir el copy de IA y de planes | Alto (credibilidad) | Bajo si es copy, alto si hay IA de verdad | Decisión de producto |
| 12 | Majors de dependencias (TypeScript 7, recharts 3, lucide 1.x, sonner 2, day-picker 10, resizable-panels 4, analytics 2) | Bajo ahora | Alto | Local, con prueba manual por componente |

## 7. El enlace a cupones privados: diseño implementado y su evaluación

Implementado hoy (`app/cupon/[id]/page.tsx` + `lib/supabase/admin.ts`). Mecanismo:
acotar la policy de SELECT y leer el cupón por UUID con la service role, de modo que
el UUID funcione como capacidad. Es la Alternativa B del documento de diseño.

Lo que está bien resuelto: la consulta valida el formato del UUID antes de tocar la
base; selecciona columnas explícitas en vez de `select *`; usa `maybeSingle()` para
distinguir "no existe" de "falló"; y `lib/supabase/admin.ts` documenta en su
cabecera que no debe usarse para listar ni para leer datos de otro usuario.

Lo que puede salir mal, por orden de probabilidad:

1.  **Silencio si falta la clave.** Con `createAdminClient() ?? supabase`, si
    `SUPABASE_SERVICE_ROLE_KEY` no está en el entorno, la ruta cae al cliente con
    RLS y el cupón privado devuelve 404 sin dejar rastro. En local o en un preview
    de Vercel sin la variable, el síntoma es "el enlace no funciona" y el
    diagnóstico es costoso. Mitigación: registrar un aviso explícito en ese caso.
2.  **Consultas futuras sobre el mismo cliente.** La service role se toma una vez
    (`const reader = …`) y se usa para una consulta. Si alguien añade una segunda
    lectura con `reader`, esa lectura pierde RLS sin que el diff lo grite.
    Mitigación: mantener el cliente con service role en un único punto y anotarlo
    como invariante en el propio archivo.
3.  **Vistas que no cuentan.** `increment_views` solo incrementa si
    `is_public = true`, así que el enlace privado suma 0 vistas. Puede ser lo
    deseado; hoy no está escrito en ninguna parte.
4.  **Sin límite de frecuencia.** Cada apertura válida incrementa vistas; con el
    UUID, cualquiera puede inflar el contador de un cupón concreto (y también de
    los públicos).

Riesgo residual aceptado: quien tenga el enlace ve el cupón para siempre; no hay
revocación. Cambiarlo exigiría la Alternativa C (token por cupón) y romper enlaces
ya repartidos.

Variable de entorno de la que depende: `SUPABASE_SERVICE_ROLE_KEY`. Si no está
definida en Vercel, el enlace privado no funciona **en producción**; conviene
comprobarlo antes de dar la función por terminada.

## 8. Roadmap con criterios de aceptación

**Etapa 1 — Cerrar la fuga sin romper el producto** (requiere autorización; el
usuario ya la dio para aplicar `0010` aceptando el efecto, pero el orden importa)

1.  Confirmar los nombres de las policy reales de `profiles`.
2.  Reparar el historial de las 5 migraciones sin registrar.
3.  Endurecer `0010` (propuesta 3) y aplicarla.
4.  Criterios: la policy de SELECT ya no es `true`; listar `coupons` con la clave
    publicable no devuelve filas privadas; `/cuponera`, `/dashboard` y un
    `/cupon/<uuid-privado>` siguen funcionando.

**Etapa 2 — Red de seguridad**

5.  Completar la suite E2E (login correcto, sesión persistente, logout, alta de
    cupón, contadores) con una cuenta de prueba autorizada.
6.  Criterios: `pnpm test:e2e` en verde y `pnpm lint`, `npx tsc --noEmit` y
    `pnpm build` sin errores.

**Etapa 3 — Cerrar la enumeración y el abuso**

7.  `user_exists` detrás de una ruta de servidor con límite por IP; límite en los
    contadores.
8.  Criterios: llamar a la función desde el navegador falla; ráfagas de peticiones
    a los contadores se cortan.

**Etapa 4 — Causa raíz del error silencioso**

9.  Tipos generados (`supabase gen types`) y capa `lib/data/`.
10. Criterios: renombrar una columna en una migración de prueba rompe el
    typecheck; ninguna página escribe su propio `select` de `coupons`.

**Etapa 5 — Cabeceras y deuda**

11. HSTS y CSP con nonce ya están escritos; falta verificarlos en un preview de
    producción (rutas estáticas), traducir los mensajes de error y limpiar el
    código muerto.
12. Criterios: `curl -I` muestra HSTS; en un preview de producción la consola no
    muestra violaciones de CSP en `/`, `/precios`, `/cuponera` y `/dashboard`; con
    JavaScript deshabilitado no hay regresiones nuevas; ningún mensaje crudo de
    Supabase llega a la pantalla.

## 9. No verificado

*   Que la suite E2E pase, y qué cubre exactamente cada especificación.
*   Los nombres reales de las policy de `profiles` en producción.
*   Los índices reales de `coupons` y si cubren el orden de la cuponera.
*   Latencias, consumo y límites del plan de Vercel y de Supabase.
*   Si el bucket privado `ecocupon` tiene consumidores fuera del repositorio.
*   Si `SUPABASE_SERVICE_ROLE_KEY` está definida en el entorno de producción, de lo
    que depende el enlace privado.
*   El efecto real de aplicar `0010` sobre el dashboard y la cuponera, más allá del
    análisis de los puntos de lectura que hice por lectura de código.
