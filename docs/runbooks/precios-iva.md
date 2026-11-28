# Precios e IVA — decisión pendiente

La web publica "$9.000 /mes + IVA" y "$80.000 al año + IVA", pero Flow cobra
9.000 y 80.000 planos. Hay que decidir cuál de los dos escenarios es el correcto
antes de promocionar el plan Pro. **Este documento no cambia precios.**

## Escenario A — los precios son netos

Flow debe cobrar el neto más 19 % de IVA.

| Plan | Neto publicado | IVA 19 % | Total a cobrar | Texto correcto |
| --- | --- | --- | --- | --- |
| Mensual | $9.000 | $1.710 | **$10.710** | "$10.710 IVA incluido" |
| Anual | $80.000 | $15.200 | **$95.200** | "$95.200 IVA incluido" |

Qué hay que cambiar: `FLOW_PRICE_MONTHLY=10710` y `FLOW_PRICE_ANNUAL=95200` en
Vercel, los textos de `/precios` y `/dashboard/cuenta`, y el plan en Flow (los
planes con suscriptores no se pueden editar: hoy no hay ninguno, así que se puede
crear con el monto nuevo sin migración).

## Escenario B — los precios son finales

Flow cobra lo publicado y el IVA va incluido en ese monto.

| Plan | Precio final | Neto implícito (÷1,19) | Texto correcto |
| --- | --- | --- | --- |
| Mensual | $9.000 | $7.563 | "$9.000 IVA incluido" |
| Anual | $80.000 | $67.227 | "$80.000 IVA incluido" |

Qué hay que cambiar: solo los textos (+ IVA → IVA incluido). Los montos de Flow
quedan como están.

## El mensaje de "2 meses gratis"

12 meses al precio mensual, en cada escenario:

| Escenario | 12 meses | Precio anual | Ahorro | Equivale a |
| --- | --- | --- | --- | --- |
| A | $128.520 | $95.200 | $33.320 | **3,1 meses** |
| B | $108.000 | $80.000 | $28.000 | **3,1 meses** |

El ahorro real es de ~3,1 meses, no de 2. Si se quiere mantener "2 meses gratis"
en el texto, el anual debería ser 10 veces el mensual: $90.000 con IVA incluido
(escenario B) o $107.100 (escenario A). Si se mantiene el precio actual, el texto
correcto es "más de 3 meses gratis".

## Decisión requerida

1. ¿El precio publicado es neto (A) o final (B)?
2. ¿Se ajusta el texto de ahorro o el precio anual?

Ambas son decisiones del propietario; ninguna se aplicó en código.