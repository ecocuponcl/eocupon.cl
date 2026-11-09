# Stage 8 — Intermediate Zoom Out Review

- **Documento revisado:** `docs/designs/2026-11-09-egm-diseno-arquitectura.md`
  (versión remediada, 544 líneas, 19:21)
- **Revisor:** agente Goldfish `egm-zoom-out`, contexto limpio: no vi la conversación
  que produjo el documento ni la remediación, solo el documento y el repositorio.
- **Preguntas de esta etapa:** (1) ¿los hallazgos bloqueantes e importantes de las
  etapas previas quedaron resueltos o solo maquillados? (2) ¿la remediación introdujo
  incoherencias nuevas?
- **Método:** cotejo línea a línea del documento contra el árbol de trabajo real
  (`app/`, `lib/`, `components/`, `supabase/migrations/`, `proxy.ts`,
  `next.config.mjs`, `e2e/`, `CLAUDE.md`, `playwright.config.ts`) y **una consulta
  de solo lectura a la base de producción** (`pg_policies`). No modifiqué el
  documento ni ningún archivo de código.
- **Fecha:** 2026-11-09.

## Veredicto corto

La remediación cerró de verdad **un racimo**: la CSP con nonce descartada (bloqueante
en tres informes) y cuatro hallazgos menores de coherencia. No tocó el resto. De los
**28 hallazgos bloqueantes e importantes** de las etapas 5–7, **9 quedaron resueltos,
6 parciales y 13 abiertos**; y al menos uno de los "resueltos" del plan (ítem 4) choca
con la cabecera del propio plan. La remediación también dejó **dos afirmaciones que
hoy contradicen al código** (CUJ 4 y el "aviso de diseño" del 404) y **una referencia
interna rota**.

Comprobación decisiva del tema central, contra la base real (no contra el documento):

```
tablename=coupons  policyname=coupons_select_own_or_public  cmd=SELECT  qual=true
tablename=profiles 4 policies: profiles_{select,insert,update,delete}_own
```

Es decir: **la tabla `coupons` sigue siendo enumerable por anónimos hoy**, la
migración `0010` no está aplicada, y las policies de `profiles` de producción se
llaman exactamente como las que crea `0010`.

---

## Tabla de seguimiento de hallazgos previos

Leyenda: **R** = RESUELTO · **P** = PARCIAL · **A** = ABIERTO.
"Doc" = `docs/designs/2026-11-09-egm-diseno-arquitectura.md` (líneas de la versión
remediada).

### Stage 5 — `zoom_out_report.md`

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| Z5-01 | BLOQUEANTE | **R** | CUJ 7 (doc:157-165), CUJ 8 (doc:166-173) y CUJ 9 (doc:175-181) existen; `components/dashboard-nav.tsx:26` (`signOut`), `app/auth/registro/page.tsx:31` (`signUp`), `app/auth/nueva-contraseña/page.tsx:48` (`updateUser`). |
| Z5-02 | IMPORTANTE | **R** | Doc:336-337 dice `max-age=63072000`, sin `includeSubDomains` y por qué; coincide con `next.config.mjs:31-34`. |
| Z5-03 | IMPORTANTE | **A** | Doc:419-420 sigue afirmando "la ruta más cara por visita" y "compone la imagen en cada petición"; `app/api/coupon-image/route.tsx:207-208` fija `s-maxage=86400`. El documento no menciona la caché de CDN en ninguna línea. |
| Z5-04 | IMPORTANTE | **A** | Doc:226-247 solo declara el invariante de `SELECT`; no hay invariantes de escritura ni el índice único. Evidencia no reflejada: `supabase/migrations/0002_security.sql:158-172` (INSERT/UPDATE/DELETE solo del dueño) y `:185-186` (`unique (user_id, coupon_code)`). |
| Z5-05 | MENOR | **R** | Doc:98-99 da la pregunta por resuelta con `docs/designs`; `CLAUDE.md:96` lo confirma. |
| Z5-06 | MENOR | **A** | Doc:231-234 lista `cta_text`, `expires_at` y `plan_type` sin anotar que nadie las usa; `grep -rn "expires_at\|cta_text\|plan_type" app lib components` no devuelve ninguna coincidencia. |
| Z5-07 | MENOR | **A** | El contrato de Storage sigue sin estar en "Capa de datos" (doc:224-267); el bucket `logos` solo aparece en el diagrama (doc:198, 204) y `ecocupon` solo en Open Questions (doc:92). |
| Z5-08 | MENOR | **P** | Doc:108-113 sigue describiendo "se inserta la fila" y luego "se persiste en `generated_image_url`", sin decir que el `insert` ya guarda la imagen base: `app/dashboard/crear/page.tsx:112` (`generated_image_url: baseImageUrl` dentro del insert 103-117). |
| Z5-09 | OBSERVACIÓN | **A** | Doc:467 mantiene "**no aplicar sin autorización**", mientras `docs/designs/2026-11-09-egm-analisis-estructural.md:255-256` afirma "el usuario ya la dio para aplicar `0010`". El criterio sigue sin unificarse. |

