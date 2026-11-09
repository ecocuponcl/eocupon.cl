# Stage 9 — Implementation Readiness Test

- **Documento evaluado:** `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
  (551 líneas, mtime 19:29, el mismo que revisó el Stage 8).
- **Ámbito:** `## Detailed Implementation Plan` (líneas 463-546) más lo que ese
  plan toca de producción: `supabase/migrations/0010_harden_rls_and_timestamps.sql`,
  el historial de migraciones y las claves de entorno.
- **Revisor:** agente Goldfish `egm-implementation-readiness`, contexto limpio: no
  vi la conversación que produjo el documento ni los informes anteriores salvo el
  de seguimiento del Stage 8, para no repetir hallazgos ya cerrados.
- **Pregunta:** ¿puede alguien implementar el plan tal como está, sin volver a
  preguntar, y verificarlo?
- **Método:** lectura del plan y del runbook contra el código y las herramientas
  reales del repositorio. **Sí ejecuté** `npx tsc --noEmit`, `pnpm lint`,
  `pnpm build` y `supabase migration list` local (solo lectura). **No ejecuté**
  `pnpm test:e2e` ni ningún comando contra el proyecto remoto. No modifiqué el
  documento ni ningún archivo de código; este informe es el único archivo escrito.
- **Fecha:** 2026-11-09.

## Veredicto: **NO LISTO**

El plan no se puede ejecutar tal como está ni verificar con lo escrito. Las tres
razones que lo deciden:

1. **Ningún paso aplica `0010`.** El plan edita el archivo, repara el historial y
   escribe código, pero la operación que cierra la fuga —la única que la NFR de
   seguridad promete— no existe como paso. Quien siga la lista al pie termina con
   la tabla de cupones todavía enumerable y con criterios de aceptación escritos
   «tras aplicar `0010`» que no puede cumplir porque nadie lo aplicó.
2. **Los comandos de producción del plan apuntan a la base local.** Verificado con
   el binario instalado: `supabase` 3.1.0 documenta «TARGET: Local by default.
   Pass `--remote` for the linked project» y `supabase migration list` sin
   `--remote` respondió `Target: local stack (127.0.0.1:54322)` con
   `ECONNREFUSED`. El plan (ítem 2) y el runbook al que remite dan las órdenes sin
   `--remote`: la reparación del historial no tocaría producción nunca.
3. **La verificación funcional del enlace privado no se puede correr en el
   entorno que el repositorio ofrece.** `.env.local` tiene solo la URL y la clave
   publicable —sin `SUPABASE_SERVICE_ROLE_KEY`—, así que localmente
   `createAdminClient()` devuelve `null` y `app/cupon/[id]/page.tsx:34-40` cae al
   cliente con RLS. Después de `0010`, cualquier comprobación local de un cupón
   privado da 404 exactamente igual que el fallo real que se quiere descartar.

No es un documento incompleto en el sentido de «faltan detalles de estilo»: le
faltan el paso de producción, la precondición que lo hace seguro y criterios que
se puedan ejecutar sin criterio propio.

## Bloqueos para implementar

1. **Falta el paso de aplicación de `0010` y el orden entre pasos no está escrito.**
   El plan tiene siete ítems; ninguno dice «aplicar la migración». El orden real
   requerido es: (a) confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel Production,
   (b) dejar el archivo `0010` definitivo, (c) reparar el historial, (d) aplicar,
   (e) verificar, (f) desplegar el código y verificar la producción. El documento
   no encadena nada de eso y, además, el ítem 1 dice «**no aplicar sin
   autorización**» (línea 475) mientras el análisis estructural que el propio
   documento cita afirma que la autorización ya se dio
   (`2026-11-09-egm-analisis-estructural.md:255-256`). Un implementador no puede
   decidir si el paso (d) está autorizado o no. **Qué falta:** un paso explícito
   `Aplicar 0010` con su precondición, su autorización y su punto en la secuencia.
