# Pruebas de la integración con Flow (sandbox)

Registro de lo que se probó el 2026-11-28 contra `sandbox.flow.cl`, con qué
resultado, qué se corrigió y qué límites externos quedan. Sirve para repetir la
prueba o para retomarla cuando haya credenciales nuevas.

## Entorno usado

- App local (`pnpm dev`) con `FLOW_ENV=sandbox`, las llaves de sandbox y
  `NEXT_PUBLIC_SITE_URL` apuntando a un túnel de `cloudflared`.
- El servidor se levantó con `TZ=UTC` para reproducir Vercel, que corre en UTC.
- `SUPABASE_SERVICE_ROLE_KEY` se inyectó por entorno (en `.env.local` está vacía).
- El plan de sandbox debe apuntar su `urlCallback` al túnel; si apunta a
  producción, el aviso se pierde y además producción respondería con las llaves
  equivocadas.

## Casos probados

| Caso | Resultado |
| --- | --- |
| `plans/create` de un plan nuevo | OK, con `urlCallback` y `days_until_due` |
| `customer/create` | OK, pero Flow valida el correo (ver limitaciones) |
| `customer/register` + inscripción de tarjeta en Webpay | OK; el cliente queda `pay_mode: auto`, Visa ****6623 |
| `subscription/create` | OK; **el primer importe se cobra al instante** |
| Aviso de Flow al crear la suscripción | Llega a `/api/flow/callback` y responde 200 |
| Registrar el pago en `flow_payments` | OK, con `flow_order` como llave |
| `plan_ends_at` tras el primer cobro | Igual al `period_end` de Flow, sin sumar un periodo aparte |
| Cobros posteriores (renovaciones) | Tres avisos seguidos sobre la misma suscripción; `plan_ends_at` no se infló |
| Avance de periodo (plan semanal) | `plan_ends_at` pasó a 2026-12-04, el fin real de la semana |
| Resolución del perfil sin usar el correo | OK, vía `commerceOrder` |
| Fechas bajo `TZ=UTC` | Se interpretan como hora de Chile (03:00Z en verano, 04:00Z en invierno) |

Evidencia en la base (usuario de prueba `ecocupon.flowtest@gmail.com`): pagos
`11980198`–`11980202`, todos por 80.000 CLP y estado 2.

## Correcciones aplicadas

1. **Retorno del registro con 303.** `/api/flow/registro` respondía 307 y el
   navegador reenviaba el POST de Flow a `/dashboard/cuenta`, que solo acepta
   GET: el comercio terminaba en un `HTTP 405` de verdad, comprobado en el
   navegador y con `curl`.
2. **`plan_ends_at` sale del periodo de Flow.** Antes, el registro sumaba un mes
   o un año y cada cobro volvía a sumar: el primero dejaba dos periodos por un
   pago y el desfase se arrastraba. Ahora el registro usa `period_end` y el
   callback consulta `subscription/get`. Ambos escriben el mismo valor.
3. **Suscripción por `commerceOrder`.** `payment/getStatus` no trae
   `subscriptionId` (la especificación tampoco lo incluye, y en la práctica llega
   `None`). Los cobros de plan traen `commerceOrder` como
   `sus_xxx_<factura>_<fecha>`, que sí permite resolver el perfil sin depender
   del correo del pagador.
4. **Fechas de Flow interpretadas como hora de Chile.** `new Date("...")` sobre
   `yyyy-mm-dd hh:mm:ss` depende del reloj del servidor: en Vercel quedaba 3
   horas antes. Ahora `flowDate()` convierte explícitamente desde
   `America/Santiago`, con horario de verano incluido.
5. **Suscripción sin periodo.** Si Flow devuelve una suscripción sin
   `period_end` (por ejemplo agendada a futuro), el callback ignora el aviso en
   vez de responder 500 y provocar reintentos.
6. **Firma en el formato del SDK oficial.** Flow acepta tanto `clavevalor` como
   `clave=valor&` (probado con la secret correcta; con una secret falsa responde
   `108 Invalid Signature`). Se dejó la forma documentada.
7. **Pro solo con la primera factura pagada.** Antes, `registro` escribía
   `plan_type='pro'` y `plan_ends_at` mirando solo `period_end`; una tarjeta
   rechazada dejaba un periodo gratis. Se comprobó que `subscription/create`
   puede responder 200 con `invoices: []` (sin cobro). Ahora, si la primera
   factura no está pagada, se guarda la suscripción y se vuelve con
   `estado=pendiente`; el callback concede el acceso cuando Flow cobre.
