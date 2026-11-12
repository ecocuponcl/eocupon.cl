import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// El layout del dashboard ya maneja la sesión; este subnivel solo protege
// contra acceso directo a rutas de cupones ajenos.
// La verificación de propiedad se hace en cada página, no aquí, para evitar
// una consulta extra por cada subruta.

export default async function CouponDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return <>{children}</>
}