2. **Comandos sin `--remote`: reparan e impulsan la base local, no la remota.**
   Afecta al ítem 2 (líneas 484-490) y, en cascada, a todo el runbook
   `docs/runbooks/migraciones-procedimiento.md:48-80`, que es a donde el documento
   remite el procedimiento. **Qué falta:** `supabase migration repair --remote
   --status applied 0003 0004 0007 0008 0009`, `supabase migration list --remote`,
   `supabase db push --remote --dry-run` y `supabase db push --remote`. Añadir
   `--yes` si se ejecuta sin terminal interactiva: el propio `--help` advierte que
   los cambios hospedados solo aceptan `--yes` o `SUPABASE_YES`.
3. **El historial no se puede dejar coherente con la reparación que el plan
   enumera.** Las tablas del runbook (`:16-21`) registran `0005_coupon_logo.sql`
   como `20260712022655` y `0006_drop_logo_storage_rls.sql` como `20260713160745`;
   los archivos locales se llaman `0005_…` y `0006_…`. Reparar solo
   `0003/0004/0007/0008/0009` no empareja esas dos parejas. Consecuencia
   verificable: el criterio de parada del runbook («las columnas local y remota
   deben coincidir para 0001–0009», `:58-59`) **no puede cumplirse nunca**, y
   «`db push --dry-run` muestra únicamente `0010`» (`:67-68`) tampoco: `0005` y
   `0006` seguirían apareciendo como pendientes, y el runbook manda parar. El
   propio runbook reconoce el drift (`:155-156`) sin resolverlo. Si se decide
   renombrar los archivos locales a los timestamps remotos, eso es un paso que el
   plan debe decir explícitamente; si se decide reparar `0005`/`0006` también,
   igual. **Qué falta:** una decisión escrita y su comando.
4. **La comprobación del enlace privado no es ejecutable en local.** Ver el
   veredicto, punto 3. Además el plan no da ningún UUID privado concreto ni dice
   de dónde sacarlo. **Qué falta:** el comando que obtiene el UUID
   (`select id from public.coupons where is_public = false limit 1;` con service
   role), la URL exacta contra la que se comprueba (la de producción o un preview
   con `SUPABASE_SERVICE_ROLE_KEY`) y el resultado esperado (200 y el título del
   cupón). Sin esto, seguir el plan al pie produce un falso negativo que puede
   disparar el rollback y reabrir la fuga en producción.

## Criterios de aceptación que no son verificables tal como están

(Verification Plan, líneas 532-545.)

| Criterio (como está escrito) | Por qué no se puede verificar | Qué falta |
|---|---|---|
| `pnpm build` «debe terminar con 18 rutas» | **Ejecutado:** el build termina bien, pero la tabla imprime **18 rutas de app más `/_not-found`** (19 filas) y ninguna línea con un conteo. Contar a ojo no es un criterio. | Definir «18 rutas de app, sin `/_not-found`» y una comprobación mecánica, p. ej. contar líneas de la tabla. |
| `pnpm lint` «(0 errores)» | **Ejecutado:** 0 errores y **5 avisos**. Pasa tal como está escrito, pero no significa árbol limpio si la intención era esa. | Si se quiere limpio: «0 errores y 0 avisos»; si no, dejarlo escrito como «puede haber avisos». |
| «Con la clave publicable, listar `coupons` no debe devolver filas privadas» | No hay comando, ni URL, ni cabeceras, ni resultado esperado. | El `curl` concreto contra `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/coupons?select=id,is_public` y su `apikey`, con el resultado esperado (0 filas con `is_public=false`), o el bloque SQL `set local role anon` del runbook (`:107-110`), que el documento no cita. |
| «Un `/cupon/<uuid-privado>` debe seguir abriendo» | Sin UUID, sin host y no ejecutable en local (bloqueo 4). | Ver bloqueo 4. |
| «`/cuponera` y `/dashboard` deben seguir mostrando lo que mostraban» | No existe línea base registrada de qué mostraban antes: no hay captura, ni conteo, ni lista de cupones. Sin baseline no hay comparación posible. | Registrar antes (nº de cupones en `/cuponera`, cupones visibles en `/dashboard`) y comparar después con esa cifra. |
| Rollback: «si `/cuponera` queda vacía o un cupón público no abre, revertir…» | No hay forma de comprobar que la reversión surtió efecto más allá de mirar la pantalla; y el rollback mismo es otra migración que depende de los bloqueos 1-3. | Un criterio posterior al rollback: el mismo `select qual` debe volver a `true` y la cuponera debe listar N cupones. |
| Ítem 1 (endurecer `0010`) | No tiene ningún criterio en el Verification Plan. | `select proname, proacl from pg_proc where proname in ('handle_new_user','set_updated_at');` no debe mostrar `=X/` (PUBLIC) en `proacl`; `select tgname from pg_trigger where …` debe devolver los dos triggers. |
| Ítem 2 (historial) | No tiene ningún criterio propio; delega en el runbook, que a su vez tiene el criterio imposible del bloqueo 3. | `select count(*) from supabase_migrations.schema_migrations;` antes y después, y la lista de versiones esperada, escrita literalmente. |

