import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ensureCustomer,
  ensurePlan,
  isBillingPeriod,
  startCardRegister,
} from "@/lib/flow"

/**
 * Primer paso de la suscripción: crea (o reutiliza) el plan y el cliente en
 * Flow y devuelve la URL donde el comercio enrola su tarjeta. Al volver, Flow
 * llama a /api/flow/registro y ahí recién se crea la suscripción.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para suscribirte." }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "El cobro no está configurado en el servidor." }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const period = body?.period
  if (!isBillingPeriod(period)) {
    return NextResponse.json({ error: "Elige un plan mensual o anual." }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rut, flow_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile?.rut) {
    return NextResponse.json(
      { error: "Guarda el RUT de tu comercio antes de suscribirte." },
      { status: 400 },
    )
  }

  try {
    await ensurePlan(period)
    const customerId = await ensureCustomer(user, profile.flow_customer_id)

    if (customerId !== profile.flow_customer_id) {
      const { error } = await admin
        .from("profiles")
        .update({ flow_customer_id: customerId })
        .eq("id", user.id)
      if (error) throw new Error(`No se pudo guardar el cliente de Flow: ${error.message}`)
    }

    const url = await startCardRegister(customerId, period)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("[flow] no se pudo iniciar la suscripción", error)
    const message = error instanceof Error ? error.message : "No se pudo iniciar el cobro."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}