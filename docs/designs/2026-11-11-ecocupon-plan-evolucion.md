# EcoCupon.cl — Plan de evolución

- **Autor:** eocupon
- **Fecha:** 2026-11-11
- **Naturaleza:** análisis y planificación. **No autoriza implementación.**
- **Base:** las cinco etapas de `egm-review` sobre
  `2026-11-11-ecocupon-evaluacion-integral.md`, contrastadas con el repositorio y
  con producción.
- **Anexos:** mediciones y evidencias al final. El cuerpo es para decidir.

---

## 1. Qué es EcoCupon hoy

**Un generador de cupones con imagen, enlace y QR, para comercios chilenos.** Eso
es lo que el código hace y lo que se puede usar hoy. `[HV]`

El brief de encargo lo describe como «una plataforma de fidelización comercial que
conecta comercios y consumidores». **Esa descripción no corresponde al estado
actual, y conviene decirlo antes de planificar sobre ella:** `[HV]`

| Lo que implica «plataforma que conecta» | Estado real |
|---|---|
| Hay consumidores que descubren ofertas | La cuponera pública tiene **1 cupón**, y es de prueba |
| Hay comercios que compiten por aparecer | **5 cuentas**, ninguna con plan de pago |
| Hay un mercado de dos lados | Un lado tiene cinco cuentas y el otro, un cupón |

No es una plataforma de dos lados: es **una herramienta de un solo lado**, con un
escaparate vacío. Planificar mejoras de fidelización o de descubrimiento antes de
resolver eso es construir sobre una premisa que los datos no sostienen.

**Lo que sí tiene, y no es poco:** una promoción se convierte en un objeto
compartible —imagen con QR, enlace público, código— en menos de un minuto y sin
diseñador.

---

## 2. Qué puede hacer realmente

Verificado contra el repositorio, no contra el marketing. `[HV]`

**Funciona y está publicado:**

1. Registro e inicio de sesión, por correo y **con Google** (hay 2 identidades de
   Google creadas).
2. Crear un cupón con título, descuento, código y logo.
3. Subir un logo validado **por firma de bytes** —rechaza SVG— con límite de 5 MB.
4. Generar el **PNG del cupón con QR**, descargable, cacheado 24 h.
5. Publicar el cupón en una **página pública** con enlace propio.
6. Compartir por WhatsApp **con la imagen adjunta y el enlace** en móvil, o con el
   enlace en escritorio.
7. Buscar en la cuponera por negocio, título o código.
8. Ver **contadores** de vistas y compartidos.
9. Borrar un cupón (solo la fila; el logo queda en Storage).

**No existe, aunque el sitio lo haya dicho:**

| Promesa retirada del sitio | Estado real |
|---|---|
| Generación con IA | No hay ninguna integración de IA |
| «Sin marca de agua» en Pro | La marca se estampa siempre |
| Límites de cupones por plan | No se aplican: no hay tope en el código |
| API, multiusuario, soporte 24/7, branding custom | Nada de eso existe |

**No verificable todavía:** alta real de cuenta tras el registro, creación de cupón
de punta a punta estando dentro, subida de logo, y el dashboard completo. No tengo
credenciales y no lo doy por bueno.

---

## 3. Correcciones ya realizadas el 2026-11-11

Para que el plan no vuelva a ordenar trabajo hecho. `[HV]`

| Corrección | Commit |
|---|---|
| Compartir la **imagen** del cupón por WhatsApp, y el enlace en ambas rutas | `5b4e315`, `259ea18` |
| Botón de **descarga** en la página pública | `5b4e315` |
| **Buscador de la cuponera** funcional, con estado vacío y anuncio accesible | `5b4e315` |
| Registro con `<h1>`, etiquetas, `autocomplete` y enlaces legales | `5b4e315` |
| **Error de hidratación #418** corregido | `5b4e315` |
| **Once promesas falsas** retiradas, incluidos los términos | `5b4e315`, `4fb6e97` |
| Portada con un **cupón real** de 4Time Repuestos | `1ba5688` |
| **Objetivos táctiles** a 44/48 px | `4fb6e97` |
| `robots.txt` y `sitemap.xml` en producción (daban 404) | `a254a8d` desplegado |
| **Migración `0010`**: cupones privados legibles por `anon`, de 3 a **0** | aplicada |

---

## 4. Contradicciones que los revisores detectaron, y cómo se resolvieron