### Stage 6 — `comprehension_report.md`

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| C6-01 | BLOQUEANTE | **P** | Mejora real: doc:245-247 ahora dice "Invariante de datos que **hoy no se cumple**" y cita la policy vigente. Pero CUJ 3 (doc:131-132) sigue afirmando en presente "no se puede listar la tabla", que la base real desmiente (`qual=true`). La contradicción persiste, más estrecha. |
| C6-02 | IMPORTANTE | **R** | Doc:249-250 nombra el archivo (`docs/designs/2026-11-09-egm-analisis-estructural.md`) y doc:435-437 lo añade a "Additional Resources". El archivo existe. |
| C6-03 | IMPORTANTE | **A** | Doc:243 sigue etiquetando `user_exists` como "oráculo de enumeración" sin decisión (aceptar, mitigar, eliminar). No hay sección nueva que lo trate; `app/auth/recuperar/page.tsx:33-36` lo llama antes de decidir. |
| C6-04 | MENOR | **A** | Doc:216 sigue con "`/auth/login`, `/registro`, `/recuperar`, `/nueva-contraseña`, `/error`, `/verificar`": cinco rutas sin el prefijo `/auth/`. Rutas reales bajo `app/auth/`. |
| C6-05 | MENOR | **A** | Doc:285 sigue usando `${SITE_URL}` sin definirlo y sin conectarlo con `lib/site-url.ts:8-10` (doc:353-355 no menciona el vínculo). |
| C6-06 | MENOR | **A** | Doc:352 lista `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` sin explicar para qué; se usa en `app/auth/registro/page.tsx:35` y `app/auth/recuperar/page.tsx:51`. |
| C6-07 | MENOR | **A** | Doc:234 lista `plan_type` sin dominio de valores ni efecto; `grep` de `plan_type` sobre `app/`, `lib/`, `components/` no devuelve coincidencias. |
| C6-08 | OBSERVACIÓN | **R** | Doc:98-99; `CLAUDE.md:96`. |
| C6-09 | OBSERVACIÓN | **A** | No hay sección de arranque local ni prerrequisitos; las variables siguen dispersas (doc:350-352) y los comandos solo en el plan de verificación (doc:526-529). |

