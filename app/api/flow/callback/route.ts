import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { FLOW_PLANS, flowCall, isBillingPeriod, type FlowPaymentStatus } from "@/lib/flow"

/**
 * Callback del plan: Flow avisa cada cobro de la suscripción con un `token`.
 * Se consulta el estado y, si el cobro está pagado (status 2), se extiende el
 * periodo contratado.
 *
 * El perfil se resuelve por la suscripción que Flow informa, no por el correo
 * del pagador: un correo con comodines no puede casar con otra cuenta. El
 * correo queda solo como respaldo, escapado y exigiendo que la cuenta tenga
 * cliente de Flow.
 *
 * `flow_payments.flow_order` es la llave de idempotencia: si Flow reenvía el
 * aviso, el pago se inserta una sola vez y el periodo no se alarga dos veces.
 */

const PROFILE_FIELDS = "id, billing_period, plan_ends_at, flow_subscription_id"

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
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const email = typeof payment.payer === "string" ? payment.payer.trim().toLowerCase() : ""

    let profile: {
      id: string
      billing_period: string | null
      plan_ends_at: string | null
      flow_subscription_id: string | null
    } | null = null

    if (payment.subscriptionId) {
      const { data } = await admin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .eq("flow_subscription_id", String(payment.subscriptionId))
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
        subscriptionId: payment.subscriptionId,
        flowOrder: payment.flowOrder,
      })
      return NextResponse.json({ ok: true })
    }

    // Un cargo de verificación de tarjeta no paga un periodo: el monto debe
    // coincidir con el plan contratado.
    const period = isBillingPeriod(profile.billing_period) ? profile.billing_period : "mensual"
    const paid = Number(payment.amount)

    if (!Number.isFinite(paid) || paid !== FLOW_PLANS[period].amount) {
      console.warn("[flow] monto que no calza con el plan", {
        userId: profile.id,
        expected: FLOW_PLANS[period].amount,
        received: payment.amount,
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
        subscriptionId: payment.subscriptionId ?? null,
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

    const base =
      profile.plan_ends_at && new Date(profile.plan_ends_at) > new Date()
        ? new Date(profile.plan_ends_at)
        : new Date()

    if (period === "anual") base.setFullYear(base.getFullYear() + 1)
    else base.setMonth(base.getMonth() + 1)

    const { error: updateError } = await admin
      .from("profiles")
      .update({ plan_type: "pro", plan_ends_at: base.toISOString() })
      .eq("id", profile.id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[flow] no se pudo procesar el cobro", error)
    return NextResponse.json({ error: "No se pudo procesar el cobro" }, { status: 500 })
  }
}