Los dos únicos criterios que **sí** son ejecutables y hoy pasan: `npx tsc --noEmit`
(exit 0) y `pnpm lint` (0 errores). `pnpm test:e2e` arranca, pero no prueba lo que
el ítem 7 pretende (ver D7-07, que sigue abierto, y el hallazgo I9-06).

## Hallazgos

### I9-01 — BLOQUEANTE — El plan no contiene el paso que aplica `0010`

- **Ubicación:** `Detailed Implementation Plan` (463-546), ítems 1 y 2; NFR
  Despliegue (430-432); Verification Plan (538).
- **Qué falta:** los siete ítems son «archivos a crear o modificar» más una
  operación de historial. No hay paso que ejecute la migración. Los criterios de
  la sección de base de datos empiezan con «tras aplicar `0010`», que es
  precisamente lo que ningún ítem hace. El ítem 1 además instruye a «modificar»
  el archivo (475-482) cuando su contenido pendiente es solo un comentario: el
  `revoke execute … from public` (0010:67), el `set search_path` de
  `set_updated_at()` (0010:77) y su `revoke` (0010:85) ya están escritos. Quien
  implemente el ítem 1 encontrará que no hay nada que añadir y no sabrá si el
  trabajo terminó.
- **Guía:** convertir la sección en una secuencia numerada con un paso de
  aplicación y otro de verificación, y marcar el ítem 1 como «ya completo en el
  archivo» o enumerar exactamente qué falta (por ejemplo, el comentario sobre los
  nombres de las policy de `profiles`).

### I9-02 — BLOQUEANTE — Los comandos de migración del plan y del runbook no apuntan al proyecto remoto

- **Ubicación:** ítem 2 (484-490); runbook `migraciones-procedimiento.md:48-80`.
- **Evidencia (ejecutada):** `supabase` 3.1.0, `supabase migration repair --help`
  y `supabase db push --help` dicen «TARGET: Local by default. Pass `--remote` for
  the linked project». `supabase migration list` en el repositorio respondió
  `Target: local stack (127.0.0.1:54322)` seguido de `DbConnectError … ECONNREFUSED`.
  Es decir: sin `--remote` el comando ni siquiera llega a producción; falla, y el
  operador que lea el error puede concluir que el proyecto no está enlazado.
- **Guía:** usar `--remote` en `migration repair`, `migration list` y `db push`
  (con `--dry-run` en la comprobación), y `--yes` para ejecución no interactiva.
  Aclarar que `supabase link` es el único comando que apunta a remoto por defecto.

### I9-03 — BLOQUEANTE — La reparación del historial, tal como se enumera, no puede satisfacer su propio criterio de parada

- **Ubicación:** ítem 2 (484-490); runbook `:16-21`, `:58-59`, `:67-68`, `:155-156`.
- **Qué falta:** el runbook registra `0005` y `0006` en remoto con versiones
  `20260712022655` y `20260713160745`, mientras los archivos locales se llaman
  `0005_coupon_logo.sql` y `0006_drop_logo_storage_rls.sql`. Reparar solo las
  cinco versiones del plan deja ese par descuadrado: `migration list` seguirá
  mostrando local y remoto distintos, y `db push --dry-run` listará `0005`, `0006`
  y `0010` en vez de solo `0010`. El runbook ordena parar en ese caso, así que el
  procedimiento se detiene por su propio criterio y el ítem 2 queda sin terminar.
  Peor: si alguien fuerza con `--include-all`, reejecuta DDL ya aplicado.
