import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session) {
      // Sincronizar business_name desde user_metadata → profiles.
      // El trigger handle_new_user solo escribe id y email; el nombre del negocio
      // llega en user_metadata y nunca se copiaba a profiles.
      const businessName = session.user.user_metadata?.business_name as string | undefined
      if (businessName) {
        await supabase
          .from('profiles')
          .update({ business_name: businessName })
          .eq('id', session.user.id)
        // Si falla no bloqueamos el login: el usuario entra igual y el nombre
        // aparece desde user_metadata en el dashboard.
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
