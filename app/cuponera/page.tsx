import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { CuponeraGrid } from "@/components/cuponera-grid"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Cuponera de descuentos",
  description:
    "Cupones de descuento vigentes de comercios chilenos, con su código y su QR. Filtra por negocio y presenta el cupón al comprar.",
  path: "/cuponera",
})

export default async function CuponeraPage() {
  const supabase = await createClient()

  // Fetch public coupons
  const { data: coupons, error: couponsError } = await supabase
    .from("coupons")
    .select("id, title, business_name, coupon_code, discount_percentage, generated_image_url, is_public, views, shares_count, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50)

  if (couponsError) {
    console.error("Error al cargar la cuponera:", couponsError.message)
  }

  return (
    <EcoPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Cuponera", path: "/cuponera" },
        ])}
      />
      {coupons && coupons.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            coupons.map((coupon) => ({
              name: `${coupon.business_name}: ${coupon.title}`,
              path: `/cupon/${coupon.id}`,
            })),
          )}
        />
      )}
      <EcoHeader />

      <main>
        <section className="eco-section" aria-labelledby="cuponera-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h1 id="cuponera-title" className="eco-h2">
                Cuponera de descuentos
              </h1>
              <p className="eco-lead">
                Cupones de negocios locales, cada uno con su código. Elige uno y preséntalo al comprar.
              </p>
            </div>

            {couponsError && (
              <div className="eco-note" role="alert" style={{ marginTop: "var(--space-lg)" }}>
                <p>No pudimos cargar la cuponera. Intenta nuevamente en unos segundos.</p>
              </div>
            )}

            <div style={{ marginTop: "var(--space-2xl)" }}>
              <CuponeraGrid coupons={coupons ?? []} />
            </div>
          </div>
        </section>

        <section className="eco-section--s" aria-labelledby="como-usar-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="como-usar-title" className="eco-h2">
                ¿Cómo se usa un cupón de la cuponera?
              </h2>
              <p className="eco-body">
                Cada cupón de la cuponera es un descuento publicado por un comercio chileno. No
                necesitas cuenta para verlo ni para compartirlo: abres el cupón, muestras el código
                en el local y listo.
              </p>
            </div>
            <dl className="eco-dl" style={{ marginTop: "var(--space-2xl)" }}>
              <div className="eco-dl__pair">
                <dt>Elige el cupón</dt>
                <dd>Filtra por negocio y abre la oferta que te sirva.</dd>
              </div>
              <div className="eco-dl__pair">
                <dt>Muestra el código</dt>
                <dd>El cupón trae un código y un QR que el comercio usa para validarlo.</dd>
              </div>
              <div className="eco-dl__pair">
                <dt>Compártelo</dt>
                <dd>Mándalo por WhatsApp o descárgalo como imagen para regalarlo.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="eco-close" aria-labelledby="cuponera-cta-title">
          <div className="eco-container eco-close__grid">
            <div className="eco-headblock">
              <h2 id="cuponera-cta-title" className="eco-h2">
                ¿Tienes un negocio?
              </h2>
              <p className="eco-close__line">
                Crea cupones de descuento y publícalos en la cuponera para alcanzar más clientes.
              </p>
            </div>
            <div>
              <Link href="/auth/registro" className="eco-btn">
                Comenzar gratis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}