- **Guía:** decidir y escribir una de las dos salidas: renombrar los archivos
  locales a la versión remota (y anotar que el historial de git conserva el
  original) o reparar también `0005`/`0006` con sus timestamps. Ajustar el
  criterio de parada al resultado real esperado.

### I9-04 — BLOQUEANTE — No se puede verificar el enlace privado en el entorno del repositorio

- **Ubicación:** Verification Plan (542); precondición de `0010:15-17`; runbook
  `:37-41`.
- **Evidencia:** `.env.local` (gitignorado) contiene solo
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, con el comentario
  «NO es la service role key». `lib/supabase/admin.ts:15-24` devuelve `null` sin
  esa clave y `app/cupon/[id]/page.tsx:34-40` cae al cliente con RLS. El propio
  código ya emite el aviso (`warnIfNoServiceRole`, `:36-38`), pero el plan no lo
  usa como criterio.
- **Qué se rompe si se sigue al pie:** el implementador aplica `0010`, abre un
  enlace privado en su `pnpm dev` local, ve 404 y —con el rollback que el documento
  define— revierte la policy en producción, reabriendo la fuga por un fallo que no
  existía. Es el peor caso del plan.
- **Guía:** exigir que la comprobación se haga contra producción o un preview de
  Vercel con la variable configurada; documentar que en local debe esperarse el
  aviso `[cupon/[id]] SUPABASE_SERVICE_ROLE_KEY no está configurada` y que ese
  aviso invalida la prueba, no el despliegue.

### I9-05 — MAYOR — `/cuponera` y `/dashboard` se verifican contra una línea base que nadie registró

- **Ubicación:** Verification Plan (543).
- **Qué falta:** «deben seguir mostrando lo que mostraban» exige un antes. El
  documento no da cifras ni un estado guardado; a 2026-11-09 la cuponera muestra
  los cupones públicos existentes y el dashboard agrega `views` y `shares_count`
  de los del usuario. Sin esa cifra anotada antes de aplicar, el criterio admite
  cualquier interpretación y no detecta una regresión que oculte cupones.
- **Guía:** fijar la comprobación antes del cambio (nº de tarjetas en `/cuponera`,
  títulos y contadores en `/dashboard`) y exigir la misma cifra después.

### I9-06 — MAYOR — El ítem 7 pide escribir especificaciones que ya existen y que están desactivadas por `test.fixme`

- **Ubicación:** ítem 7 (525-530); gate `pnpm test:e2e` (537).
- **Qué contradice:** el plan pide «ampliar la suite existente con los casos que
  hoy no cubre: login correcto, persistencia de sesión, logout, creación de cupón
  y contadores». Los cinco archivos existen (`e2e/login-exitoso.spec.ts`,
  `persistencia-sesion.spec.ts`, `logout.spec.ts`, `crear-cupon.spec.ts`,
  `contadores-vistas-compartidos.spec.ts`). Los dos últimos, y `compartir-enlace`,
  empiezan con `test.fixme(true, …)`: se saltan siempre, sin condición. Por tanto
  `pnpm test:e2e` puede terminar en verde **sin haber ejecutado ninguno de los
  flujos que el gate dice cubrir**. Duplicar los archivos, además, dejaría dos
  especificaciones con el mismo nombre de prueba.
- **Guía:** reescribir el ítem como «habilitar y completar», enumerar por archivo
  qué falta (`quitar test.fixme`, condiciones de entorno), y declarar que el gate
  no cuenta como verificación mientras exista un `test.fixme` en la suite.
- **Nota:** D7-07 ya señaló la duplicación y el riesgo de escribir en producción;
  lo que añado aquí es que el **gate queda en verde con los flujos sin ejecutar**,
  es decir, es un criterio que hoy da falsos positivos.

