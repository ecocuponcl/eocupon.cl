import { createClient } from "@supabase/supabase-js"

/**
 * Cliente con service role. SOLO servidor: omite RLS, así que nunca debe usarse
 * para listar ni para leer datos de otro usuario.
 *
 * Existe para un caso concreto: leer UN cupón por UUID cuando la policy de
 * `coupons` ya no permite el listado anónimo (ver migración 0010). El UUID hace
 * de capacidad: quien lo tiene puede ver el cupón, pero no se puede enumerar la
 * tabla.
 *
 * Devuelve null si falta `SUPABASE_SERVICE_ROLE_KEY`, y quien llama debe caer al
 * cliente normal con RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) return null

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Aviso explícito cuando el fallback entra en juego: sin service role, los
 * enlaces a cupones privados dejan de resolverse en silencio.
 */
export function warnIfNoServiceRole(context: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      `[${context}] SUPABASE_SERVICE_ROLE_KEY no está configurada: se usa el cliente con RLS y los cupones privados por enlace directo no se podrán leer.`,
    )
  }
}
