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

### 3.1 La exposición de cupones privados sigue viva. `[HV]`

```
coupons_select_own_or_public  ·  SELECT  ·  using = true
```

La política de lectura de `coupons` sigue en `true`. **Cualquiera con la clave
publicable —que viaja en el navegador de todo visitante— puede leer los 4 cupones,
incluidos los 3 que sus dueños marcaron como privados.** La migración `0010`, que
la acota, existe en el repositorio y **no está aplicada**.

No es teórico: hay 3 cupones privados hoy.

### 3.2 Cuatro funciones `SECURITY DEFINER` ejecutables sin sesión. `[HV]`

Aviso oficial de Supabase, sin resolver:

| Función | Riesgo |
|---|---|
| `user_exists(p_email text)` | **Enumeración de correos.** Cualquiera puede preguntar si una dirección está registrada |
| `handle_new_user()` | Es una función de trigger; no debería ser invocable por RPC |
| `increment_views(coupon_id)` | Por diseño es anónima, pero permite inflar el contador a voluntad |
| `increment_shares(coupon_id)` | Igual: el contador no es confiable como métrica |

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

## 5. Qué queda pendiente en la base

Nada de esto lo puedo hacer yo sin autorización explícita, porque escribe:

1. **Aplicar `0010`** para cerrar la lectura de cupones privados. Requiere antes
   reparar el historial de migraciones, como advierte `CLAUDE.md`.
2. **Revocar `EXECUTE`** de `user_exists` y `handle_new_user` para `anon`.
3. **Activar** la protección de contraseñas filtradas en el panel.
4. **Reescribir las 7 políticas** con `(select auth.uid())` cuando el volumen lo
   justifique.

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