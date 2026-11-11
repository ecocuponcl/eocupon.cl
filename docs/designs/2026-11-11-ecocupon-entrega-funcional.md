# EcoCupon.cl — Entrega funcional

- **Autor:** eocupon
- **Fecha:** 2026-11-11
- **Alcance:** producto y experiencia. Sin precios, planes, cobros ni pasarelas.
- **Estado:** cambios aplicados y verificados en local. **No desplegados.**

---

## 1. Qué mejoré en el diseño

- **Buscador de la cuponera real.** Antes era un `Input` con placeholder y un
  `Button` sin manejador: un control público que no hacía nada. Ahora filtra por
  negocio, título o código, tiene botón de limpiar, anuncia el resultado a lectores
  de pantalla (`aria-live`) y un estado vacío distinto según si hay búsqueda o no.
- **Estado vacío útil.** Cuando la búsqueda no encuentra nada ofrece «Ver todos los
  cupones»; cuando no hay cupones ofrece «Crear mi cupón».
- **Objetivos táctiles de 44 px.** Los cuatro botones de compartir y el de descarga
  cumplen el mínimo; el botón de registro también pasó de 36 a 44 px.
- **Registro con jerarquía correcta.** Ahora tiene `<h1>` real («Crea tu cuenta»),
  donde antes el título era un componente sin nivel de encabezado.
- **Consentimiento visible en el registro.** Texto explícito con enlaces a
  `/condiciones` y `/privacidad` junto al botón de crear cuenta.
- **Año dinámico en el pie** de la cuponera, en lugar de «2024» fijo.

## 2. Qué funcionalidades quedaron operativas

| Función | Antes | Ahora |
|---|---|---|
| Buscar en la cuponera | No hacía nada | Filtra en vivo por negocio, título o código |
| Enviar el cupón por WhatsApp | Abría WhatsApp con texto y enlace | Intenta compartir **la imagen adjunta** vía Web Share; si el navegador no puede, cae al enlace |
| Descargar la imagen del cupón | Solo existía dentro del dashboard | Botón «Descargar imagen» en la página pública |
| Compartir nativo | Solo enlace | Comparte la imagen como archivo cuando el dispositivo lo permite |
| Metadatos del cupón | Título genérico del sitio | «20% de descuento en {negocio}» + descripción + Open Graph |

**Cómo funciona el envío de imagen:** se descarga el PNG desde
`/api/coupon-image`, se envuelve en un `File` y se pasa a
`navigator.share({ files })` si `navigator.canShare({ files })` lo permite. En
escritorio, donde esa API no existe, el botón sigue funcionando por el enlace.

## 3. Qué errores corregí

