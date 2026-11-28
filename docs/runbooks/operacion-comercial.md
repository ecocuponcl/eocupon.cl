# Operación comercial de EcoCupón

Lo mínimo para vender, cobrar y atender, sin panel de administración propio.

## Primera contratación productiva

Requisitos: deploy al día, `FLOW_*` en Production y la decisión de IVA tomada (§
`precios-iva.md`). El plan de Flow se crea solo en la primera suscripción.

| Paso | Qué hacer | Qué verificar |
| --- | --- | --- |
| 1. Alta del comercio | Registro real en `/auth/registro` y confirmación de correo | Fila en `profiles`, correo confirmado |
| 2. RUT | Guardarlo en `/dashboard/cuenta` | `profiles.rut` con formato `12345678-9` |
| 3. Suscripción | Botón "Anual" o "Mensual" (abre Flow) | `POST /api/flow/subscribe` 200 con URL de Flow |
| 4. Tarjeta | Inscribir la tarjeta en el formulario de Flow | Cliente con `pay_mode: auto` en Flow |
| 5. Vuelta | Flow devuelve al comercio | `POST /api/flow/registro` responde **303** y cae en `/dashboard/cuenta?estado=activo` |
| 6. Cobro | Flow cobra el primer periodo al crear la suscripción | Pago por el monto del plan en el dashboard de Flow |
| 7. Aviso | Flow notifica el cobro | Log `POST /api/flow/callback 200` y fila nueva en `flow_payments` |
| 8. Plan | La app activa Pro | `profiles.plan_type = 'pro'`, `plan_ends_at` = fin del periodo |
| 9. Verificación | Abrir `/dashboard/cuenta` | Dice "Pro, hasta el …" con la fecha correcta |
| 10. Conciliación | Comparar `flow_payments` con Flow | Mismo `flow_order`, mismo monto |

Consultas útiles (service role, no ejecutar desde el navegador):

```sql
select id, email, plan_type, billing_period, plan_ends_at, flow_subscription_id
from profiles order by updated_at desc limit 5;

select flow_order, amount, status, commerce_order, paid_at
from flow_payments order by flow_order desc limit 5;
```

Si algo falla: el estado queda en `/dashboard/cuenta` (`pendiente` = Flow no
confirmó el cobro, `tarjeta` = no quedó inscrita, `error` = fallo técnico) y el
motivo exacto queda en los logs de Vercel con el prefijo `[flow]`.

## Operación mínima

| Necesidad | Cómo se resuelve hoy | ¿Indispensable para el piloto? |
| --- | --- | --- |
| Ver comercios | Supabase Studio → `profiles` | Sí |
| Ver y cancelar suscripciones | Dashboard de Flow (la app ya permite volver a suscribirse) | Sí |
| Ver pagos | `flow_payments` + movimientos de Flow | Sí |
| Conciliación | Comparar semanalmente `flow_payments` con las liquidaciones de Flow | Sí |
| Cobros rechazados | Revisar a diario los logs por `[flow] cobro no pagado` | Sí (manual) |
| Cupones y canjes | Panel del comercio en `/dashboard` | Ya operativo |
| Leads del programa | Supabase Studio del proyecto de leads → `program_leads` | Sí |
| Alertas automáticas de cobros | No implementadas | Mejora futura |
| Panel de administración | No existe; Studio cubre el piloto | Mejora futura |

Con esto el piloto se opera sin desarrollo adicional. Un panel propio solo se
justifica cuando haya volumen o varias personas atendiendo.

## Correo transaccional (Resend)

- **Qué envía hoy**: solo la confirmación al interesado del formulario de
  Recicla (`app/api/leads`). No hay otros correos propios.
- **Variables**: `RESEND_API_KEY` (obligatoria) y `LEADS_EMAIL_FROM` (opcional;
  por defecto `EcoCupon Recicla <no-reply@ecocupon.cl>`).
- **Dominio**: hay que verificar `ecocupon.cl` en Resend y publicar sus registros
  SPF/DKIM en el DNS. Sin eso, Resend rechaza el envío o cae en spam.
- **Si falta la clave**: `sendEmail` devuelve `false`, el lead igual se guarda y
  la interfaz no promete correo ("Recibimos tu solicitud…").
- **Los correos de cuenta** (confirmación de registro, recuperar contraseña) los
  envía **Supabase**, no Resend. Para que lleguen bien conviene configurar el
  SMTP de Resend en Supabase (Authentication → SMTP), con el mismo dominio.