### Stage 7 — `critic_design_report.md`

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| D7-01 | BLOQUEANTE | **R** | Doc:275-279 ("**No define cabeceras**: la CSP vive en `next.config.mjs`"), doc:338-349, doc:412-417 y doc:491-501 describen la CSP estática; `proxy.ts:1-24` no define cabeceras y `next.config.mjs:47-61` sí contiene la CSP con `'unsafe-inline'`. La cita `proxy.ts:40-52` desapareció. |
| D7-02 | IMPORTANTE | **P** | Doc:258-260 documenta el 404 indistinguible, pero no hay paso bloqueante "confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel Production" antes del ítem 1 (doc:524-537) y el código sigue sin separar los casos: `app/cupon/[id]/page.tsx:46-53` registra y llama `notFound()` igual. |
| D7-03 | IMPORTANTE | **P** | Doc:253-256 menciona la RPC `security definer` como "**Alternativa preferible** … Queda como decisión pendiente, no como hecho", pero no se añadió como Alternativa F en "Alternatives Considered" (doc:357-403) ni se declara en qué se invierte la elección por B. |
| D7-04 | IMPORTANTE | **A** | NFR Seguridad (doc:409-417) sigue enumerando tres prioridades sin la superficie de `/api/coupon-image`; `app/api/coupon-image/route.tsx:48-74` sigue sin autenticación, con parámetros y URL de QR arbitrarios. |
| D7-05 | IMPORTANTE | **A** | La tabla de funciones (doc:241-242) sigue presentando `increment_*` como invariantes neutrales; no hay mención de sobreconteo. `supabase/migrations/0002_security.sql:221-222` concede EXECUTE a `anon`. |
| D7-06 | IMPORTANTE | **A** | Doc:536-537 sin cambios: sigue diciendo revertir la policy a `using (true)` y sus disparadores son fallos de cupones **públicos**, no el 404 de un privado. |
| D7-07 | IMPORTANTE | **A** | Doc:54-55 ("**No hay red de pruebas**") y doc:517-522 (ítem 7) sin cambios; existen `e2e/login-exitoso.spec.ts`, `persistencia-sesion.spec.ts`, `logout.spec.ts`, `crear-cupon.spec.ts`, `contadores-vistas-compartidos.spec.ts`, y `playwright.config.ts:3-6` declara producción. El gate `pnpm test:e2e` (doc:529) sigue sin condición de entorno. |
| D7-08 | MENOR | **A** | Doc:484-489 (ítem 3) sigue pidiendo lo ya implementado en `app/cupon/[id]/page.tsx:36-38` + `lib/supabase/admin.ts:30-36`. |
| D7-09 | MENOR | **P** | Doc:262-266 mantiene "la service role aparece en dos sitios y solo dos" y nombra `upload-logo` y `admin.ts`, sin el consumidor `app/cupon/[id]/page.tsx:4,34`. El consumo sí se describe en doc:253. |
| D7-10 | MENOR | **P** | Doc:353-355 ya precisa "valores que se **persisten**", pero no menciona el enlace compartido, que sigue armándose con `window.location.origin` (`components/coupon-share-buttons.tsx:18-20`). |
| D7-11 | OBSERVACIÓN | **A** | Igual que Z5-06: `expires_at` y `cta_text` (doc:231) sin anotación; `grep` sin coincidencias en el código. |

