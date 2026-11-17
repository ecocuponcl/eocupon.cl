import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { normalizePlan } from "@/lib/plans"

/**
 * Cambia el plan de la cuenta dueña para probar ambos planes.
 *
 * Doble candado: el código secreto y el correo autorizado, ambos en variables
 * de entorno. La escritura va con service role porque `plan_type` está revocado
 * para anon/authenticated (migración 0011).
 */
export async function POST(request: Request) {
  const code = process.env.DEV_PLAN_CODE
  const ownerEmail = process.env.DEV_PLAN_EMAIL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!code || !ownerEmail || !serviceKey || !supabaseUrl) {
    console.error("[dev/plan] faltan DEV_PLAN_CODE, DEV_PLAN_EMAIL o SUPABASE_SERVICE_ROLE_KEY")
    return NextResponse.json({ error: "cambio de plan sin configurar" }, { status: 500 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Sólo la cuenta dueña, aunque alguien adivine el código.
  if ((user.email ?? "").toLowerCase() !== ownerEmail.toLowerCase()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { code?: string; plan?: string } | null
  if (!body || body.code !== code) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 403 })
  }

  const plan = normalizePlan(body.plan)
  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin
    .from("profiles")
    .update({ plan_type: plan, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) {
    console.error("[dev/plan] no se pudo cambiar el plan", error.message)
    return NextResponse.json({ error: "No se pudo cambiar el plan" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan })
}