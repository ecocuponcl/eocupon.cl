import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, warnIfNoServiceRole } from "@/lib/supabase/admin"
import { SITE_URL } from "@/lib/site-url"
import { ArrowLeft, CalendarClock, Ticket } from "lucide-react"
import { CouponShareButtons } from "@/components/coupon-share-buttons"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"

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
    .select("title, business_name, discount_percentage, coupon_code, logo_url")
    .eq("id", id)
    .maybeSingle()

  if (!data) {
    return { title: "Cupón no encontrado" }
  }

  const title = `${data.discount_percentage}% de descuento en ${data.business_name}`
  const description = `${data.title} — cupón de ${data.business_name}, canjeable con código.`

  // Construimos la URL de la imagen del cupón para que WhatsApp (y cualquier
  // scraper de OG) la descargue directamente. Se necesita una URL absoluta;
  // usamos SITE_URL para que funcione tanto en producción como en staging.
  const ogImageParams = new URLSearchParams({
    title: data.title,
    business: data.business_name,
    code: data.coupon_code,
    discount: String(data.discount_percentage),
    ...(data.logo_url ? { logo: data.logo_url } : {}),
    url: `${SITE_URL}/cupon/${id}`,
  })
  const ogImageUrl = `${SITE_URL}/api/coupon-image?${ogImageParams.toString()}`

  return {
    title,
    description,
    alternates: { canonical: `/cupon/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImageUrl, width: 800, height: 600, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
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
    .select("id, title, description, business_name, discount_percentage, coupon_code, generated_image_url, logo_url, is_public, conditions, expires_campaign_at, redemption_period")
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

  // La imagen se genera on demand, así que ningún cupón queda sin ella aunque no
  // tenga `generated_image_url` guardada. La misma URL sirve para mostrarla y
  // para compartirla; el QR de la imagen apunta a este cupón.
  const shareImageUrl =
    coupon.generated_image_url ??
    `${SITE_URL}/api/coupon-image?${new URLSearchParams({
      title: coupon.title,
      business: coupon.business_name,
      code: coupon.coupon_code,
      discount: String(coupon.discount_percentage),
      ...(coupon.logo_url ? { logo: coupon.logo_url } : {}),
      url: `${SITE_URL}/cupon/${coupon.id}`,
    }).toString()}`

  const periodLabel: Record<string, string> = {
    once: "canje único por persona",
    daily: "1 canje por día",
    weekly: "1 canje por semana",
    monthly: "1 canje por mes",
    unlimited: "canjes ilimitados",
  }

  return (
    <EcoPage>
      <EcoHeader />

      <main className="eco-section--s">
        <div className="eco-container">
          <div style={{ maxWidth: "46rem", marginInline: "auto" }}>
            <Link href="/cuponera" className="eco-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a la cuponera
            </Link>
          </div>

          <article className="eco-coupon">
            <div className="eco-coupon__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareImageUrl}
                alt={`Cupón de ${coupon.business_name}: ${coupon.title}`}
              />
              <span className="eco-coupon__tag">-{coupon.discount_percentage}% OFF</span>
              {isExpired && (
                <div className="eco-coupon__expired">
                  <span>Cupón vencido</span>
                </div>
              )}
            </div>

            <div className="eco-coupon__body">
              <div>
                <h1 className="eco-coupon__title">{coupon.title}</h1>
                <p className="eco-coupon__biz">{coupon.business_name}</p>
              </div>

              {coupon.description && <p className="eco-coupon__desc">{coupon.description}</p>}

              {(coupon.expires_campaign_at || coupon.redemption_period) && (
                <div className="eco-chips">
                  {coupon.expires_campaign_at && (
                    <span className={isExpired ? "eco-chip eco-chip--warn" : "eco-chip"}>
                      <CalendarClock size={15} aria-hidden="true" />
                      {isExpired ? "Venció el " : "Válido hasta "}
                      {new Date(coupon.expires_campaign_at).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {coupon.redemption_period && coupon.redemption_period !== "once" && (
                    <span className="eco-chip">
                      {periodLabel[coupon.redemption_period] ?? coupon.redemption_period}
                    </span>
                  )}
                </div>
              )}

              <div className="eco-coupon__code">
                <p className="eco-coupon__code-label">Código de descuento</p>
                <p className="eco-coupon__code-value">{coupon.coupon_code}</p>
                <p className="eco-coupon__code-hint">Presenta este código al momento de tu compra</p>
              </div>

              {coupon.conditions && (
                <div className="eco-note">
                  <span className="eco-note__label">Condiciones</span>
                  <p>{coupon.conditions}</p>
                </div>
              )}

              {!isExpired && (
                <div className="eco-activate">
                  <p className="eco-activate__head">
                    <Ticket size={20} aria-hidden="true" />
                    ¿Quieres usar este cupón?
                  </p>
                  <p>
                    Actívalo con tu nombre y lleva este código al local para canjear tu beneficio.
                  </p>
                  <Link href={`/cupon/${coupon.id}/activar`} className="eco-btn eco-btn--primary">
                    <Ticket size={18} aria-hidden="true" />
                    Activar mi cupón
                  </Link>
                </div>
              )}

              <CouponShareButtons
                couponId={coupon.id}
                url={`${SITE_URL}/cupon/${coupon.id}`}
                title={coupon.title}
                code={coupon.coupon_code}
                discount={coupon.discount_percentage}
                imageUrl={shareImageUrl}
              />
            </div>
          </article>
        </div>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}