### Stage 7 — `critic_structural_report.md`

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| S7-01 | BLOQUEANTE | **R** | Igual que D7-01. |
| S7-02 | BLOQUEANTE | **P** | El ítem 4 sí se corrigió (doc:491 "Modify — **hecho y corregido**"), pero el ítem 1 (doc:468-474) sigue proponiendo "añadir `revoke execute on function public.handle_new_user() from public`" y `search_path` a `set_updated_at()`, ya presentes en `supabase/migrations/0010_harden_rls_and_timestamps.sql:67,77,85`; y el ítem 3 sigue igual. |
| S7-03 | IMPORTANTE | **R** | Doc:336-337 vs `next.config.mjs:31-34`. |
| S7-04 | IMPORTANTE | **R** | Doc:435-437 incluye `2026-11-09-egm-analisis-estructural.md`; el archivo existe. |
| S7-05 | IMPORTANTE | **A** | Doc:524-537 sigue con cinco comprobaciones; ningún invariante declarado (cliente anónimo y RLS doc:262-263, orden de la comprobación de usuario doc:281-283, allowlist del logo doc:306-308, sniffing por bytes doc:319-321) tiene comando u observación. |
| S7-06 | IMPORTANTE | **A** | Doc:431 (`### Additional Resources`) y doc:444 (`### Future Improvements`) siguen en H3, colgando de `## Non-Functional Requirements` (doc:407). |
| S7-07 | IMPORTANTE | **A** | Doc:224-267 no tabula ninguna matriz de policies ni `grant execute` por rol. Evidencia no reflejada: `0002_security.sql:153-172,221-222`; `0003_allow_public_coupon_links.sql:16-20`; `0010:32-36,41-57,62`. |
| S7-08 | IMPORTANTE | **A** | Igual que C6-03. |
| S7-09 | IMPORTANTE | **A** | Igual que D7-07. |
| S7-10 | MENOR | **A** | Doc:366 (`Reason for Rejection: Rejected by author`), doc:377 (`Por qué se elige`), doc:384, 396, 403 (`Por qué no se elige`): sigue asimétrico. |
| S7-11 | MENOR | **R** | Igual que Z5-05. |
| S7-12 | MENOR | **A** | Doc:89 sigue citando `0002_security.sql:206-215`; el filtro `and is_public = true` está en la línea **216**. |
| S7-13 | MENOR | **A** | (a) `lib/supabase/middleware.ts:4-10` doc:279: aceptable. (b) Doc:285 cita `google-button.tsx:38-43`; la llamada abre en 37 y `redirectTo` en 40 (`components/google-button.tsx:37-42`). (c) Doc:109 cita `crear/page.tsx:104-119`; el insert va de 103 a 117. Sin corregir. |
| S7-14 | MENOR | **A** | Doc:275-276 sigue diciendo "en cada petición que no sea estático"; el matcher excluye `_next/static`, `_next/image`, `favicon.ico` y extensiones de imagen (`proxy.ts:8-24`). |
| S7-15 | MENOR | **A** | Doc:215 ("`/cupon/[id]` … cuenta vistas") frente a CUJ 3 (doc:132-133) y Open Questions (doc:89). |
| S7-16 | MENOR | **A** | Doc:512 sigue diciendo "ocho llamadas … con listas de columnas copiadas". Son 8 llamadas, pero solo 5 llevan lista: `app/dashboard/page.tsx:21`, `app/dashboard/mis-cupones/page.tsx:42`, `app/dashboard/crear/page.tsx:104`, `app/cupon/[id]/page.tsx:41`, `app/cuponera/page.tsx:14`. |
| S7-17 | MENOR | **A** | Doc:111-112 dice "El cupón aparece en `/dashboard/mis-cupones`"; tras guardar la página sigue en `/dashboard/crear` y solo ofrece un botón (`app/dashboard/crear/page.tsx:236-238`). |
| S7-18 | MENOR | **A** | Los encabezados siguen en inglés (doc:9, 42, 60, 71, 81, 185, 357, 407, 458) en un documento en español. |
| S7-19 | OBSERVACIÓN | **A (no verificable)** | No ejecuté `pnpm build`; no puedo confirmar el conteo de 18 rutas (doc:207, 526). Queda como afirmación sin verificar por mi parte. |
| S7-20 | OBSERVACIÓN | **A** | Doc:236 titula la tabla "Funciones (`security definer`, con `search_path` fijado)" mientras el ítem 1 (doc:471-473) introduce `set_updated_at()`, que es `security invoker` (`0010:74-83`). |