8. **Volver a suscribirse.** `registro` solo creaba suscripción si
   `flow_subscription_id` estaba vacío, así que tras cancelar el comercio no
   podía volver a contratar. Ahora, si la suscripción guardada está cancelada o
   terminada, se crea una nueva; si sigue viva, no se duplica.
9. **El monto se valida contra la suscripción, no contra el precio actual.** Se
   acepta el cobro si coincide con una factura de la suscripción o con un plan
   configurado. Un cambio de `FLOW_PRICE_*` ya no invalida los cobros de planes
   creados antes, y los cargos sueltos (verificación de tarjeta) se siguen
   ignorando.
10. **Timeout en las llamadas a Flow.** `flowCall` corta a los 15 s.
11. **Rechazos con rastro.** Un cobro rechazado o anulado deja un `warn` con
    `flowOrder` y estado en los logs; el periodo no se extiende.

## Pruebas de las correcciones (2026-11-28)

| Caso | Resultado |
| --- | --- |
| Alta normal | Suscripción creada, cobrada, `estado=activo`, Pro hasta el `period_end` |
| Comercio ya suscrito vuelve a inscribir tarjeta | `estado=activo`, **sin** segunda suscripción |
| Cancelar y volver a contratar | Suscripción nueva, la anterior queda en estado 4, perfil apunta a la nueva |
| Suscripción sin factura pagada | `estado=pendiente`, `plan_type` sigue en `free` y `plan_ends_at` en `null` |
| Aviso duplicado con el mismo `token` | `{duplicated:true}`, una sola fila y la fecha no se movió |

## Limitaciones externas

- **Sandbox exige cuenta aparte.** Las credenciales de prueba salen de registrar
  una cuenta en `sandbox.flow.cl`; no sirven las de producción.
- **Flow valida el correo del cliente en `customer/create`.** Aceptó
  `prueba@gmail.com`, `flowtest@gmail.com` y `abc123@gmail.com`, y rechazó
  `prueba2@gmail.com`, `ecocupon.flowtest@gmail.com`, `juanperez@gmail.com` y
  `zqmxvbn@gmail.com` con "email is not valid". No se pudo deducir la regla; en
  producción conviene confirmar con Flow qué pasa con correos válidos que su
  validador no reconozca, porque hoy el comercio no podría suscribirse.
- **`plans/edit` no permite cambiar `days_until_due` si el plan ya tiene
  suscriptores**, y un `planId` borrado no se puede volver a crear ("has already
  been used"). En sandbox quedó quemado `ecocupon-pro-mensual`; producción no se
  tocó.
- **El primer importe se cobra al crear la suscripción**, no a los
  `days_until_due`. El estado 1 de una factura significa **pagada** (0 impaga,
  2 anulada).
- **No hay endpoint para adelantar una renovación.** `subscription/changePlan`
  genera una factura de monto 0 (prorrateo), así que no sirve como cobro. La
  renovación se simuló con suscripciones con `subscription_start` en el pasado
  (Flow genera las facturas faltantes) más `invoice/retryToCollect`.
- **Los avisos llegan con demora** (entre uno y dos minutos), también los
  disparados por `invoice/retryToCollect`.
- **No se puede reenviar un aviso.** No hay forma de obtener el `token` de un
  cobro ya notificado, así que la idempotencia (`flow_payments.flow_order` como
  llave primaria) está revisada en el código pero no se ejercitó con un aviso
  duplicado real.

## Pendiente

- Probar con las llaves de producción cuando haya un cobro real (no se pueden
  leer: están marcadas *Sensitive* en Vercel).
- Cancelación de la suscripción: `subscription/cancel` existe en la API, pero la
  app no la usa; hoy la cancelación se gestiona por WhatsApp.
- Aplicar `0017_program_leads` (sin relación con Flow).
- Limpiar el usuario de prueba y sus pagos si ya no sirven.

## Reproducir

```bash
# túnel
cloudflared tunnel --url http://localhost:3000 --no-autoupdate

# app apuntando a sandbox, con el reloj de Vercel
TZ=UTC FLOW_ENV=sandbox \
  FLOW_API_KEY=... FLOW_SECRET_KEY=... \
  NEXT_PUBLIC_SITE_URL=https://<tunel>.trycloudflare.com \
  SUPABASE_SERVICE_ROLE_KEY=... pnpm dev
```

Antes de suscribir, el plan de sandbox debe tener `urlCallback` apuntando al
túnel (`plans/edit`), y el perfil debe tener `flow_customer_id` del cliente
creado en sandbox.