Los cinco revisores coincidieron en que el informe no tenía **una sola versión de
la verdad**: al corregir reclamación por reclamación quedaron tres capas —la tabla
de la adenda, los avisos en §1 y §9, los tachados en §8— y ninguna lectura única
decía qué estaba hecho. Se resolvió con avisos en el lugar, no en tabla aparte.

**Otras contradicciones, ya corregidas:**

- La adenda decía «publicado» y el informe hermano decía «no desplegado». El
  segundo está actualizado.
- El archivo `0010` seguía diciendo «NO aplicada todavía».
- Dos filas de la tabla de contradicciones describían cifras que el código ya había
  unificado.
- «Ocho promesas» contra una tabla de diez filas: sin reconciliación.
- El párrafo de riesgo legal afirmaba que las promesas estaban en los términos; la
  de IA estaba y se retiró, así que hoy es falso.

**Tres afirmaciones mías que resultaron falsas y quedan retiradas:**

1. **«La marca de agua del plan Pro es la falsa»** — la cadena ya no se publica.
2. **«El canal de WhatsApp nunca ha convertido»** — con cero ventas, ningún canal
   ha convertido. Es un resultado nulo, no un hallazgo. Canal **no probado**.
3. **«Los CTA ya están a 44 px»** — no lo estaban: `default` era 36 px. Corregido.

**El hallazgo que sigue en pie y es el más serio:** el remedio que yo proponía para
el oráculo de correos **no cierra el oráculo**. Ver P0-1.

---

## 5. Evaluación del producto

### 5.1 El recorrido del comercio

| Paso | Estado | Problema |
|---|---|---|
| Descubrir el sitio | Correcto | La portada ya muestra un cupón real, no una maqueta |
| Registrarse | Correcto y accesible | Requiere confirmar correo antes de entrar |
| Crear el primer cupón | **No verificado** | No se ha probado con una cuenta real |
| Personalizar con su marca | Parcial | Sube logo; no puede elegir color ni plantilla |
| Distribuir | Correcto | Imagen y enlace por WhatsApp, QR y descarga |
| Administrar | **Incompleto** | **No hay ruta de edición de cupón**: no se puede corregir un error |
| Entender resultados | Parcial | Dos contadores, sin serie temporal ni comparación |

**Dos carencias concretas:** no se puede **editar** un cupón ya creado —hay que
borrarlo y rehacerlo— y no se puede **cerrar** una promoción. `expires_at` existe
en la base y **no se usa en ninguna parte de la aplicación**, así que un cupón
vencido sigue mostrándose igual de válido.

### 5.2 El recorrido del consumidor

| Paso | Estado | Problema |
|---|---|---|
| Recibir el cupón | Correcto | En móvil llega la imagen y el enlace |
| Abrirlo | Correcto | Página propia, título con negocio y descuento |
| Ver si sirve | **Deficiente** | Sin comuna, sin dirección, sin vigencia, sin horario |
| Leer condiciones | **Ausente** | No hay ninguna condición en la página del cupón |
| Usarlo en el local | Parcial | Muestra código y QR; sirve mostrarlo en pantalla |
| Compartirlo | Correcto | Botones de WhatsApp, copiar y compartir nativo |

**El problema mayor es el segundo:** el consumidor que abre un cupón **no sabe si
puede usarlo**. No hay comuna, ni dirección, ni vigencia, ni condiciones. El QR
tampoco resuelve a ninguna acción.

### 5.3 Diseño e identidad

- **Cinco cabeceras y cinco pies escritos por separado**, con cinco tamaños de logo
  distintos. Un comercio que compara dos pantallas ve dos productos.
- La tarjeta de precios de Business y la de Pro se ven idénticas.
- Falta densidad de información local: ninguna comuna, ningún CLP, ninguna
  referencia a boleta.
- Lo mejor resuelto: la imagen del cupón, los estados vacíos del dashboard y la
  página legal, que es la que más parece de una empresa real.

---

## 6. Oportunidades

Aprovechando lo que ya existe: componentes shadcn, contadores en la base, imagen
con QR, política de actualización por dueño.

1. **Decirle al consumidor si el cupón sirve.** Comuna, dirección, vigencia y
   condiciones en la página del cupón. Los datos ya están en la base; `expires_at`
   solo hay que usarlo.
