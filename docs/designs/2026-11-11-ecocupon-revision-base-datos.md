# EcoCupon.cl — Qué se envía al compartir, y revisión de la base de datos

- **Autor:** eocupon
- **Fecha:** 2026-11-11
- **Método:** lectura directa de la base y de sus avisos oficiales, vía API de
  Supabase (MCP). Todo solo lectura; no se ejecutó ninguna escritura.
- **Alcance:** EcoCupon.cl.

---

## 1. Qué se envía exactamente al compartir

Depende del dispositivo, y hasta hoy las dos rutas enviaban cosas distintas.

### En móvil (Chrome o Safari con Web Share)

Se envía **la imagen adjunta**, más un texto con el código y **el enlace**:

> `10% de descuento en tu primera compra - 10% OFF con el código HOLA4TIME. Ver cupón: https://www.ecocupon.cl/cupon/…`

El receptor ve el PNG del cupón en el chat y, debajo, un enlace que puede abrir.

### En escritorio

Los navegadores de escritorio no exponen el envío de archivos, así que cae al
enlace de WhatsApp:

> `https://wa.me/?text=` con el mismo texto y el enlace.

Se envía **texto + enlace, sin imagen**. Para mandar la imagen hay que usar el
botón **«Descargar imagen»** y adjuntarla a mano.

### Lo que corregí recién

Antes la ruta con imagen **no llevaba el enlace**: quien recibía el cupón veía la
foto y tenía que pedir la dirección. Ahora el enlace viaja en las dos rutas. Es un
cambio de tres líneas en `components/coupon-share-buttons.tsx`.

Además, el enlace ahora sí muestra vista previa: al añadir metadatos por cupón
(`generateMetadata`), WhatsApp despliega «20% de descuento en {negocio}» en lugar
del título genérico del sitio.

**Resumen:** imagen **y** enlace en móvil; enlace solo en escritorio.

---

## 2. Estado real de la base

Verificado contra el proyecto `vwjdfyljacoxwabtfoco`. `[HV]`

| Dato | Valor |
|---|---|
| Usuarios en `auth.users` | **5** |
| Confirmados | **5 de 5** |
| Con identidad de Google | **2** |
| Con identidad de correo | 5 |
| Perfiles | 5 |
| Cupones | 4 |
| Cupones públicos | 1 |
| Planes pagados | **0** |
| Primera cuenta | 2026-07-10 |
| Última cuenta | 2026-11-09 |

**Dos hallazgos que cambian lo que sabíamos:**

1. **El login con Google sí ha funcionado.** Hay dos identidades de Google creadas.
   No es una función sin estrenar: alguien completó el ciclo OAuth de verdad.
2. **La última cuenta es del 2026-11-09**, dos días antes de esta revisión. Es
   decir, las cinco cuentas son recientes respecto de la vida del sitio (julio a
   noviembre) y ninguna ha pagado.

---

## 3. Seguridad: lo que está abierto hoy

### 3.1 La exposición de cupones privados — **CERRADA el 2026-11-11**. `[HV]`

```
ANTES:  coupons_select_own_or_public  ·  SELECT  ·  using = true
AHORA:  coupons_select_own_or_public  ·  SELECT  ·  using (is_public = true or auth.uid() = user_id)
```

Medido ejecutando como el propio rol `anon`, no inferido:

| | Cupones visibles | Públicos | Privados expuestos |
|---|---|---|---|
| Antes | 4 | 1 | **3** |
| Después | 1 | 1 | **0** |

La clave publicable viaja en el navegador de todo visitante, así que la exposición
era real: cualquiera podía listar los cupones que sus dueños marcaron como
privados.

**Precondición verificada antes de aplicar:** si `SUPABASE_SERVICE_ROLE_KEY` no
estuviera configurada, cerrar la política habría roto los enlaces privados. La
sonda `POST /api/upload-logo` sin sesión respondió **401** (no 500), lo que prueba
que la clave está presente. Después de aplicar:

- Enlace a un cupón privado: **HTTP 200**, renderiza, muestra su código.
- Cuponera pública: **HTTP 200**.
- UUID inexistente: **HTTP 404** — sin enumeración.

### 3.2 Cuatro funciones `SECURITY DEFINER` ejecutables sin sesión. `[HV]`

Aviso oficial de Supabase, sin resolver:

