# EcoCupon.cl — Resumen ejecutivo

- **Autor:** eocupon
- **Fecha:** 2026-11-11
- **Alcance:** EcoCupon.cl únicamente. Cobro, suscripción y pagos quedan **en suspenso**.
- **Base:** `2026-11-11-ecocupon-evaluacion-integral.md` + revisión de interfaz +
  medición en producción. Sin investigaciones nuevas.
- **Estado de agentes:** 1 ejecutado (revisión de interfaz), 2 fallidos por cuota
  (429 / 402). No se reintentaron.

---

## 1. Los cinco problemas más importantes

**1. El sitio promete lo que no entrega, y una parte está en los términos y
condiciones.** `[HV]`
Ocho promesas sin producto detrás: generación con IA, «Sin marca de agua» en Pro,
límites de cupones que no se aplican, «cientos de negocios» con 5 cuentas, y en
Business: API, multiusuario, soporte 24/7 y branding custom. Cinco de ellas están
también en `/condiciones`, que es un documento contractual. Es el problema que más
crece con el tiempo: hoy cuesta una edición de texto, después de la primera venta
cuesta un reembolso.

**2. El registro pide datos personales sin explicar nada y sin ser accesible.**
`[HV]`
`/auth/registro`: tres campos (`text`, `email`, `password`) **sin `id`, sin `name`,
sin `autocomplete`, sin `aria-label` y sin etiqueta asociada**. Solo `placeholder`.
No hay `<h1>`. No hay enlaces a `/privacidad` ni a `/condiciones` junto al botón.
Es la puerta de entrada del producto y falla por usabilidad, por accesibilidad y
por cumplimiento de la Ley 19.628.

**3. La promesa central del cupón no se cumple: se comparte un enlace, no la
imagen.** `[HV]`
`components/coupon-share-buttons.tsx:35` abre `wa.me/?text=…`, que lleva texto y
URL. `navigator.share` (`:49-53`) recibe `title`, `text` y `url`, nunca `files`. En
todo el repositorio no existe una sola llamada que comparta el PNG. Y la descarga
vive **solo dentro del dashboard** (`app/dashboard/crear/page.tsx:213`,
`components/coupon-card.tsx:112`): la página pública del cupón no tiene botón de
descarga. El comerciante descarga en un lugar y adjunta en otro.

**4. La vitrina pública está vacía y tiene fallos visibles.** `[HV]`
La cuponera muestra **1 cupón**, que es de prueba («www.tienda.co», «maquina»,
`ERP50%`). Su buscador tiene placeholder pero **no tiene `name`, ni `id`, ni
etiqueta, ni manejador de evento**. La página pública del cupón lanza **React error
#418** (fallo de hidratación) en producción. Todas las páginas comparten el mismo
`<title>`. En móvil, la portada desborda a **417 px** en una pantalla de 390 px y
la cuponera a **405 px**.

**5. No hay ninguna señal de empresa ni de uso que permita confiar.** `[HV]`
Único contacto publicado: un Gmail. Sin teléfono, sin razón social, sin RUT.
Copyright «2024» en tres archivos. El plan de pago salta a un dominio de terceros
en el momento de decidir. Cero ventas con cinco cuentas. Un comercio que compara
esto con su proveedor actual no encuentra un motivo para cambiar.

---

## 2. Propuesta comercial recomendada

**Forma:** acceso con cupo mensual. La unidad ya existe y es exacta
(`coupons.user_id` + `created_at`); no requiere medir canjes ni atribuir ventas.
`[OR]`

### Gratis

| | |
|---|---|
| **Para quién** | Comercio que quiere publicar su primera promoción |
| **Cupo** | **3 cupones por mes** (unifica la contradicción 3 vs 5) |
| **Incluye** | Imagen con QR, enlace público, compartir, marca de agua |
| **No incluye** | Publicación en cuponera, estadísticas |
| **Motivo de upgrade** | Pasar el cupo y quitar la marca de agua |

### Pro

