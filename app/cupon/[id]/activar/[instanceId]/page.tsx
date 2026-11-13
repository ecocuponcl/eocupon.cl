// Página recuperable: el consumidor puede volver a ver su código de activación
// con solo guardar o compartir esta URL.
// El instanceId actúa como capacidad (igual que el UUID del cupón privado).
// No requiere sesión ni datos personales: quien tiene la URL, tiene el código.

import { notFound } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CopyCodeButton } from "@/components/copy-code-button"
import { CheckCircle2, ArrowLeft, CalendarClock } from "lucide-react"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PageProps {
  params: Promise<{ id: string; instanceId: string }>
}

export default async function InstanceRecuperablePage({ params }: PageProps) {
  const { id, instanceId } = await params

  if (!UUID_RE.test(id) || !UUID_RE.test(instanceId)) notFound()

  const admin = createAdminClient()
  const supabase = await createClient()
  const reader = admin ?? supabase

  // Leer instancia y verificar que pertenece al cupón de la URL
  const { data: instance } = await reader
    .from("coupon_instances")
    .select("id, consumer_name, consumer_phone, activated_at, expires_at, is_active, coupon_id")
    .eq("id", instanceId)
    .eq("coupon_id", id)
    .maybeSingle()

  if (!instance || !instance.is_active) notFound()

  // Leer datos del cupón para contexto
  const { data: coupon } = await reader
    .from("coupons")
    .select("title, business_name, coupon_code, discount_percentage")
    .eq("id", id)
    .maybeSingle()

  if (!coupon) notFound()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        action={
          <Link href={`/cupon/${id}`}>
            <Button variant="outline" size="sm">Ver cupón</Button>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-10 md:py-16">
        <Link
          href={`/cupon/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al cupón
        </Link>

        <div className="mx-auto max-w-md">
          <Card className="overflow-hidden border-border">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Tu cupón activo
              </h1>
              <p className="mb-6 text-muted-foreground">
                Hola <span className="font-semibold text-foreground">{instance.consumer_name}</span>,
                tu cupón de <span className="font-semibold text-foreground">{coupon.business_name}</span> está activo.
              </p>

              {/* Beneficio */}
              <div className="mb-4 rounded-xl bg-secondary p-4">
                <p className="text-sm font-medium text-muted-foreground">Beneficio</p>
                <p className="mt-1 text-lg font-bold text-secondary-foreground">
                  {coupon.discount_percentage}% de descuento — {coupon.title}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-muted-foreground">
                  Código: {coupon.coupon_code}
                </p>
              </div>

              {/* Código de activación */}
              <div className="mb-4 rounded-xl bg-muted p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tu código de activación
                </p>
                <p className="break-all font-mono text-sm font-bold text-foreground">
                  {instance.id}
                </p>
              </div>

              {/* Vigencia */}
              {instance.expires_at && (
                <div className="mb-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Válido hasta{" "}
                  {new Date(instance.expires_at).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Muestra esta pantalla en el local para canjear tu beneficio.
                  Guarda esta URL para volver cuando quieras.
                </p>
                <CopyCodeButton code={instance.id} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
