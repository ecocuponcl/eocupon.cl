import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

/**
 * Confirma un enlace de correo sin depender del navegador donde se inició el
 * registro.
 *
 * `/auth/callback` canjea un `code`, y ese canje usa PKCE: necesita la cookie
 * con el verificador que se guardó al iniciar el flujo. Si el usuario abre el
 * correo en el móvil o en otro navegador —lo normal—, la cookie no está y
 * Supabase responde "invalid flow state, flow state has expired".
 *
 * `token_hash` no depende de esa cookie, así que verificar aquí funciona en
 * cualquier dispositivo. Requiere que la plantilla del correo enlace a
 * `/auth/confirm?token_hash={{ .TokenHash }}&type=signup`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  // El reseteo de contraseña debe caer en el formulario, no en el panel.
  const next =
    searchParams.get("next") ?? (type === "recovery" ? "/auth/nueva-contraseña" : "/dashboard")

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      // Solo rutas internas: un `next` externo sería un redirect abierto.
      const destino = next.startsWith("/") ? next : "/dashboard"
      return NextResponse.redirect(`${origin}${destino}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}