| Función | Riesgo | Estado |
|---|---|---|
| `handle_new_user()` | Es una función de trigger; no debería ser invocable por RPC | **Cerrada**: `EXECUTE` revocado a `public`, `anon` y `authenticated` en `0010` |
| `user_exists(p_email text)` | **Enumeración de correos.** Cualquiera puede preguntar si una dirección está registrada | **Abierta.** Cerrarla exige mover la comprobación a una ruta de servidor, porque el cliente la usa |
| `increment_views(coupon_id)` | Por diseño es anónima, pero permite inflar el contador a voluntad | Abierta a propósito |
| `increment_shares(coupon_id)` | Igual: el contador no es confiable como métrica | Abierta a propósito |

Las dos últimas son el precio de medir sin sesión. Las dos primeras no tienen
justificación.

### 3.3 Protección de contraseñas filtradas desactivada. `[HV]`

Supabase puede contrastar las contraseñas contra HaveIBeenPwned y está apagado. Se
activa desde el panel, no con SQL.

### 3.4 Lo que sí está bien

- RLS está **habilitado** en `coupons` y en `profiles`.
- `profiles` solo se lee por su dueño (`auth.uid() = id`).
- `coupons` insert/update/delete están acotados a `auth.uid() = user_id`.
- Los cupones privados no se pueden listar por el cliente normal; el enlace directo
  se resuelve con service role en `app/cupon/[id]`, donde el UUID actúa como
  capacidad.

---

## 4. Rendimiento

Avisos oficiales, ninguno urgente con este volumen:

- **7 políticas re-evalúan `auth.uid()` por fila.** Se corrige escribiendo
  `(select auth.uid())` en lugar de `auth.uid()`. Con 4 filas es irrelevante; con
  miles deja de serlo.
- **2 índices sin uso** (`coupons_user_id_idx`, `coupons_is_public_idx`). Es
  esperable con 4 filas: no hay nada que indexar. No se tocan.

Nota: el índice que **sí** importa para el modelo de cobro por cupo mensual —
`coupons.user_id` + `created_at`— ya existe y es exacto.

---

## 5. Qué se aplicó y qué queda

### Aplicado el 2026-11-11 con autorización del propietario

**Migración `0010_harden_rls_and_timestamps`**, el mismo archivo que ya estaba en
el repositorio. Contenido aplicado:

1. `coupons_select_own_or_public` acotada a `is_public = true or auth.uid() = user_id`.
2. Las cuatro políticas de `profiles` versionadas (ya existían en la base, sin
   migración que las respaldara).
3. `TRUNCATE` revocado a `anon` y `authenticated` en ambas tablas.
4. `EXECUTE` sobre `handle_new_user()` revocado.
5. Función `set_updated_at()` y triggers de `updated_at` en `coupons` y `profiles`.
6. `TRUNCATE` sobre `profiles` también revocado.

Efecto verificado: los cupones privados dejaron de ser legibles por `anon`, y el
enlace privado sigue funcionando.

### Pendiente

1. **Reparar el historial de migraciones.** Sigue desincronizado:
   `0003`, `0004`, `0007`, `0008` y `0009` están aplicadas en la base y no
   registradas. `0001`, `0002`, `0005`, `0006` y ahora `0010` sí lo están. Un
   `db push` vería las cinco ausentes como pendientes y reintentaría su DDL.
2. **`user_exists`** sigue abierta a `anon`. Cerrarla requiere cambiar código:
   mover la comprobación a una ruta de servidor y después revocar `EXECUTE`.
3. **Protección de contraseñas filtradas** desactivada. Se activa en el panel, no
   con SQL.
4. **7 políticas** re-evalúan `auth.uid()` por fila. Con 4 filas no importa; con
   miles sí.

---

## 6. Límites

- Todo lo anterior es lectura. No se ejecutó ninguna escritura, migración ni
  cambio de política.
- No se probó el login con Google de punta a punta: verifiqué que **existen dos
  identidades de Google**, no que el flujo funcione hoy.
- No se revisaron los registros de errores de las últimas 24 horas en detalle: el
  volumen es de 66 eventos de `pgbouncer`, 46 de `edge_logs`, 23 de
  `postgres_logs`, 21 de `postgrest_logs`, 14 de `auth_logs` y 3 de
  `auth_audit_logs`, sin señales de caída.