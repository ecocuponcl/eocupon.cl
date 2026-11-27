import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { leadConfirmationEmail } from "@/lib/email/lead-confirmation"
import { sendEmail } from "@/lib/email/send"

/**
 * Registro de interesados del programa EcoCupon Recicla.
 *
 * Usa variables DEDICADAS para no repuntar el resto de la app:
 *   LEADS_SUPABASE_URL + LEADS_SUPABASE_SERVICE_ROLE_KEY
 * Si no existen, cae a NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Escribe en `public.program_leads` (RLS activo, sin policies). Si falta
 * configuracion o falla el insert, responde 5xx con `ok:false`; el formulario
 * cae a WhatsApp en vez de fingir un registro.
 */
const ROLES = ["municipio", "marca", "empresa", "comercio"] as const
const TIPOS = ["puntos_limpios", "retail", "eventos", "educativo", "otro"] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido" }, { status: 400 })
  }

  const rol = clean(body.rol, 20)
  const organizacion = clean(body.organizacion, 160)
  const nombre = clean(body.nombre, 120)
  const comuna = clean(body.comuna, 120)
  const email = clean(body.email, 200).toLowerCase()
  const cargo = clean(body.cargo, 120) || null
  const whatsapp = clean(body.whatsapp, 40) || null
  const tipoRaw = clean(body.tipo_programa, 30)
  const tipo = (TIPOS as readonly string[]).includes(tipoRaw) ? tipoRaw : null
  const mensaje = clean(body.mensaje, 1200) || null
  const origen = clean(body.origen, 60) || "landing_recicla"

  if (!(ROLES as readonly string[]).includes(rol))
    return NextResponse.json({ ok: false, error: "Rol invalido" }, { status: 422 })
  if (organizacion.length < 2)
    return NextResponse.json({ ok: false, error: "Falta la organizacion" }, { status: 422 })
  if (nombre.length < 2)
    return NextResponse.json({ ok: false, error: "Falta el nombre" }, { status: 422 })
  if (comuna.length < 2)
    return NextResponse.json({ ok: false, error: "Falta la comuna o territorio" }, { status: 422 })
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ ok: false, error: "Email invalido" }, { status: 422 })

  let comercios: number | null = null
  if (body.comercios_estimados !== null && body.comercios_estimados !== undefined && body.comercios_estimados !== "") {
    const n = Number(body.comercios_estimados)
    if (!Number.isFinite(n) || n < 0 || n > 100000)
      return NextResponse.json({ ok: false, error: "Comercios invalidos" }, { status: 422 })
    comercios = Math.floor(n)
  }

  const url = process.env.LEADS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.warn("[leads] sin URL o service role para persistir")
    return NextResponse.json({ ok: false, error: "El registro en linea no esta configurado" }, { status: 503 })
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { error } = await admin.from("program_leads").insert({
    rol, organizacion, nombre, cargo, comuna, email, whatsapp,
    tipo_programa: tipo, comercios_estimados: comercios, mensaje, origen,
  })
  if (error) {
    console.error("[leads] insert fallo:", error.message)
    return NextResponse.json({ ok: false, error: "No se pudo registrar la solicitud" }, { status: 500 })
  }

  // Correo de confirmación (no bloquea el registro si falla o no está configurado).
  let emailSent = false
  try {
    const mail = leadConfirmationEmail({ nombre, organizacion, comuna, rol, tipoPrograma: tipo })
    emailSent = await sendEmail({ to: email, ...mail })
  } catch (e) {
    console.error("[leads] email error:", e)
  }

  return NextResponse.json({ ok: true, emailSent })
}
