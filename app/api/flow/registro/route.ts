import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  FLOW_PLANS,
  flowCall,
  isBillingPeriod,
  type FlowCardStatus,
  type FlowSubscription,
} from "@/lib/flow"

/**
 * Flow devuelve acá al comercio después de enrolar la tarjeta (POST con un
 * `token`). Con ese token se confirma el registro y recién ahí se crea la
 * suscripción al plan elegido.
 *
 * No se usa la sesión: la identidad sale del `customerId` que Flow confirma,
 * y ese id se guardó en el perfil cuando el usuario inició el cobro.
 */
async function handle(request: Request) {
  const url = new URL(request.url)
  let token = url.searchParams.get("token")

  if (request.method === "POST") {
    const form = await request.formData().catch(() => null)
    token = form?.get("token")?.toString() || token
  }

  const period = url.searchParams.get("periodo")
  if (!token || !isBillingPeriod(period)) {
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url))
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url))
  }

  try {
    const card = await flowCall<FlowCardStatus>("customer/getRegisterStatus", { token })
    if (card.status !== "1") {
      return NextResponse.redirect(new URL("/dashboard/cuenta?estado=tarjeta", url))
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, flow_subscription_id")
      .eq("flow_customer_id", card.customerId)
      .maybeSingle()

    if (!profile) {
      console.warn("[flow] tarjeta enrolada para un cliente sin perfil", { customerId: card.customerId })
      return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url))
    }

    let endsAt = new Date()
    if (period === "anual") endsAt.setFullYear(endsAt.getFullYear() + 1)
    else endsAt.setMonth(endsAt.getMonth() + 1)

    if (!profile.flow_subscription_id) {
      const subscription = await flowCall<FlowSubscription>(
        "subscription/create",
        { planId: FLOW_PLANS[period].planId, customerId: card.customerId },
        "POST",
      )

      const end =
        subscription.next_invoice_date || subscription.period_end || subscription.subscription_end
      const parsed = end ? new Date(end.replace(" ", "T")) : null
      if (parsed && Number.isFinite(parsed.getTime()) && parsed > new Date()) endsAt = parsed

      const { error } = await admin
        .from("profiles")
        .update({
          plan_type: "pro",
          billing_period: period,
          plan_ends_at: endsAt.toISOString(),
          flow_subscription_id: subscription.subscriptionId,
        })
        .eq("id", profile.id)

      if (error) throw new Error(error.message)
    }

    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=activo", url))
  } catch (error) {
    console.error("[flow] no se pudo activar la suscripción", error)
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url))
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}