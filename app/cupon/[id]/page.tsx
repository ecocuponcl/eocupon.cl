import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, warnIfNoServiceRole } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Copy, MessageCircle, ArrowLeft, Ticket } from "lucide-react"
import { CouponShareButtons } from "@/components/coupon-share-buttons"

// Siempre dinámico: increment_views debe ejecutarse en cada visita (no cachear)
// y el cupón debe leerse fresco de la BD.
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Sin esto, todas las páginas de cupón compartían el título del layout y el
// enlace se veía igual sin importar el negocio. Es el texto que se ve al
// pegar el cupón en WhatsApp.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return { title: "Cupón no encontrado" }
  }

  const reader = createAdminClient()
  const supabase = await createClient()

  const { data } = await (reader ?? supabase)
    .from("coupons")
    .select("title, business_name, discount_percentage")
    .eq("id", id)
    .maybeSingle()

  if (!data) {
    return { title: "Cupón no encontrado" }
  }

  const title = `${data.discount_percentage}% de descuento en ${data.business_name}`
  const description = `${data.title} — cupón de ${data.business_name}, canjeable con código.`

  return {
    title,
    description,
    alternates: { canonical: `/cupon/${id}` },
    openGraph: { title, description, type: "website" },
  }
}

export default async function CouponPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  if (!UUID_RE.test(id)) {
    notFound()
  }

  // El enlace directo debe funcionar también para cupones privados (es el
  // producto: compartes el link con quien quieras). Antes eso obligaba a dejar
  // la policy de SELECT en `using (true)`, que además permitía LISTAR todos los
  // cupones. La migración 0010 la acota, así que la lectura por UUID se hace
  // aquí con service role: el UUID actúa como capacidad y no hay enumeración.
  // Si no hay service key configurada, se cae al cliente normal (RLS).
  const reader = createAdminClient()

  if (!reader) {
    warnIfNoServiceRole("cupon/[id]")
  }

  const { data: coupon, error } = await (reader ?? supabase)
    .from("coupons")
    .select("id, title, description, business_name, discount_percentage, coupon_code, generated_image_url, is_public")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    // PGRST116 = sin filas; cualquier otro código sí es un fallo real.
    console.error("No se pudo leer el cupón:", error.message)
  }

  if (!coupon) {
    notFound()
  }

  // Incrementa vistas vía RPC SECURITY DEFINER (evita abrir UPDATE a anon).
  // Un fallo aquí no debe impedir ver el cupón.
  const { error: viewError } = await supabase.rpc("increment_views", { coupon_id: id })

  if (viewError) {
    console.error("No se pudo incrementar las vistas:", viewError.message)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EcoCupon</span>
          </Link>
          <Link href="/cuponera">
            <Button variant="outline" size="sm">
              Ver más cupones
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/cuponera" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a la cuponera
        </Link>

        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden border-border">
            {/* Coupon Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/30">
              {coupon.generated_image_url ? (
                <img
                  src={coupon.generated_image_url}
                  alt={`Cupón de ${coupon.business_name}: ${coupon.title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl font-bold text-primary">
                    {coupon.discount_percentage}%
                  </span>
                </div>
              )}
              <div className="absolute right-4 top-4 rounded-full bg-primary px-4 py-2 text-lg font-bold text-primary-foreground">
                -{coupon.discount_percentage}% OFF
              </div>
            </div>

            <CardContent className="space-y-6 p-6 md:p-8">
              {/* Title and Business */}
              <div>
                <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                  {coupon.title}
                </h1>
                <p className="text-lg text-muted-foreground">{coupon.business_name}</p>
              </div>

              {/* Description */}
              {coupon.description && (
                <p className="text-muted-foreground">{coupon.description}</p>
              )}

              {/* Coupon Code */}
              <div className="rounded-xl bg-secondary p-6 text-center">
                <p className="mb-2 text-sm font-medium text-secondary-foreground/70">
                  Código de descuento
                </p>
                <p className="mb-3 font-mono text-3xl font-bold text-secondary-foreground">
                  {coupon.coupon_code}
                </p>
                <p className="text-sm text-secondary-foreground/70">
                  Usa este código en tu próxima compra
                </p>
              </div>

              {/* Activar cupón */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-foreground">¿Quieres usar este cupón?</p>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Actívalo con tu nombre y lleva este código al local para canjear tu beneficio.
                </p>
                <Link href={`/cupon/${coupon.id}/activar`}>
                  <Button className="w-full gap-2">
                    <Ticket className="h-4 w-4" />
                    Activar mi cupón
                  </Button>
                </Link>
              </div>

              {/* Share Buttons */}
              <CouponShareButtons
                couponId={coupon.id}
                title={coupon.title}
                code={coupon.coupon_code}
                discount={coupon.discount_percentage}
                imageUrl={coupon.generated_image_url}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Cupón creado con{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              EcoCupon
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
