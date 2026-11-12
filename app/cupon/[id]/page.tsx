import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, warnIfNoServiceRole } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Ticket, CalendarClock } from "lucide-react"
import { CouponShareButtons } from "@/components/coupon-share-buttons"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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
    .select("id, title, description, business_name, discount_percentage, coupon_code, generated_image_url, is_public, conditions, expires_campaign_at, redemption_period")
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

  const isExpired =
    coupon.expires_campaign_at ? new Date() > new Date(coupon.expires_campaign_at) : false

  const periodLabel: Record<string, string> = {
    once: "canje único por persona",
    daily: "1 canje por día",
    weekly: "1 canje por semana",
    monthly: "1 canje por mes",
    unlimited: "canjes ilimitados",
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        action={
          <Link href="/cuponera">
            <Button variant="outline" size="sm">Ver más cupones</Button>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/cuponera" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a la cuponera
        </Link>

        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden border-border">
            {/* Imagen del cupón */}
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
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <span className="rounded-full bg-destructive px-5 py-2 text-sm font-bold text-destructive-foreground">
                    Cupón vencido
                  </span>
                </div>
              )}
            </div>

            <CardContent className="space-y-6 p-6 md:p-8">
              {/* Título y negocio */}
              <div>
                <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                  {coupon.title}
                </h1>
                <p className="text-lg text-muted-foreground">{coupon.business_name}</p>
              </div>

              {/* Descripción */}
              {coupon.description && (
                <p className="text-muted-foreground">{coupon.description}</p>
              )}

              {/* Vigencia y política */}
              {(coupon.expires_campaign_at || coupon.redemption_period) && (
                <div className="flex flex-wrap gap-3">
                  {coupon.expires_campaign_at && (
                    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                      isExpired
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-primary/30 bg-primary/5 text-primary"
                    }`}>
                      <CalendarClock className="h-3.5 w-3.5" />
                      {isExpired ? "Venció el " : "Válido hasta "}
                      {new Date(coupon.expires_campaign_at).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  {coupon.redemption_period && coupon.redemption_period !== "once" && (
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
                      {periodLabel[coupon.redemption_period] ?? coupon.redemption_period}
                    </div>
                  )}
                </div>
              )}

              {/* Código */}
              <div className="rounded-xl bg-secondary p-6 text-center">
                <p className="mb-2 text-sm font-medium text-secondary-foreground/70">
                  Código de descuento
                </p>
                <p className="mb-3 font-mono text-3xl font-bold text-secondary-foreground">
                  {coupon.coupon_code}
                </p>
                <p className="text-sm text-secondary-foreground/70">
                  Presenta este código al momento de tu compra
                </p>
              </div>

              {/* Condiciones */}
              {coupon.conditions && (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Condiciones
                  </p>
                  <p className="text-sm text-muted-foreground">{coupon.conditions}</p>
                </div>
              )}

              {/* Activar cupón */}
              {!isExpired && (
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
              )}

              {/* Compartir */}
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

      <SiteFooter />
    </div>
  )
}
