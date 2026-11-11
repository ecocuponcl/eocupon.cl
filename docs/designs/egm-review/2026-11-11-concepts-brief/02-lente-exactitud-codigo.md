# Lente `egm-codebase-details` — exactitud técnica y reutilización

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** verificar cada afirmación del brief contra el repositorio. Atacar
  la conclusión central.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** **casi todas las citas de archivo y línea del brief se
  confirman.** Los errores no están en lo que el brief cita, sino en lo que
  concluye a partir de ellas, y en tres afirmaciones de método o de fuente que no
  se sostienen.

> Síntesis del Elefante sobre el informe del lente, que incluía una tabla de
> verificación afirmación por afirmación. Esa tabla se reproduce aquí en forma
> resumida; el informe crudo no se persistió.

## Los ocho hallazgos

**H1 — §5 invierte el referente del despliegue.** `[HV]`
El brief dice que producción está «3 commits atrás» de `origin/main`. La verdad
es la inversa: `main` local está 3 commits **adelante** de `origin/main`
(`a28ae7c`, `0c2da22`, `a254a8d`), y producción coincide con `origin/main`. La
acción (publicar) es la correcta; la justificación está al revés.

**H2 — §2 declara un método que no reproduce su resultado.** `[HV]`
El brief afirma que un `grep` de `canje`, `redeem` y equivalentes «no devuelve
nada». Devuelve una coincidencia: `app/auth/confirm/route.ts:9` («`/auth/callback`
canjea un `code`, y ese canje usa PKCE»). La conclusión —no existe unidad de
canje en el dominio— resiste. El procedimiento declarado, no.

**H3 — §2 se sobre-extiende al concluir que no hay unidad de cobro.** `[OR]`
sobre `[HV]`
«Cupones por comercio y por período» **es** exactamente medible: `coupons.user_id`
más `created_at`, con índice en `0002_security.sql:177`. Y es, además, la unidad
que el propio sitio ya vende: «3 cupones por mes» (`app/precios/page.tsx:21`),
«50 cupones por mes» (`:36`), «Cupones ilimitados» (`:53`). El brief busca una
unidad nueva cuando ya hay una publicada.

**H4 — §1 llama «siete promesas» a un inventario incompleto, y una fila está
invertida.** `[HV]`
- La promesa de IA está publicada en **al menos nueve lugares más**, incluidos
  los metadatos del layout que indexa Google (`app/layout.tsx:14,17`), el propio
  documento contractual (`app/condiciones/page.tsx:44`) y el encabezado de la
  página de precios (`app/precios/page.tsx:98`).
- La fila de la marca de agua está invertida. `app/api/coupon-image/route.tsx:184`
  emite «Creado con EcoCupon.cl» **incondicionalmente**, sin mirar el plan. Lo
  falso no es la marca de agua del plan gratis: es el **«Sin marca de agua» del
  Pro** (`app/page.tsx:257`), que no se cumple nunca.
- Faltan las dos promesas más falsables: «Únete a cientos de negocios que ya usan
  EcoCupon» (`app/page.tsx:288`), contra 5 perfiles en la base; y «Los cambios se
  aplican inmediatamente» (`app/precios/page.tsx:160`), imposible porque nada lee
  `plan_type`.
- Falta «Logo y branding custom» (`app/precios/page.tsx:59`), que el código no
  distingue de subir un logo.
- El buscador de la cuponera es inerte: `Input` y `Button` sin `onChange`, sin
  `onSubmit` y sin estado (`app/cuponera/page.tsx:74-81`), mientras la metadata
  de esa misma página promete «Filtra por negocio» (`:13`).

**Consecuencia:** la instrucción de la decisión 3 —quitar «las siete features
inexistentes»— **no cierra la exposición que el brief denuncia**.

**H5 — §4 niega una clave de unión que existe.** `[HV]`
El brief dice que «el pago no deja ninguna clave que lo una con la fila del
comercio». `profiles.email` existe (`0001_init.sql:39`) y `handle_new_user` lo
puebla desde `new.email`. Lo que falta es un identificador determinista y
automático, no toda clave. Importa porque la decisión 3 depende de esa
reconciliación, y el propio brief la describe «por correo o monto» dos párrafos
más abajo.

**H6 — La verificación del logo sí es de firma de bytes, y el brief no la
aprovecha.** `[HV]`
`app/api/upload-logo/route.ts:13-43` valida por firma de bytes (excluye SVG),
con límite de 5 MB (`:9`) y 413/415 correctos. Es una capacidad real que responde
la pregunta 4 del propietario y que el brief no enumera.