- **Fallo de hidratación de React en la página del cupón (#418).** Causa exacta:
  el botón «Compartir» se renderizaba según `typeof navigator !== "undefined"`.
  El servidor no tiene `navigator`, así que no pintaba el botón y el cliente sí.
  Ahora la capacidad se decide en un `useEffect` posterior al montaje.
  **Verificado: de 1 error en consola a 0.**
- **`useRouter` importado y nunca usado** en el registro (código muerto).
- **`CardTitle` usado como título de página**, sin `<h1>` en el registro.
- **Texto «con IA»** retirado del registro y de la llamada final de la cuponera:
  no existe ninguna integración de IA, así que la promesa era falsa.

## 4. Pruebas ejecutadas y resultados

| Prueba | Resultado |
|---|---|
| `pnpm lint` | **0 errores**, 5 avisos preexistentes (`<img>` en `coupon-image`) |
| `pnpm build` | **21 rutas compilan** sin error |
| Buscador: 1 cupón inicial | 1 tarjeta |
| Buscar «zzzz» | **0 tarjetas**, estado vacío |
| Buscar «maquina» | **1 tarjeta** |
| Accesibilidad del buscador | `aria-label` y `name="q"` presentes; `aria-live` anuncia «1 cupones encontrados para maquina» |
| Página del cupón: título | «20% de descuento en www.tienda.co · EcoCupon» |
| Página del cupón: botones | WhatsApp 44px, Copiar link 44px, Compartir 44px, Descargar imagen 44px |
| Página del cupón: consola | **0 errores** (antes 1 de hidratación) |
| Registro: encabezado | `<h1>` = «Crea tu cuenta» |
| Registro: campos | 3 campos con `id`, `name`, `autocomplete` y etiqueta asociada |
| Registro: legales | Enlaces a `/condiciones` y `/privacidad` presentes |
| Móvil 390 px | Sin desbordamiento horizontal (`scrollWidth` = 390) |

## 5. Qué queda pendiente y por qué

**Bloqueante, y no depende de mí:**
- **Desplegar.** Producción va por detrás de `main`; los defectos que medí allí
  (registro sin etiquetas, desbordes, título repetido, error #418) **ya están
  corregidos en el repositorio** y no se ven porque nadie ha publicado. Publicar
  toca `main`, que despliega solo: es tu decisión.

**No probado por falta de credenciales, no por falta de trabajo:**
- Inicio de sesión con Google, alta de cuenta y confirmación por correo.
- Subida de logo y creación de cupón de punta a punta.
- Dashboard (`/dashboard`, `/dashboard/crear`, `/dashboard/mis-cupones`).
- Envío real de la imagen por WhatsApp en un teléfono: verifiqué el código y el
  soporte de la API en el navegador, **no** recibí el mensaje.
  No lo declaro terminado.

**Fuera de alcance por decisión tuya:**
- Precios, planes, cupo y pasarela.
- Las promesas falsas de `/precios`, `/condiciones` y la portada (IA, «cientos de
  negocios», «Sin marca de agua», API, multiusuario, 24/7).
- La marca de agua depende del estado de plan, que a su vez depende del cobro.

**Pendiente de diseño, no tocado:**
- La portada sigue mostrando una maqueta de navegador en el hero en lugar de un
  cupón real, y mantiene el sello «Potenciado por Inteligencia Artificial».

## 6. Evidencias

- Captura móvil (390 px) de la página del cupón con los cuatro botones y el nuevo
  de descarga: `docs/designs/evidencia/evidencia-cupon-movil.png`
- Mediciones de DOM citadas en la tabla de §4, tomadas contra `localhost:3000`.
- `pnpm build`: las 21 rutas compilan; `/cupon/[id]`, `/cuponera` y `/dashboard`
  siguen siendo dinámicas.

## Archivos modificados

- `components/coupon-share-buttons.tsx` — compartir imagen, descargar, 44 px,
  corrección de hidratación.
- `components/cuponera-grid.tsx` — **nuevo**: buscador funcional y resultados.
- `app/cuponera/page.tsx` — usa el buscador nuevo, quita la promesa de IA, año
  dinámico.
- `app/cupon/[id]/page.tsx` — metadatos por cupón, `alt` descriptivo, pasa la
  imagen al componente de compartir.
- `app/auth/registro/page.tsx` — `<h1>`, enlaces legales, botón de 44 px, limpia
  código muerto.

No se hizo commit ni push. No se instalaron dependencias.

---

## Ronda 2 — portada y honestidad del contenido

### Qué cambió en el diseño

- **La portada ya no muestra una maqueta de navegador.** Donde había tres
  círculos, barras grises y un código inventado (`VERANO50`), ahora hay **un cupón
  real**: negocio («Panadería Los Aromos»), descuento de 20%, código `AROMOS20`,
  bloque de QR, y las dos acciones con las que el comercio lo usa: WhatsApp e
  Imagen. El primer pantallazo muestra el producto, no su interfaz.
- **Titular nuevo:** «Tu oferta lista para compartir», en lugar de «Crea cupones
  de descuento irresistibles». Nombra el trabajo, no el adjetivo.
- **Sello del hero honesto:** «Imagen, enlace y código QR en un solo paso», en
  lugar de «Potenciado por Inteligencia Artificial».
- **Pie de portada con enlaces vivos:** «Contacto» apuntaba a `#`; ahora apunta a
  la cuponera. Año dinámico en lugar de «2024».

### Qué promesas falsas se retiraron

| Archivo | Antes | Ahora |
|---|---|---|
| `app/page.tsx` | «Generación con IA» + «imágenes creadas con inteligencia artificial» | «Imagen lista para usar», con PNG, código y QR |
| `app/page.tsx` | «la IA hace el resto» | «tú defines la oferta, el cupón se arma solo» |
| `app/page.tsx` | «5 cupones por mes» en Gratis | «3 cupones por mes», igual que `/precios` |
| `app/page.tsx` | «Cupones ilimitados» en Pro | «50 cupones por mes» |
| `app/page.tsx` | «Sin marca de agua» (no se cumple nunca) | «Logo de tu negocio» |
| `app/page.tsx` | «Analíticas de uso» | «Vistas y compartidos» |
| `app/page.tsx` | «Únete a cientos de negocios» (hay 5 cuentas) | Beneficio concreto, sin cifra inventada |
| `app/precios/page.tsx` | «Generacion basica/avanzada con IA», «IA premium» | Descriptor real de cada plan |
| `app/precios/page.tsx` | «API de integración», «Dashboard multiusuario», «24/7», «branding custom» | «Atención por WhatsApp», «Acompañamiento personalizado», «Soporte dedicado» |
| `app/precios/page.tsx` | «Todos incluyen generacion de cupones con IA» | «Todos incluyen cupones con imagen, código y QR» |
| `app/layout.tsx` | Título y descripción por defecto «con IA» | Descripción de lo que el producto hace |
| `app/condiciones/page.tsx` | «generar cupones… con inteligencia artificial» | «cupones con su código y su imagen QR» |

### Pruebas de esta ronda

| Prueba | Resultado |
|---|---|
| `pnpm lint` | **0 errores**, 5 avisos preexistentes |
| `pnpm build` | **21 rutas compilan** |
| Portada móvil 390 px | Sin desbordamiento (`scrollWidth` = 390) |
| Portada: cupón real | `AROMOS20` presente en el DOM |
| Portada: IA / «cientos» / «Sin marca de agua» / 2024 | **ninguno presente** |
| Página del cupón tras el cambio | **0 errores** en consola |
| Corrección de lint | `setState` en efecto → `useSyncExternalStore` |

### Evidencias

- `docs/designs/evidencia/evidencia-home-movil.png` — portada en 390 px
- `docs/designs/evidencia/evidencia-cupon-movil.png` — cupón con compartir y descarga

### Archivos modificados en esta ronda

- `app/page.tsx` — hero, cupón real, beneficios, planes y pie.
- `app/precios/page.tsx` — features veraces en los tres planes.
- `app/layout.tsx` — metadatos por defecto sin IA.
- `app/condiciones/page.tsx` — descripción del servicio sin IA.
- `components/coupon-share-buttons.tsx` — detección de capacidad con
  `useSyncExternalStore`.

---

## Ronda 3 — marca real, enlace en las dos rutas, y seguridad de la base

### 3.1 El cupón de ejemplo es de un comercio real

La portada mostraba un cupón inventado («Panadería Los Aromos», `AROMOS20`). Ahora
muestra uno real de **4Time Repuestos**: su logo, una foto de producto, **10% de
descuento en tu primera compra**, código **HOLA4TIME**, bloque QR y las dos
acciones de uso.

Los dos assets se bajaron de la tienda del propio propietario y se optimizaron
antes de publicarlos: el logo pasó de **2,4 MB a 132 KB** (384×384 manteniendo el
canal alfa) y la foto de producto a 50 KB (800×800). Viven en `public/marca/`.

### 3.2 El enlace viaja en las dos rutas de compartir

Defecto encontrado en lo ya publicado: **la ruta con imagen no llevaba el enlace**
y la ruta con enlace no llevaba imagen. Resultado: en móvil el receptor veía el
cupón y tenía que pedir la dirección.

Ahora `shareTextWithLink` se usa en las tres salidas: Web Share con archivos, el
`wa.me/?text=` de escritorio y el compartir nativo. El receptor recibe la imagen
**y** el enlace.

### 3.3 Seguridad de la base

Ver §3 y §5 de `2026-11-11-ecocupon-revision-base-datos.md`. En resumen: la
lectura de cupones privados por `anon` pasó de **3 cupones expuestos a 0**, con el
enlace privado verificado en 200 y sin romper la cuponera.

### Pruebas de esta ronda

| Prueba | Resultado |
|---|---|
| `pnpm lint` / `pnpm build` | 0 errores / 21 rutas |
| Portada con la marca real | `HOLA4TIME` y `4Time Repuestos` presentes en producción |
| Assets servidos | `/marca/4time-logo.png` → HTTP 200 |
| Lectura como `anon` | 1 cupón visible, 0 privados |
| Enlace privado tras la migración | HTTP 200, renderiza, muestra el código |
| UUID inexistente | HTTP 404 |
| Cuponera | HTTP 200 |