### I9-07 — MAYOR — El ítem 6 (`lib/data/`) no define firmas ni el destino de las llamadas existentes

- **Ubicación:** ítem 6 (517-523).
- **Qué falta:** el plan pide «funciones tipadas (`listPublicCoupons`,
  `listOwnCoupons`, `getCouponById`, `createCoupon`) con la lista de columnas en un
  solo sitio». No dice: qué devuelven (¿`Coupon[]`, `{ data, error }`, `null`?),
  qué tipo de error usan, si `getCouponById` lee con la service role o con RLS
  —decisión con efecto de seguridad directo—, qué columnas exactas lleva cada
  función, ni si los ocho puntos de llamada se sustituyen o conviven con el módulo
  nuevo. Tampoco menciona `supabase gen types`, que el análisis estructural
  considera parte de la solución (`2026-11-09-egm-analisis-estructural.md:279-283`):
  sin tipos generados, «tipadas» significa lo que infiera `supabase-js`, que es lo
  que ya hay hoy.
- **Guía:** fijar las firmas, el contrato de error, la columna de retorno, cuál
  cliente usa cada función y el comando de generación de tipos; declarar si el
  ítem se considera terminado con las llamadas migradas o con el módulo creado.

### I9-08 — MENOR — El ítem 2 está dentro de una lista de «archivos», aunque no es un archivo

- **Ubicación:** 484-490, bajo `### Target Files to Create/Modify`.
- **Qué pasa:** la única lista que un implementador recorre es la de archivos. Un
  ítem que escribe en la tabla de historial de producción queda escondido en medio
  de ediciones locales, sin marcador visual de «producción» ni de «irreversible
  en lo que respecta al historial». Los ítems 1, 3, 4, 5 y 7 son locales; el 2 no.
- **Guía:** sacar las operaciones de producción a una sección propia («Operaciones
  sobre producción, en este orden») y dejar `Target Files` solo para archivos.

### I9-09 — MENOR — El criterio `select qual …` no fija la salida esperada

- **Ubicación:** 538-540.
- **Qué pasa:** «debe devolver la expresión acotada, no `true`» deja al
  implementador decidir si lo que ve es lo correcto. La expresión que crea `0010`
  es concreta (`is_public = true OR auth.uid() = user_id`) y puede escribirse
  literal. Además la consulta no filtra `schemaname`, aunque `coupons` solo exista
  en `public`.
- **Guía:** pegar la salida esperada tal cual y añadir `schemaname='public'`.

## Lo que sí está listo (comprobado, no heredado)

- `npx tsc --noEmit` termina con exit 0.
- `pnpm lint` termina con 0 errores (5 avisos, todos `no-img-element`/`alt-text`
  en `app/api/coupon-image/route.tsx` y `app/cupon/[id]/page.tsx`).
- `pnpm build` termina bien y produce las 18 rutas de app más `/_not-found`; las
  marcas estáticas/dinámicas coinciden con la tabla del documento salvo
  `/auth/callback`, que es route handler y no aparece como página.
- `supabase` 3.1.0 está instalado y `supabase/config.toml` existe; el proyecto no
  está enlazado (`supabase/.temp` sin `project-ref`), como dice el runbook.

## Límites de esta revisión

- **No ejecuté nada contra el proyecto remoto**: no sé el estado real de
  `supabase_migrations.schema_migrations` ni si `SUPABASE_SERVICE_ROLE_KEY` existe
  en Vercel. Todo lo del bloqueo 2 y 3 sale del `--help` del binario instalado, del
  runbook y de los nombres de archivo, no de una ejecución contra producción.
- **No ejecuté `pnpm test:e2e`**: arrancaría un servidor de desarrollo contra el
  proyecto Supabase de producción. Lo de I9-06 sale de leer `playwright.config.ts`
  y los `test.fixme` de las especificaciones.
- **No verifiqué** que las 18 rutas respondan, ni el contenido de los buckets, ni
  el número de WhatsApp de `/precios`; están fuera del ámbito de esta etapa.