2. **Dejar corregir un cupón.** Una ruta de edición; la política
   `coupons_update_own` ya lo permite.
3. **Dejar cerrar una promoción.** Usar `expires_at` y mostrar «vencido» cuando
   corresponda, en vez de dejar cupones eternamente válidos.
4. **Convertir los contadores en algo útil.** Serie temporal y comparación entre
   cupones, en lugar de dos números sueltos.
5. **Unificar cabecera y pie** en un componente usado por todas las páginas.
6. **Presentar mejor la promoción.** Plantillas o color de marca, partiendo de la
   imagen que ya se genera.
7. **El QR como acción.** Hoy solo es un dibujo: podría abrir la página del cupón.
8. **Instrumentación del embudo**: alta → primer cupón → primer compartido. Hoy no
   hay ninguna medición del recorrido.
9. **Fidelización**, cuando exista demanda que la justifique: recompra, cupón
   recurrente, lista de clientes. **Hoy es prematuro** y el plan no lo prioriza.

**Lo que no está en la lista, y es lo que más falta:** saber si un comercio quiere
esto. Ninguna mejora de producto responde esa pregunta.

---

## 7. Plan de evolución

### P0 — Comprometen funcionamiento, seguridad o confianza

**P0-1. Cerrar el oráculo de enumeración de correos.** `[HV]`
- **Qué aporta:** hoy cualquiera puede preguntar a la base si un correo está
  registrado. Es una fuga de datos de los comercios.
- **Qué existe:** `user_exists(p_email text)` concedida a `anon`
  (`0004_user_exists.sql:31`), usada por `/auth/recuperar`.
- **Qué falta:** **el remedio obvio no sirve.** Mover la comprobación a una ruta de
  servidor devuelve el mismo booleano al mismo visitante anónimo. Solo lo cierra
  limitar la tasa, exigir captcha o responder de forma indistinguible.
- **Cómo verificar:** llamar al endpoint veinte veces seguidas con un correo
  existente y otro inexistente y comprobar que no se puede distinguir ni automatizar.
- **Efecto colateral:** `e2e/recuperacion-correo-inexistente.spec.ts` afirma el
  comportamiento actual; el cambio lo rompe y hay que reemplazarlo.

**P0-2. Decidir qué pasa con los contadores.** `[HV]`
- **Qué aporta:** `increment_views` e `increment_shares` son invocables por `anon`
  sin límite, así que las cifras se pueden inflar a voluntad.
- **Consecuencia directa:** **mientras siga así, no se pueden prometer «vistas y
  compartidos» como beneficio de un plan de pago.** Se vendería una métrica que el
  propio repositorio declara falsificable. Hoy `/precios` la promete.
- **Qué falta:** decidir entre contarlas en el servidor con límite de tasa, o
  dejar de ofrecerlas como valor.

**P0-3. Reparar el historial de migraciones.** `[HV]`
- `0003`, `0004`, `0007`, `0008` y `0009` están aplicadas en la base y no
  registradas. Un `db push` las vería como pendientes y reintentaría su DDL.
- **Cómo verificar:** `db push --dry-run` debe mostrar solo migraciones nuevas.

**P0-4. Activar la protección de contraseñas filtradas.** `[HV]`
- Supabase la ofrece y está apagada. Se activa en el panel.

**P0-5. Resolver `profiles_update_own` antes de cualquier control por plan.** `[HV]`
- La política permite al titular escribir **cualquier** columna de su fila, incluida
  `plan_type`. Mientras exista, ningún límite basado en esa columna es real.

### P1 — Experiencia y utilidad comercial

**P1-1. Condiciones y vigencia en el cupón.** Comuna, dirección, horario,
`expires_at` y condiciones. Es lo que decide si el consumidor lo usa.
**P1-2. Edición de cupón.** Sin esto, un error de tipeo obliga a borrar y rehacer.
**P1-3. Cerrar promociones.** Usar `expires_at` y mostrar «vencido».
**P1-4. Probar el recorrido completo con una cuenta real** —alta, confirmación,
creación, logo, dashboard— y arreglar lo que falle. **Es el único P1 que no se
puede hacer sin credenciales.**
**P1-5. Decidir la cuponera:** retirarla del sitio, o llenarla. Con un cupón de
prueba no aporta y resta credibilidad.

### P2 — Diseño, administración y funciones