**H7 — Citas sin referencia, en un documento que se juzga por citarlas.** `[HV]`
«Códigos únicos, rastreables» (`:70-71`) fusiona dos cadenas distintas de
`app/page.tsx:186` sin citar archivo: es la única cita sin referencia del
documento. El rango de la portada se cita como `:227-261` cuando las cadenas que
sostienen la contradicción están en `:223` y `:265`.

**H8 — Dos exageraciones técnicas.** `[HV]`
- **H8.1** — §6 llama «protección SSRF correcta» a la allowlist de
  `app/api/coupon-image/route.tsx:19-21`. La allowlist acepta **cualquier**
  subdominio de `supabase.co` (`u.hostname.endsWith("." + h)`), no solo el host
  del proyecto. La protección existe; la calificación la sobreestima.
- **H8.2** — §7 llama `console.error` a lo que `lib/supabase/admin.ts:32` emite
  como **`console.warn`** desde `warnIfNoServiceRole`. El archivo existe
  precisamente para hacer ruidoso el fallback. Lo silencioso es el 404 que ve el
  usuario final, no el aviso al operador.

## Afirmaciones del brief que este lente confirmó

Verificadas una por una, todas verdaderas:

| Afirmación del brief | Verificación |
|---|---|
| `coupon_code` se genera aleatorio pero **no es único global** | Confirmado en `app/dashboard/crear/page.tsx` y `0001_init.sql` |
| No existe ningún concepto de canje en el esquema ni en el código | Confirmado (salvo la coincidencia léxica de H2) |
| `expires_at` existe pero no se usa en ninguna consulta de validez | Confirmado |
| `upload-logo` valida la **sesión**, no el plan | Confirmado (`:55-62`) |
| La marca de agua no depende del plan | Confirmado (`route.tsx:184`) |
| El enlace de checkout de Reveniu es **idéntico** entre portada y precios | Confirmado |
| No hay ninguna dependencia de IA en el proyecto | Confirmado: cero llamadas a proveedores de modelo |
| Los límites de cupones por plan no se aplican en ningún punto | Confirmado |
| No hay multiusuario | Confirmado |
| No hay canal de SLA ni de soporte en el producto | Confirmado |
| `views` y `shares` son escribibles sin sesión vía los grants de `anon` | Confirmado en `0002_security.sql` |
| `0010:103-104` admite que los contadores son inflables | Confirmado |
| `0007` es idempotente por transacción | Confirmado: `begin;`/`commit;` |

## Punto de método

**El brief redactó su propia garantía de verificación** («cada afirmación se
verificó una por una contra archivo y línea», `:356-358`) **y no la cumplió**:
H1, H2, H4, H7 y H8 son exactamente afirmaciones sobre archivos y líneas, y son
falsas o incompletas. La conclusión de fondo del lente es que **el brief merece
confianza en sus citas centrales y no en sus conteos ni en sus calificaciones**.

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar?** No. El propio sitio ya vende
   cupones por mes.
2. **¿Madurez técnica confundida con potencial comercial?** Sí: el brief lee la
   ausencia de una feature como ausencia de mercado.
3. **¿Modelos sin canjes?** Cualquiera cuyo contador ya exista: cupones,
   publicaciones, Storage.
4. **¿Valor concreto desde el día uno?** La lista verificada de H6 y del bloque
   anterior. **Esta es la respuesta más completa de los siete lentes a esa
   pregunta.**
5. **¿Suscripción como modelo principal?** El brief no aporta el dato que
   permitiría decidirlo.
6. **¿Alternativas?** Las cuatro formas de precio, independientes del canje.
7. **¿Reveniu y Mercado Pago compiten?** No verificable desde el repositorio: no
   hay documentación de ninguno de los dos.
8. **¿SmarterBOT?** Fuera del repositorio; no verificable.
9. **¿Riesgo de automatizaciones en precio fijo?** No cuantificable con la
   información disponible.
10. **¿Empezar sin prometer lo inexistente?** Retirar las promesas reales, que son
    más de siete (H4), y vender lo que ya funciona.

## Advertencia del lente sobre la evidencia de la base

Los datos de la base —**4 cupones, 5 perfiles, 0 con `plan_type` distinto de
`free`**— son ciertos, pero **el brief los usa como evidencia de demanda y no lo
son**: prueban que hay cinco filas creadas, no que haya cinco interesados.
`[OR]`
