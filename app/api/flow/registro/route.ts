import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  FLOW_PLANS,
  FlowError,
  flowCall,
  flowDate,
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
 *
 * Pro se otorga solo si la primera factura de Flow quedó pagada. Si el cobro no
 * se concreta, la suscripción igual se guarda y el acceso llegará por el callback
 * cuando Flow cobre; así una tarjeta rechazada no regala un periodo.
 *
 * Una suscripción vigente no se duplica: si ya existe y sigue viva, se informa su
 * estado en vez de crear otra. Solo se crea una nueva cuando la anterior quedó
 * cancelada o terminada, que es el caso de un comercio que vuelve.
 *
 * La vuelta al dashboard va con 303: Flow llega con un POST y un 307 reenviaría
 * ese POST a una página que solo acepta GET, que termina en 405.
 */

/** Cancelada o terminada: ya no sirve y hay que crear otra. */
function isFinished(subscription: FlowSubscription): boolean {
  return subscription.status === 4 || Boolean(subscription.cancel_at)
}

/** El periodo en curso está pagado y sigue vigente. */
function hasPaidPeriod(subscription: FlowSubscription): boolean {
  const end = subscription.period_end ? flowDate(subscription.period_end) : null
  const paid = (subscription.invoices ?? []).some((invoice) => invoice.status === 1)
  return Boolean(end && end > new Date() && paid)
}

/**
 * Suscripción guardada en el perfil. Un id que Flow no conoce (código 1001) se
 * trata como ausente; cualquier otro error se propaga, para no crear una segunda
 * suscripción por un fallo pasajero.
 */
async function currentSubscription(id: string | null): Promise<FlowSubscription | null> {
  if (!id) return null

  try {
    return await flowCall<FlowSubscription>("subscription/get", { subscriptionId: id })
  } catch (error) {
    if (error instanceof FlowError && error.code === 1001) return null
    throw error
  }
}

async function handle(request: Request) {
  const url = new URL(request.url)
  let token = url.searchParams.get("token")

  if (request.method === "POST") {
    const form = await request.formData().catch(() => null)
    token = form?.get("token")?.toString() || token
  }

  const period = url.searchParams.get("periodo")
  if (!token || !isBillingPeriod(period)) {
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url), 303)
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url), 303)
  }

  try {
    const card = await flowCall<FlowCardStatus>("customer/getRegisterStatus", { token })
    if (card.status !== "1") {
      return NextResponse.redirect(new URL("/dashboard/cuenta?estado=tarjeta", url), 303)
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, flow_subscription_id")
      .eq("flow_customer_id", card.customerId)
      .maybeSingle()

    if (!profile) {
      console.warn("[flow] tarjeta enrolada para un cliente sin perfil", { customerId: card.customerId })
      return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url), 303)
    }

    const current = await currentSubscription(profile.flow_subscription_id)

    if (current && !isFinished(current)) {
      const estado = hasPaidPeriod(current) ? "activo" : "pendiente"
      return NextResponse.redirect(new URL(`/dashboard/cuenta?estado=${estado}`, url), 303)
    }

    const subscription = await flowCall<FlowSubscription>(
      "subscription/create",
      { planId: FLOW_PLANS[period].planId, customerId: card.customerId },
      "POST",
    )

    // El id se guarda siempre: el callback lo necesita para resolver al comercio.
    const { error: saveError } = await admin
      .from("profiles")
      .update({ billing_period: period, flow_subscription_id: subscription.subscriptionId })
      .eq("id", profile.id)

    if (saveError) throw new Error(saveError.message)

    // Sin primera factura pagada no se otorga Pro: el periodo lo confirmará el
    // callback cuando Flow cobre, o quedará en prueba/free si la tarjeta falla.
    const end = subscription.period_end || subscription.next_invoice_date
    const paidUntil = subscription.invoices?.[0]?.status === 1 && end ? flowDate(end) : null

    if (!paidUntil || paidUntil <= new Date()) {
      return NextResponse.redirect(new URL("/dashboard/cuenta?estado=pendiente", url), 303)
    }

    const { error: planError } = await admin
      .from("profiles")
      .update({ plan_type: "pro", plan_ends_at: paidUntil.toISOString() })
      .eq("id", profile.id)

    if (planError) throw new Error(planError.message)

    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=activo", url), 303)
  } catch (error) {
    console.error("[flow] no se pudo activar la suscripción", error)
    return NextResponse.redirect(new URL("/dashboard/cuenta?estado=error", url), 303)
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}