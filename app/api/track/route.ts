import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// POST /api/track
//
// Registra eventos de métricas (vistas y compartidos) desde el servidor.
// Usa el cliente admin (service role) para bypassear el GRANT EXECUTE que
// fue revocado a anon en la migración 0014.
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type TrackBody = {
  coupon_id?: string
  event?: "share" | "view"
}

export async function POST(req: NextRequest) {
  let body: TrackBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { coupon_id, event } = body

  if (!coupon_id || !UUID_RE.test(coupon_id)) {
    return NextResponse.json({ error: "coupon_id inválido" }, { status: 400 })
  }

  if (event !== "share" && event !== "view") {
    return NextResponse.json({ error: "event debe ser 'share' o 'view'" }, { status: 400 })
  }

  // Usar admin (service role) para ejecutar las RPCs SECURITY DEFINER.
  // Después de la migración 0014, el GRANT EXECUTE a anon fue revocado:
  // solo service_role y authenticated pueden invocarlas.
  // Si no hay service role key configurada, caemos al cliente servidor normal
  // (que usa el rol autenticado del usuario si hay sesión, o anon si no la hay).
  const admin = createAdminClient()
  const supabase = admin ?? (await createClient())

  const rpcName = event === "share" ? "increment_shares" : "increment_views"
  const { error } = await supabase.rpc(rpcName, { coupon_id })

  if (error) {
    // El contador es métrica secundaria: si falla no bloqueamos el UX.
    console.error(`[track] ${rpcName} falló para ${coupon_id}:`, error.message)
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