### Stage 7 — `critic_style_report.md`

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| Y7-01 | BLOQUEANTE | **R** | Igual que D7-01. |
| Y7-02 | IMPORTANTE | **P** | La CSP ya se cita una sola vez y bien (`next.config.mjs:47-61`, doc:338). Pero doc:334 sigue citando las otras cabeceras como `next.config.mjs:10-29` (el bloque real va de 15 a 65) y el ítem 4 cita HSTS en `next.config.mjs:19-31` (real 30-35, doc:494). |
| Y7-03 | IMPORTANTE | **R** | Igual que Z5-02/S7-03. |
| Y7-04 | IMPORTANTE | **R** | Doc:98-99; `CLAUDE.md:96`. |
| Y7-05 | IMPORTANTE | **P** | Igual que C6-01: doc:30-31 lo llama "cambio en vuelo", doc:245-247 dice que el invariante "hoy no se cumple" y CUJ 3 (doc:131-132) lo da por hecho. |
| Y7-06 | MENOR | **R** | Doc:30-31 ya enumera "HSTS" y no "CSP con nonce en `proxy.ts`". |
| Y7-07 | MENOR | **A** | Igual que S7-15. |
| Y7-08 | MENOR | **A** | Igual que S7-10. |
| Y7-09 | MENOR | **A** | Doc:262-263 sigue usando "clave publicable" sin mapearla a `NEXT_PUBLIC_SUPABASE_ANON_KEY` (doc:351). |
| Y7-10 | MENOR | **R** | Doc:412 ya no dice "estado razonable"; pasa a hechos ("HSTS presente y CSP estática …, sin nonce"). |
| Y7-11 | MENOR | **A** | Doc:419-420 sigue con "es la ruta más cara por visita" y doc:423 admite "**No verificado**". |
| Y7-12 | MENOR | **A** | Igual que S7-12. |
| Y7-13 | OBSERVACIÓN | **A** | Doc:11-14 mantiene "tres superficies" sin aclarar que son áreas de producto, no grupos de rutas (doc:207-222). |
| Y7-14 | OBSERVACIÓN | **A** | Igual que Z5-07. |

### Recuento

| Grupo | R | P | A | Total |
|---|---|---|---|---|
| Stage 5 | 3 | 1 | 5 | 9 |
| Stage 6 | 2 | 1 | 6 | 9 |
| Stage 7 (design) | 1 | 4 | 6 | 11 |
| Stage 7 (structural) | 4 | 1 | 15 | 20 |
| Stage 7 (style) | 5 | 2 | 7 | 14 |
| **Total** | **15** | **9** | **39** | **63** |

Solo bloqueantes e importantes (28): **9 R · 6 P · 13 A**. Los bloqueantes: Z5-01 R,
C6-01 P, D7-01 R, S7-01 R, S7-02 P.

---

## Hallazgos nuevos

### Z8-01 — IMPORTANTE — CUJ 4 afirma que los errores de sesión se ven "hoy en inglés", y el código ya los traduce

- **Ubicación:** doc:138-139 (CUJ 4) y doc:503-507 (ítem 5 del plan).
- **Qué contradice:** el `Then` cierra con "en error se muestra el mensaje de Supabase
  — hoy en inglés", y el ítem 5 sigue proponiendo "traducir al español los mensajes de
  error de Supabase mediante un mapa de los códigos conocidos, en vez de mostrar el
  texto crudo". Ese mapa existe y está enchufado en los cuatro formularios.
- **Evidencia:** `app/auth/login/page.tsx:13,35` importa y usa `traducirErrorAuth`;
  `lib/auth-errors.ts:9-38` define el mapa (7 códigos + el caso "after N seconds");
  `app/auth/recuperar/page.tsx:12,59`; `app/auth/registro/page.tsx:13,44`;
  `app/auth/nueva-contraseña/page.tsx:11,52`.
- **Por qué importa (zoom out):** el documento se declara el mapa del sistema "tal como
  está construido hoy" y su lector de mayor riesgo es un agente que lo va a modificar.
  Un agente que ejecute el ítem 5 construirá una tabla que ya existe y puede duplicar el
  módulo. Además, la afirmación "hoy en inglés" es la única del bloque de auth que ya no
  se sostiene.

### Z8-02 — IMPORTANTE — El plan dice que "ningún archivo se ha modificado" y a la vez da el ítem 4 por hecho; `next.config.mjs` y `proxy.ts` no figuran en el informe final

- **Ubicación:** doc:460-461 frente a doc:491-501.
- **Qué contradice:** la cabecera del plan afirma "Ningún archivo de este plan se ha
  modificado todavía salvo los ya listados en el informe final", mientras el ítem 4 se
  titula "(Modify — **hecho y corregido**)" y su "Estado" dice "HSTS añadido".
- **Evidencia:** `git status` marca `M next.config.mjs` y `M proxy.ts`;
  `docs/designs/2026-11-09-informe-final.md:176-181` enumera los 13 archivos
  modificados y **no** incluye ninguno de los dos (y `:156` los daba por pendientes:
  "CSP con `script-src 'unsafe-inline'` y sin HSTS").
