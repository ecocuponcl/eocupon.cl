import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Webhook de EmailOctopus.
 *
 * URL de registro: https://www.ecocupon.cl/api/emailoctopus/webhook
 *
 * Eventos configurados:
 *   Contacto — created, updated, deleted
 *   Email    — clicked, opened, bounced, complained, unsubscribed
 *
 * Validación: EmailOctopus firma cada request con HMAC-SHA256 sobre el body
 * crudo y lo envía en el header `EmailOctopus-Signature: sha256=<hex>`.
 * Variable de entorno requerida: EMAILOCTOPUS_WEBHOOK_SECRET (único por
 * endpoint, se obtiene del dashboard de EmailOctopus al crear el webhook).
 *
 * Respuesta esperada: 2xx. Si responde con error, EO reintenta hasta 9 veces
 * en ~10 días con backoff exponencial.
 */

type EOContactEvent = {
  id: string
  type: "contact.created" | "contact.updated" | "contact.deleted"
  list_id: string
  contact_id: string
  contact_email_address: string
  contact_status?: string
  contact_fields?: Record<string, string>
  contact_tags?: string[]
  occurred_at: string
}

type EOEmailEvent = {
  id: string
  type:
    | "contact.clicked"
    | "contact.opened"
    | "contact.bounced"
    | "contact.complained"
    | "contact.unsubscribed"
  list_id: string
  contact_id: string
  contact_email_address: string
  occurred_at: string
  campaign_id?: string
  automation_id?: string
  automation_email_id?: string
  url?: string
  bounce_type?: "hard" | "soft"
}

type EOEvent = EOContactEvent | EOEmailEvent

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`
  try {
    // timingSafeEqual requiere buffers del mismo tamaño para evitar timing attacks.
    const a = Buffer.from(header)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Crea un cliente Supabase admin solo si las variables de entorno están presentes. */
function adminClient() {
  const url = process.env.LEADS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

export async function POST(req: NextRequest) {
  const secret = process.env.EMAILOCTOPUS_WEBHOOK_SECRET
  if (!secret) {
    console.error("[eo-webhook] EMAILOCTOPUS_WEBHOOK_SECRET no configurado")
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // El body debe leerse como texto antes de cualquier parseo: la firma cubre el raw body.
  const rawBody = await req.text()
  const signature = req.headers.get("emailoctopus-signature")

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn("[eo-webhook] firma inválida")
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let events: EOEvent[]
  try {
    const parsed = JSON.parse(rawBody)
    if (!Array.isArray(parsed)) throw new Error("payload no es un array")
    events = parsed as EOEvent[]
  } catch (e) {
    console.error("[eo-webhook] JSON inválido:", e)
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  let failed = 0
  for (const event of events) {
    try {
      await handleEvent(event)
    } catch (e) {
      // Un evento fallido no detiene el lote, pero el lote responde 500: es la
      // única señal que hace que EmailOctopus reintente.
      failed++
      console.error("[eo-webhook] error en evento", event.id, e)
    }
  }

  if (failed > 0) {
    return NextResponse.json({ ok: false, failed }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function handleEvent(event: EOEvent) {
  const email = event.contact_email_address?.toLowerCase()

  switch (event.type) {
    case "contact.unsubscribed":
    case "contact.complained":
    case "contact.bounced":
    case "contact.deleted": {
      // Marcar el lead como no contactable en program_leads.
      if (!email) break
      const db = adminClient()
      if (!db) throw new Error("Supabase de leads sin configurar")
      const { error } = await db
        .from("program_leads")
        .update({ eo_status: event.type })
        .eq("email", email)
      if (error) throw new Error(`program_leads: ${error.message}`)
      console.info(`[eo-webhook] ${event.type} aplicado a lead ${email}`)
      break
    }

    case "contact.created":
    case "contact.updated":
    case "contact.clicked":
    case "contact.opened":
      console.info(`[eo-webhook] ${event.type} — ${email ?? event.contact_id}`)
      break

    default:
      console.warn("[eo-webhook] evento no reconocido:", (event as { type: string }).type)
  }
}
