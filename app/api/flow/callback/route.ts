import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  FLOW_PLANS,
  flowCall,
  flowDate,
  type FlowPaymentStatus,
  type FlowSubscription,
} from "@/lib/flow"

/**
 * Callback del plan: Flow avisa cada cobro de la suscripción con un `token`.
 * Se consulta el estado y, si el cobro está pagado (status 2), se alinea
 * `plan_ends_at` con el fin del periodo que Flow tiene cubierto.
 *
 * El perfil se resuelve por la suscripción, no por el correo del pagador.
 * `payment/getStatus` no trae `subscriptionId`, pero en los cobros de plan el
 * `commerceOrder` viene como `sus_xxx_<factura>_<fecha>`, así que de ahí sale el
 * id. El correo queda solo como último respaldo, escapado y exigiendo que la
 * cuenta tenga cliente de Flow.
 *
 * `flow_payments.flow_order` es la llave de idempotencia: si Flow reenvía el
 * aviso, el pago se inserta una sola vez y el periodo no se alarga dos veces.
 */

const PROFILE_FIELDS = "id, billing_period, plan_ends_at, flow_subscription_id"

/** Suscripción que Flow codifica en `commerceOrder` de los cobros de plan. */
function subscriptionFromOrder(value: string | null | undefined): string | null {
  const match = /^(sus_[a-z0-9]+)_/i.exec((value ?? "").trim())
  return match ? match[1] : null
}

/**
 * Un cobro válido es el de una factura de la suscripción o el de un plan
 * configurado. Así, cambiar un precio no invalida los cobros de los planes que
 * ya existen en Flow, y un cargo suelto de verificación de tarjeta se ignora.
 */
function amountMatches(subscription: FlowSubscription, amount: number): boolean {
  const configured = Object.values(FLOW_PLANS).map((plan) => plan.amount)
  const invoiced = (subscription.invoices ?? []).map((invoice) => Number(invoice.amount))
  return [...configured, ...invoiced].includes(amount)
}

function escapeLike(value: string): string {
  // `%`, `_` y `\` son comodines de LIKE: se escapan para que el correo se
  // compare como texto literal.
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const token = form?.get("token")?.toString() || new URL(request.url).searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Falta el token" }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Cobro sin configurar" }, { status: 500 })
  }

  try {
    const payment = await flowCall<FlowPaymentStatus>("payment/getStatus", { token })
    if (payment.status !== 2) {
      // 3 rechazado y 4 anulado: el periodo no se extiende (la cuenta sigue
      // cubierta hasta plan_ends_at) y queda el rastro para poder conciliar.
      if (payment.status === 3 || payment.status === 4) {
        console.warn("[flow] cobro no pagado", {
          flowOrder: payment.flowOrder,
          status: payment.status,
          commerceOrder: payment.commerceOrder ?? null,
        })
      }
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const email = typeof payment.payer === "string" ? payment.payer.trim().toLowerCase() : ""

    let profile: {
      id: string
      billing_period: string | null
      plan_ends_at: string | null
      flow_subscription_id: string | null
    } | null = null

    const notifiedSubscription =
      (payment.subscriptionId ? String(payment.subscriptionId) : null) ||
      subscriptionFromOrder(payment.commerceOrder)

    if (notifiedSubscription) {
      const { data } = await admin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .eq("flow_subscription_id", notifiedSubscription)
        .maybeSingle()
      profile = data
    }

    if (!profile && email) {
      const { data } = await admin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .ilike("email", escapeLike(email))
        .not("flow_customer_id", "is", null)
        .not("flow_subscription_id", "is", null)
        .maybeSingle()
      profile = data
    }

    if (!profile) {
      console.warn("[flow] cobro sin perfil de suscripción", {
        email,
        subscriptionId: notifiedSubscription,
        flowOrder: payment.flowOrder,
      })
      return NextResponse.json({ ok: true })
    }

    // La suscripción se consulta antes de aceptar el pago: el monto tiene que
    // corresponder a una de sus facturas o a un plan configurado.
    const subscription = await flowCall<FlowSubscription>("subscription/get", {
      subscriptionId: String(profile.flow_subscription_id),
    })

    const paid = Number(payment.amount)

    if (!Number.isFinite(paid) || !amountMatches(subscription, paid)) {
      console.warn("[flow] monto que no calza con el plan", {
        userId: profile.id,
        received: payment.amount,
        invoiced: subscription.invoices?.map((invoice) => invoice.amount) ?? [],
        flowOrder: payment.flowOrder,
      })
      return NextResponse.json({ ok: true, ignored: "amount" })
    }

    // Se guarda solo lo necesario para conciliar: el payload completo trae
    // datos del pagador y de la tarjeta, que no corresponde retener.
    const { error: insertError } = await admin.from("flow_payments").insert({
      flow_order: payment.flowOrder,
      user_id: profile.id,
      commerce_order: payment.commerceOrder ?? null,
      amount: paid,
      status: payment.status,
      raw: {
        flowOrder: payment.flowOrder,
        commerceOrder: payment.commerceOrder ?? null,
        subscriptionId: notifiedSubscription,
        status: payment.status,
        amount: paid,
        date: payment.paymentData?.date ?? null,
      },
    })

    // 23505 = choque de llave primaria: el aviso ya se procesó.
    if (insertError && insertError.code !== "23505") {
      throw new Error(insertError.message)
    }
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: true, duplicated: true })
    }

    // La fecha sale de la suscripción y no de una suma local: así el registro de
    // la tarjeta y cada cobro escriben el mismo valor y el desfase no se acumula.
    const end = subscription.period_end || subscription.next_invoice_date
    const parsed = end ? flowDate(end) : null

    if (!parsed) {
      // Suscripción sin periodo vigente (por ejemplo, agendada a futuro): hay
      // pago, pero no hay nada que extender todavía.
      console.warn("[flow] la suscripción no informa periodo", {
        userId: profile.id,
        subscriptionId: notifiedSubscription,
        flowOrder: payment.flowOrder,
      })
      return NextResponse.json({ ok: true, ignored: "period" })
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ plan_type: "pro", plan_ends_at: parsed.toISOString() })
      .eq("id", profile.id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[flow] no se pudo procesar el cobro", error)
    return NextResponse.json({ error: "No se pudo procesar el cobro" }, { status: 500 })
  }
}