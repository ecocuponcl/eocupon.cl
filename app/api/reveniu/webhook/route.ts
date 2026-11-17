import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Webhook de Reveniu: traduce eventos de pago/suscripción al plan del perfil.
 *
 * `profiles.plan_type` tiene revocado el UPDATE para `anon` y `authenticated`
 * (migración 0011), así que este endpoint es el único escritor legítimo y usa
 * la service role key.
 *
 * Los nombres de evento son los que documenta Reveniu a la fecha de escritura.
 * Cualquier evento desconocido se responde 200 con `handled: false` y su `type`
 * queda en el log, para ajustar la lista con el primer evento real.
 */

// Activación de plan de pago.
const ACTIVATE = new Set([
  "payment.succeeded",
  "payment.approved",
  "subscription.created",
  "subscription.activated",
  "subscription.renewed",
  "subscription.payment.succeeded",
])

// Vuelta a gratuita.
const DEACTIVATE = new Set([
  "subscription.canceled",
  "subscription.cancelled",
  "subscription.expired",
  "subscription.paused",
  "subscription.payment.failed",
  "payment.failed",
  "payment.rejected",
  "refund.created",
])

// Cuando el evento no está en las listas, manda el estado de la suscripción.
// `trialing` importa: con prueba configurada en el plan de Reveniu, el primer
// evento llega en prueba y el usuario ya debe operar como Pro.
const ACTIVE_STATUSES = new Set(["active", "trialing", "trial", "authorized"])
const INACTIVE_STATUSES = new Set([
  "canceled",
  "cancelled",
  "expired",
  "past_due",
  "unpaid",
  "paused",
  "failed",
  "rejected",
])

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

export async function POST(request: Request) {
  const expectedToken = process.env.REVENIU_WEBHOOK_TOKEN
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!expectedToken) {
    console.error("[reveniu] falta REVENIU_WEBHOOK_TOKEN")
    return NextResponse.json({ error: "webhook sin configurar" }, { status: 500 })
  }

  // El token viaja en la URL porque el webhook de Reveniu se configura como un
  // destino simple; el header queda como alternativa si más adelante firma.
  const token = new URL(request.url).searchParams.get("token") ?? request.headers.get("x-reveniu-token")
  if (token !== expectedToken) {
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

  const type = (firstString(body, ["type", "event", "event_type", "eventType", "name"]) ?? "").toLowerCase()
  const status = (firstString(body, ["data.status", "data.subscription.status", "status", "data.state"]) ?? "").toLowerCase()
  const email = firstString(body, [
    "data.customer.email",
    "data.subscription.customer.email",
    "data.payer.email",
    "data.email",
    "customer.email",
    "email",
  ])

  let plan: "pro" | "free" | null = null
  if (ACTIVATE.has(type)) plan = "pro"
  else if (DEACTIVATE.has(type)) plan = "free"
  else if (ACTIVE_STATUSES.has(status)) plan = "pro"
  else if (INACTIVE_STATUSES.has(status)) plan = "free"

  if (!plan || !email) {
    console.warn("[reveniu] evento sin acción", { type, status, email, keys: Object.keys(body) })
    return NextResponse.json({ received: true, handled: false, type, status, reason: plan ? "sin email" : "evento desconocido" })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

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
    console.warn("[reveniu] pago sin cuenta asociada", { email, plan, type })
  } else {
    console.info("[reveniu] plan actualizado", { email, plan, type, perfiles: matched })
  }

  return NextResponse.json({ received: true, handled: matched > 0, type, plan, email, profiles: matched })
}