**P2-1.** Unificar cabecera y pie en un componente.
**P2-2.** Contadores como serie temporal, con comparación entre cupones.
**P2-3.** Borrar el logo de Storage al borrar el cupón: hoy se acumula para siempre.
**P2-4.** Permitir cambiar el logo después de crear el cupón.
**P2-5.** Estados de error y vacío dentro del dashboard, al nivel de los de la
portada.

### P3 — Evolución y diferenciación

**P3-1.** Instrumentar el embudo: alta → primer cupón → primer compartido.
**P3-2.** Plantillas o color de marca al generar la imagen.
**P3-3.** QR que abra la página del cupón.
**P3-4.** Fidelización: recompra, cupón recurrente, lista de clientes. **Requiere
demanda previa.**

---

## 8. Cierre

**1. Qué es EcoCupon hoy.** Un generador de cupones con imagen, enlace y QR para
comercios chilenos. No es una plataforma de dos lados: tiene cinco cuentas y un
cupón público de prueba.

**2. Qué puede hacer realmente.** Crear, personalizar con logo, generar imagen con
QR, publicar, compartir por WhatsApp con la imagen, buscar en la cuponera y contar
vistas y compartidos. Verificado, salvo el interior del dashboard, que no he
probado por falta de credenciales.

**3. Qué necesita mejorar.** Que el consumidor sepa si el cupón sirve (vigencia,
comuna, condiciones); poder editar y cerrar un cupón; que las cifras sean
confiables o no se prometan; y cerrar el oráculo de correos.

**4. Cuáles son sus oportunidades comerciales.** La única que no depende de
construir nada: **un comercio concreto al que ofrecérselo esta semana**. Las demás
—medición confiable, presentación, fidelización— se construyen después de saber si
alguien lo quiere.

**5. Qué conviene desarrollar primero.** P0 completo, que es pequeño y no depende
de ninguna decisión de negocio. Después P1-1, porque mejora el cupón que ya se
comparte. El resto espera.

**6. Qué decisiones corresponden al propietario.**

1. **¿Alguna vez le ofreciste EcoCupon a un comercio concreto?** Sigue sin
   respuesta y es la que más cambia el plan: si nunca se intentó, el problema es de
   distribución y las mejoras de producto no lo resuelven.
2. **¿Se retira la cuponera o se llena?** Hoy tiene un cupón de prueba.
3. **¿Se cuentan las métricas en el servidor, o se dejan de ofrecer?**
4. **¿Business sigue en el sitio** con las funciones que hoy lista, de las cuales
   «Cupones ilimitados» y «Vistas y compartidos» no tienen respaldo?
5. **¿Se autoriza implementar el P0**, o se queda como plan?

---

## Anexo A — Mediciones que sostienen este plan

Tomadas contra `www.ecocupon.cl` el 2026-11-11.

| Medición | Resultado |
|---|---|
| Rutas públicas | `/`, `/precios`, `/cuponera`, `/auth/registro`, `/auth/login`, `/condiciones`, `/privacidad` — todas 200 |
| `robots.txt`, `sitemap.xml` | 200 (antes 404) |
| Menciones de IA en portada y precios | **0** |
| Cupones en la cuponera | **1**, de prueba |
| Desbordamiento móvil a 390 px | ninguno |
| Consola en la página del cupón | **0 errores** (antes 1 de hidratación) |
| Lectura como rol `anon` | 1 cupón visible, **0 privados** (antes 3) |
| Enlace a cupón privado | 200 |
| UUID inexistente | 404 |

## Anexo B — Datos de la base

`auth.users`: 5, todos confirmados, 2 con identidad de Google. `profiles`: 5.
`coupons`: 4, 1 público. Planes pagados: **0**.
Primera cuenta 2026-07-10; última 2026-11-09.

## Anexo C — Informes de la revisión

`docs/designs/egm-review/2026-11-11-ecocupon-evaluacion-integral/`:
`zoom_out_report.md` (etapa 5), `comprehension_report.md` (6),
`critic_report.md` (7), `intermediate_zoom_out_report.md` (8),
`implementation_readiness_report.md` (9).

## Límites

- No se implementó ni se modificó código en esta etapa.
- No se probó el interior del producto: alta real, dashboard, subida de logo.
- No se verificaron tarifas de pasarela ni variables de entorno de Vercel.
- Las mediciones son del 2026-11-11 y cambian con el próximo despliegue.