| | |
|---|---|
| **Para quién** | Comercio que publica promociones todas las semanas |
| **Cupo** | **50 cupones por mes** |
| **Incluye** | Sin marca de agua, estadísticas de vistas y compartidos, publicación en cuponera |
| **Precio propuesto** | **$4.990/mes** `[HC]` — no $9.990 |
| **Por qué más barato** | A $9.990 el único beneficio tangible es quitar una marca de agua que ninguna pantalla quita. El precio actual no tiene producto que lo sostenga |

**Business:** fuera de foco. Su precio de $29.990 compra cuatro funciones que no
existen. Mientras no haya cobro, no debería aparecer con ese contenido en el sitio.

**Condición previa, no negociable:** hoy **ningún código lee `plan_type`**. Sin un
estado de plan escrito por el servidor, Pro no puede existir: ni el cupo, ni la
marca de agua, ni las estadísticas dependen de nada. **No se puede vender Pro antes
de que ese estado exista.** `[HV]`

---

## 3. Qué valor justificaría una suscripción mensual

Una suscripción se paga por algo que **se renueva solo**. Hoy el producto entrega un
artefacto puntual: una imagen y un enlace. Eso se compra una vez, no cada mes.

Lo que sí justifica pago recurrente, en orden de fuerza: `[HC]`

1. **Que las promociones anteriores sigan vivas y accesibles.** Historial de cupones
   publicados, siempre disponibles para reenviar. Es el valor más honesto y el más
   barato de construir: los datos ya están.
2. **Que el cupo se renueve.** Publicar cada semana sin toparse con un límite.
3. **Saber qué pasó.** Vistas y compartidos por cupón, comparables en el tiempo.
   Hoy existen los contadores pero no se presentan como valor.
4. **No llevar la marca de otro.** Quitar la marca de agua, solo si se implementa de
   verdad.
5. **Aparecer en la cuponera.** Hoy no vale nada: tiene un cupón de prueba y un
   buscador que no busca. Solo vale si hay audiencia.

Lo que **no** justifica una suscripción: «generar una imagen». Eso es una tarea, no
un servicio. `[OR]`

---

## 4. Las cinco decisiones

1. **¿Se retira la IA del sitio o se construye?** Está publicada en portada,
   precios, metadatos y términos. No se puede dejar como está mientras se vuelve
   «funcional». `[DP]`
2. **¿Se envía la imagen por WhatsApp o se acepta el enlace?** Enviar el PNG exige
   Web Share con `files` o descarga más adjunto manual. Aceptar el enlace es más
   barato y más medible, pero es otro producto del que dijiste que querías. `[DP]`
3. **¿El cupo gratis es 3 o 5, y se aplica en código?** Hoy conviven las dos cifras
   y ninguna se cumple. `[DP]`
4. **¿Se retira la cuponera o se construye?** Con 1 cupón de prueba y buscador
   inerte, es una promesa de valor negativa. `[DP]`
5. **¿Se quitan los precios del sitio mientras no hay cobro?** Publicar $9.990 y
   $29.990 sin pasarela que registre el pago es la contradicción más cara de
   defender. `[DP]`

---

## 5. Qué información falta realmente

Solo tres cosas, y ninguna requiere más auditoría:

1. **Si alguna vez le ofreciste EcoCupon a un comercio concreto.** Sigue sin
   respuesta y es la que más cambia las conclusiones: si nunca se ofreció, las cero
   ventas no dicen nada del producto; si se ofreció y falló, las razones son el dato
   más valioso que existe. `[DP]`
2. **Las tarifas reales de la pasarela.** Necesarias para fijar el precio del Pro
   con margen. No verificadas. `[DP]`
3. **Quiénes son las cinco cuentas.** Si son pruebas tuyas, entonces ninguna persona
   ajena ha usado el producto y no hay ninguna señal de demanda. `[DP]`

Todo lo demás es decidible con lo que ya está en este resumen.

---

## Límites

- No se modificó el proyecto: ni código, ni contenido, ni base, ni configuración.
  No hubo commit ni deploy.
- No se ejecutaron investigaciones, instalaciones ni agentes nuevos.
- No se repitieron las pruebas de Playwright: las cifras citadas son las ya medidas.
- Los dos agentes que fallaron por cuota (429 / 402) no se reintentaron; sus
  resultados no existen y no se suplen con suposiciones.