- **Por qué importa:** la lista de trabajo del plan deja de ser fiable exactamente en el
  punto que la remediación tocó. La contradicción la introdujo la propia remediación al
  marcar el ítem 4 como hecho sin ajustar la cabecera del plan.

### Z8-03 — IMPORTANTE — El "aviso de diseño" describe como actual un modo de fallo que solo existe después de aplicar `0010`

- **Ubicación:** doc:258-260.
- **Qué contradice:** "**Aviso de diseño: hoy** las tres causas de fallo de esa lectura
  (falta la clave, clave inválida, error de lectura) y 'el cupón no existe' producen el
  mismo 404 silencioso". Hoy, con la policy en `using (true)`, la falta de
  `SUPABASE_SERVICE_ROLE_KEY` **no** produce 404: el código cae al cliente con RLS y la
  policy abierta sí devuelve el cupón privado.
- **Evidencia:** `app/cupon/[id]/page.tsx:34-44` (`const reader = createAdminClient()`
  y `(reader ?? supabase)`); `supabase/migrations/0003_allow_public_coupon_links.sql:20`
  (`using (true)`); `supabase/migrations/0010_harden_rls_and_timestamps.sql:3-4` ("NO
  aplicada todavía"). La consulta a producción devolvió
  `coupons_select_own_or_public SELECT qual=true`. El enunciado solo es cierto en el
  estado objetivo, no en el actual.
- **Por qué importa:** invierte la lectura de riesgo del documento: presenta como
  comportamiento de hoy una consecuencia de `0010`, que es justo lo que el lector
  necesita separar para decidir con conocimiento.

### Z8-04 — MENOR — Referencia interna rota: NFR remite a "Cabeceras y seguridad", sección que no existe

- **Ubicación:** doc:414 (`ver "Cabeceras y seguridad"`).
- **Qué contradice:** el documento no tiene ninguna sección con ese nombre; la materia
  vive en `### Despliegue e integraciones` (doc:328). `grep` de "Cabeceras y seguridad"
  solo devuelve la propia línea 414.
- **Evidencia:** encabezados del documento (doc:1-524): no existe el título citado.
- **Nota:** lo introdujo la remediación al reescribir la NFR de seguridad.

### Z8-05 — MENOR — Deriva de citas `archivo:línea` en los flujos de auth (los archivos se modificaron bajo el documento)

- **Ubicación:** doc:137, 145, 147, 170-171.
- **Qué contradice:** las citas apuntan a las líneas anteriores a los cambios de código.
  Doc:137 cita `app/auth/login/page.tsx:28` para `signInWithPassword` → real `:29`.
  Doc:145 cita `app/auth/recuperar/page.tsx:32` para `user_exists` → real `:33`.
  Doc:147 cita `:53` para `resetPasswordForEmail` → real `:54`. Doc:170-171 cita
  `app/auth/nueva-contraseña/page.tsx:34-41` y `:47` → real `:37-44` y `:48`.
- **Evidencia:** `app/auth/login/page.tsx:29`; `app/auth/recuperar/page.tsx:33,54`;
  `app/auth/nueva-contraseña/page.tsx:37-44,48`; las tres pantallas importan
  `traducirErrorAuth` (una línea nueva cada una) y `nueva-contraseña` además un `catch`.
- **Por qué importa:** el valor declarado del documento es ser verificable línea a línea;
  cuatro citas del mismo bloque ya no resuelven. Es el mismo defecto que S7-13, ampliado.

### Z8-06 — OBSERVACIÓN — El documento cita como fuente del RLS un informe que aún contiene el error de CSP que acaba de corregir

- **Ubicación:** doc:249-250 y doc:435-436 remiten a
  `docs/designs/2026-11-09-egm-analisis-estructural.md`.
- **Qué contradice:** la nota de corrección (doc:34-40) declara corregida la sección de
  cabeceras, pero el informe que el propio documento eleva a fuente autorizada del
  mecanismo de RLS sigue afirmando lo contrario sobre la CSP.
- **Evidencia:** `docs/designs/2026-11-09-egm-analisis-estructural.md:151` ("CSP con
  nonce por respuesta en `proxy.ts:20-52`"), `:155-160` y `:287` ("HSTS y CSP con nonce
  ya están escritos; falta verificarlos en un preview"); frente a `next.config.mjs:38-46`
  ("se implementó y se DESCARTÓ con evidencia") y `proxy.ts:18-20`.
- **Por qué importa:** un lector que siga la cadena de fuentes del documento llega a la
  afirmación que la review marcó como bloqueante. O se corrige el informe citado o se
  advierte en el documento que está desactualizado.

### Z8-07 — OBSERVACIÓN — La Open Question sobre los nombres de las policy de `profiles` ya está contestada por producción en el sentido favorable

- **Ubicación:** doc:83-87.
- **Qué añade:** la pregunta teme que producción tenga policies de `profiles` con
  "otros nombres" y queden duplicadas. La base real las tiene con **exactamente** los
  nombres que usa `0010`, así que el `drop policy if exists` + `create policy` las
  reemplaza y no se duplican.
- **Evidencia:** consulta de solo lectura a producción
  (`pg_policies`): `profiles_select_own`, `profiles_insert_own`, `profiles_update_own`,
  `profiles_delete_own`; `0010_harden_rls_and_timestamps.sql:43-57`.
- **Por qué lo reporto:** no es un defecto del documento (no es exigible consultar
  producción), pero deja de ser una pregunta abierta y así lo puede cerrar el autor.
  **No verifiqué** si existen policies de escritura adicionales creadas por fuera de
  `0002`/`0003` con otros nombres (la consulta cubre solo `coupons` y `profiles`).

---

## Lo que está bien (verificado, no repetido)

- El racimo de CSP quedó cerrado de forma coherente en **las cuatro** secciones que lo
  citaban (doc:275-279, 338-349, 412-417, 491-501) y ya no queda ninguna referencia al
  nonce como vigente. `proxy.ts:1-24` y `next.config.mjs:47-61` respaldan la versión
  nueva. Es un arreglo real, no de fachada.
- Z5-01 (CUJ 7, 8, 9), Z5-02/S7-03/Y7-03 (HSTS), Z5-05/C6-08/S7-11/Y7-04
  (`docs/designs`), C6-02/S7-04 (el análisis estructural nombrado y listado) y Y7-10
  ("estado razonable") están cerrados con evidencia de código, no solo con prosa.
- Las afirmaciones que ya eran correctas y siguen siéndolo: mapa de 18 rutas por
  conteo de `app/**` (no pude confirmar el número del build), descripción de
  `upload-logo` (401/500/413, sniff por bytes, SVG rechazado,
  `app/api/upload-logo/route.ts:9,13-43,45-97`), allowlist anti-SSRF
  (`app/api/coupon-image/route.tsx:11-23`), guard del panel
  (`app/dashboard/layout.tsx:10-15`) y la Alternativa E.

## Límites de esta revisión (lo que no pude comprobar)

- **No ejecuté `pnpm build`** (agente de solo lectura): el "18 rutas" sigue sin
  verificación independiente (S7-19).
- **No verifiqué la rama de producción de ninguna cabecera** (una respuesta real de
  `curl -I` en el dominio desplegado): todo lo de HSTS/CSP es lectura de
  `next.config.mjs` y `proxy.ts`, no observación de la respuesta servida.
- **No verifiqué si `SUPABASE_SERVICE_ROLE_KEY` existe en Vercel Production**: la
  precondición de D7-02 (y de `0010:15-17`) sigue siendo una incógnita operativa.
- **No verifiqué** el número de WhatsApp real de `/precios` ni el contenido de los
  buckets `logos`/`ecocupon`; la consulta a la base cubrió solo `pg_policies` de
  `coupons` y `profiles`.
- No declaré resuelto nada que no haya visto en el código o en la consulta a producción.

<!-- Fin del Stage 8 — Intermediate Zoom Out Review -->
