import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Webhook de Reveniu.
 *
 * Reveniu avisa con el header `Reveniu-Secret-Key` (la misma clave de la API) y
 * un cuerpo `{ event, data: { subscription_id, subscription_external_id } }`.
 * El payload no trae ni correo ni estado, así que la cuenta se resuelve por
 * `subscription_external_id` y, si no viene, consultando la suscripción.
 *
 * Eventos según docs.reveniu.com/api-recursos/webhooks:
 *
 *   subscription_activated            alta con tarjeta                 → pro
 *   subscription_payment_succeeded    cobro recurrente correcto        → pro
 *   subscription_deactivated          fin del periodo pagado/abandono  → free
 *   subscription_abandoned_by_user    la recuperación de cobro falló   → free
 *   subscription_renewal_cancelled    apagó la renovación, aún vigente → sin cambio
 *   subscription_payment_in_recovery  reintentando el cobro            → sin cambio
 *
 * `profiles.plan_type` sólo lo escribe la service role (migración 0011), así que
 * este endpoint es el escritor legítimo y no puede tocar la base sin ella.
 */

const REVENIU_API = "https://api.reveniu.com/api/v1"

const ACTIVATE = new Set(["subscription_activated", "subscription_payment_succeeded"])
const DEACTIVATE = new Set(["subscription_deactivated", "subscription_abandoned_by_user"])
// La suscripción sigue pagada: apagar la renovación no corta el servicio hasta
// que termine el periodo, y una recuperación en curso no se suspende.
const NO_CHANGE = new Set(["subscription_renewal_cancelled", "subscription_payment_in_recovery"])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Json = Record<string, unknown>

function read(source: Json, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Json)[key]
    return undefined
  }, source)
}

function firstString(source: Json, paths: string[]): string | null {
  for (const path of paths) {
    const value = read(source, path)
    if (typeof value === "string" && value.trim() !== "") return value.trim()
    if (typeof value === "number") return String(value)
  }
  return null
}

async function customerEmail(subscriptionId: string, apiKey: string): Promise<string | null> {
  const response = await fetch(`${REVENIU_API}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { "Reveniu-Secret-Key": apiKey },
    cache: "no-store",
  })
  if (!response.ok) {
    console.warn("[reveniu] no se pudo leer la suscripción", { subscriptionId, status: response.status })
    return null
  }
  const json = (await response.json()) as Json
  return firstString(json, ["customer.email", "data.customer.email"])
}

export async function POST(request: Request) {
  const apiKey = process.env.REVENIU_API_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!apiKey) {
    console.error("[reveniu] falta REVENIU_API_KEY")
    return NextResponse.json({ error: "webhook sin configurar" }, { status: 500 })
  }

  // Reveniu firma con su secret key; el token en la URL queda como alternativa
  // por si el panel no permite configurar el header.
  const sentKey =
    request.headers.get("reveniu-secret-key") ?? new URL(request.url).searchParams.get("token")
  if (sentKey !== apiKey) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  }

  if (!serviceKey || !supabaseUrl) {
    // Sin la service role key no se puede escribir plan_type: mejor fallar fuerte
    // y visible que aceptar el evento y perderlo.
    console.error("[reveniu] faltan SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL")
    return NextResponse.json({ error: "webhook sin configurar" }, { status: 500 })
  }

  let body: Json
  try {
    body = (await request.json()) as Json
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 })
  }

  const event = (firstString(body, ["event", "type"]) ?? "").toLowerCase()
  const subscriptionId = firstString(body, ["data.subscription_id", "data.id", "subscription_id"])
  const externalId = firstString(body, ["data.subscription_external_id", "data.external_id"])

  let plan: "pro" | "free" | null = null
  if (ACTIVATE.has(event)) plan = "pro"
  else if (DEACTIVATE.has(event)) plan = "free"

  if (!plan) {
    const known = NO_CHANGE.has(event)
    console[known ? "info" : "warn"](`[reveniu] evento sin cambio de plan`, {
      event,
      subscriptionId,
      reason: known ? "sigue vigente" : "evento desconocido",
    })
    return NextResponse.json({
      received: true,
      handled: false,
      event,
      reason: known ? "sigue vigente" : "evento desconocido",
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Si el checkout llevó el id del perfil como external_id, se resuelve sin
  //    llamar a la API.
  if (externalId && UUID_RE.test(externalId)) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ plan_type: plan, updated_at: new Date().toISOString() })
      .eq("id", externalId)
      .select("id")

    if (error) {
      console.error("[reveniu] no se pudo actualizar el perfil", { externalId, plan, error: error.message })
      return NextResponse.json({ error: "no se pudo actualizar el perfil" }, { status: 500 })
    }
    if (data?.length) {
      console.info("[reveniu] plan actualizado por external_id", { externalId, plan, event })
      return NextResponse.json({ received: true, handled: true, event, plan, via: "external_id" })
    }
  }

  // 2) Sin external_id utilizable, el correo sale de la suscripción.
  const email =
    externalId && externalId.includes("@")
      ? externalId
      : subscriptionId
        ? await customerEmail(subscriptionId, apiKey)
        : null

  if (!email) {
    console.warn("[reveniu] evento sin cuenta identificable", { event, subscriptionId, externalId })
    return NextResponse.json({
      received: true,
      handled: false,
      event,
      reason: "no se pudo identificar la cuenta",
    })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ plan_type: plan, updated_at: new Date().toISOString() })
    .ilike("email", email)
    .select("id")

  if (error) {
    console.error("[reveniu] no se pudo actualizar el perfil", { email, plan, error: error.message })
    return NextResponse.json({ error: "no se pudo actualizar el perfil" }, { status: 500 })
  }

  const matched = data?.length ?? 0
  if (matched === 0) {
    // El correo del pago no coincide con ninguna cuenta: hay que reconciliarlo
    // a mano desde el panel de Reveniu.
    console.warn("[reveniu] pago sin cuenta asociada", { email, plan, event })
  } else {
    console.info("[reveniu] plan actualizado", { email, plan, event, perfiles: matched })
  }

  return NextResponse.json({
    received: true,
    handled: matched > 0,
    event,
    plan,
    email,
    profiles: matched,
  })
}