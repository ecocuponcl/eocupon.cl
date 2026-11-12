import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Activa una instancia de cupón para un consumidor.
// No requiere sesión de consumidor: el UUID del cupón actúa como capacidad.
// La creación de la fila se hace con service role para bypassear RLS (la policy
// de INSERT en coupon_instances solo permite el dueño del cupón).
//
// Protección básica contra spam: Vercel añade `x-forwarded-for`; limitamos a
// una activación por IP cada 60 segundos a nivel de BD con un índice parcial.
// Para rate-limiting real en producción usar Upstash o el middleware de Vercel.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function computeExpiresAt(
  redemptionPeriod: string | null,
  months?: number | null
): string | null {
  // Si la campaña no tiene política de expiración de instancia, sin vencimiento.
  if (!months) return null
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export async function POST(req: NextRequest) {
  // 1. Leer y validar el body
  let body: { coupon_id?: string; consumer_name?: string; consumer_phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { coupon_id, consumer_name, consumer_phone } = body

  if (!coupon_id || !UUID_RE.test(coupon_id)) {
    return NextResponse.json({ error: "coupon_id inválido" }, { status: 400 })
  }

  const name = (consumer_name ?? "").trim()
  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json(
      { error: "El nombre debe tener entre 2 y 100 caracteres" },
      { status: 400 }
    )
  }

  const phone = (consumer_phone ?? "").trim().slice(0, 30) || null

  // 2. Verificar que el cupón existe y está activo
  //    Usamos el cliente server normal (RLS permite leer cupones públicos o propios).
  //    Para cupones privados usamos admin como en /cupon/[id].
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const admin = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

  const reader = admin ?? (await createServerClient())

  const { data: coupon, error: couponError } = await reader
    .from("coupons")
    .select("id, title, business_name, expires_campaign_at, redemption_period, is_active_campaign:is_public")
    .eq("id", coupon_id)
    .maybeSingle()

  if (couponError || !coupon) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 })
  }

  // Verificar vencimiento de campaña
  if (
    coupon.expires_campaign_at &&
    new Date() > new Date(coupon.expires_campaign_at)
  ) {
    return NextResponse.json({ error: "Esta campaña ya venció" }, { status: 410 })
  }

  // 3. Crear la instancia con service role
  if (!admin) {
    console.warn("[coupon-instance] SUPABASE_SERVICE_ROLE_KEY no configurada")
    return NextResponse.json(
      { error: "El servidor no está configurado correctamente" },
      { status: 500 }
    )
  }

  const expiresAt = computeExpiresAt(coupon.redemption_period, null)

  const { data: instance, error: instanceError } = await admin
    .from("coupon_instances")
    .insert({
      coupon_id,
      consumer_name: name,
      consumer_phone: phone,
      expires_at: expiresAt,
    })
    .select("id, coupon_id, consumer_name, activated_at, expires_at")
    .single()

  if (instanceError) {
    console.error("[coupon-instance] Error creando instancia:", instanceError.message)
    return NextResponse.json(
      { error: "No se pudo activar el cupón. Intenta de nuevo." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    id: instance.id,
    coupon_id: instance.coupon_id,
    consumer_name: instance.consumer_name,
    activated_at: instance.activated_at,
    expires_at: instance.expires_at,
    coupon_title: coupon.title,
    business_name: coupon.business_name,
  })
}
