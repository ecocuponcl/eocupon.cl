import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Registra un canje confirmado por el comercio.
// Requiere sesión autenticada: el handler verifica que el coupon_id del que se
// canjea pertenece al user_id autenticado.
//
// GET  /api/redeem?instance_id=...  → verificar sin confirmar (pre-check)
// POST /api/redeem                  → confirmar canje
//
// Lógica de periodo (prevención de doble canje):
//   once     → period = 'once'           (solo un canje total)
//   daily    → period = 'YYYY-DDD'
//   weekly   → period = 'YYYY-WNN'
//   monthly  → period = 'YYYY-MM'
//   unlimited→ period = uuid aleatorio   (nunca colisiona)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function computePeriod(redemptionPeriod: string): string {
  const now = new Date()

  if (redemptionPeriod === "once") return "once"
  if (redemptionPeriod === "unlimited") return crypto.randomUUID()

  if (redemptionPeriod === "monthly") {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  }

  if (redemptionPeriod === "weekly") {
    // Semana ISO: lunes como inicio
    const jan1 = new Date(now.getUTCFullYear(), 0, 1)
    const week = Math.ceil(
      ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7
    )
    return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
  }

  if (redemptionPeriod === "daily") {
    const doy =
      Math.floor(
        (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
          Date.UTC(now.getUTCFullYear(), 0, 0)) /
          86400000
      )
    return `${now.getUTCFullYear()}-D${String(doy).padStart(3, "0")}`
  }

  // Fallback seguro
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function POST(req: NextRequest) {
  // 1. Sesión del comercio
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2. Leer body
  let body: { instance_id?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { instance_id, notes } = body

  if (!instance_id || !UUID_RE.test(instance_id)) {
    return NextResponse.json({ error: "instance_id inválido" }, { status: 400 })
  }

  // 3. Leer la instancia y el cupón con admin para bypassear RLS
  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no configurada" },
      { status: 500 }
    )
  }

  const { data: instance, error: instanceError } = await admin
    .from("coupon_instances")
    .select(`
      id,
      coupon_id,
      consumer_name,
      consumer_phone,
      is_active,
      expires_at,
      coupons (
        id,
        user_id,
        title,
        business_name,
        discount_percentage,
        coupon_code,
        expires_campaign_at,
        redemption_period,
        max_total_redemptions
      )
    `)
    .eq("id", instance_id)
    .maybeSingle()

  if (instanceError || !instance) {
    return NextResponse.json({ error: "Instancia no encontrada" }, { status: 404 })
  }

  const coupon = instance.coupons as unknown as {
    id: string
    user_id: string
    title: string
    business_name: string
    discount_percentage: number
    coupon_code: string
    expires_campaign_at: string | null
    redemption_period: string | null
    max_total_redemptions: number | null
  }

  // 4. Verificar que el comercio autenticado es el dueño del cupón
  if (coupon.user_id !== user.id) {
    return NextResponse.json({ error: "Sin permiso para este cupón" }, { status: 403 })
  }

  // 5. Verificar estado de la instancia
  if (!instance.is_active) {
    return NextResponse.json({ error: "Esta instancia está inactiva" }, { status: 409 })
  }

  if (instance.expires_at && new Date() > new Date(instance.expires_at)) {
    return NextResponse.json({ error: "Esta instancia venció" }, { status: 410 })
  }

  if (
    coupon.expires_campaign_at &&
    new Date() > new Date(coupon.expires_campaign_at)
  ) {
    return NextResponse.json({ error: "La campaña venció" }, { status: 410 })
  }

  // 6. Calcular el periodo y verificar doble canje
  const period = computePeriod(coupon.redemption_period ?? "once")

  const { data: existing } = await admin
    .from("redemptions")
    .select("id")
    .eq("instance_id", instance_id)
    .eq("period", period)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: "Ya se registró un canje para este periodo", code: "already_redeemed" },
      { status: 409 }
    )
  }

  // 7. Verificar límite total (si aplica)
  if (coupon.max_total_redemptions !== null) {
    const { count } = await admin
      .from("redemptions")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", instance_id)

    if ((count ?? 0) >= coupon.max_total_redemptions) {
      return NextResponse.json(
        { error: "Se alcanzó el límite de canjes para este cupón", code: "max_reached" },
        { status: 409 }
      )
    }
  }

  // 8. Registrar el canje
  const { data: redemption, error: redeemError } = await admin
    .from("redemptions")
    .insert({
      instance_id,
      redeemed_by: user.id,
      period,
      notes: notes?.trim().slice(0, 500) || null,
    })
    .select("id, redeemed_at")
    .single()

  if (redeemError) {
    // El índice único puede dispararse por una race condition; lo tratamos igual
    if (redeemError.code === "23505") {
      return NextResponse.json(
        { error: "Ya se registró un canje para este periodo", code: "already_redeemed" },
        { status: 409 }
      )
    }
    console.error("[redeem] Error registrando canje:", redeemError.message)
    return NextResponse.json(
      { error: "Error al registrar el canje. Intenta de nuevo." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    redemption_id: redemption.id,
    redeemed_at: redemption.redeemed_at,
    consumer_name: instance.consumer_name,
    coupon_title: coupon.title,
    business_name: coupon.business_name,
  })
}

// GET: verificar estado sin confirmar (pre-check para el validador)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const instance_id = searchParams.get("instance_id") ?? ""

  if (!UUID_RE.test(instance_id)) {
    return NextResponse.json({ error: "instance_id inválido" }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }, { status: 500 })
  }

  const { data: instance, error: instanceError } = await admin
    .from("coupon_instances")
    .select(`
      id,
      coupon_id,
      consumer_name,
      consumer_phone,
      is_active,
      expires_at,
      coupons (
        id,
        user_id,
        title,
        business_name,
        expires_campaign_at,
        redemption_period
      )
    `)
    .eq("id", instance_id)
    .maybeSingle()

  if (instanceError || !instance) {
    return NextResponse.json({ error: "Instancia no encontrada" }, { status: 404 })
  }

  const coupon = instance.coupons as unknown as {
    id: string
    user_id: string
    title: string
    business_name: string
    expires_campaign_at: string | null
    redemption_period: string | null
  }

  if (coupon.user_id !== user.id) {
    return NextResponse.json({ error: "Sin permiso para este cupón" }, { status: 403 })
  }

  if (!instance.is_active) {
    return NextResponse.json({ error: "Instancia inactiva" }, { status: 410 })
  }

  if (instance.expires_at && new Date() > new Date(instance.expires_at)) {
    return NextResponse.json({ error: "Instancia vencida" }, { status: 410 })
  }

  if (coupon.expires_campaign_at && new Date() > new Date(coupon.expires_campaign_at)) {
    return NextResponse.json({ error: "Campaña vencida" }, { status: 410 })
  }

  // Verificar si ya canjeó en el periodo actual
  const period = computePeriod(coupon.redemption_period ?? "once")

  if (period !== "__unlimited__") {
    const { data: existing } = await admin
      .from("redemptions")
      .select("id, redeemed_at")
      .eq("instance_id", instance_id)
      .eq("period", period)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          error: "Ya canjeó en este periodo",
          code: "already_redeemed",
          consumer_name: instance.consumer_name,
          last_redeemed_at: existing.redeemed_at,
        },
        { status: 409 }
      )
    }
  }

  return NextResponse.json({
    consumer_name: instance.consumer_name,
    consumer_phone: instance.consumer_phone,
    coupon_title: coupon.title,
    business_name: coupon.business_name,
  })
}
