import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CuponeraGrid } from "@/components/cuponera-grid"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Cuponera",
  description:
    "Cupones de descuento publicados por comercios chilenos. Filtra por negocio y aprovecha las ofertas vigentes.",
  alternates: { canonical: "/cuponera" },
}

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
    <div className="min-h-screen bg-background">
      {couponsError && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            No pudimos cargar la cuponera. Intenta nuevamente en unos segundos.
          </div>
        </div>
      )}

      <SiteHeader
        action={
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/registro">
              <Button size="sm">Crear cupones</Button>
            </Link>
          </div>
        }
      />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Cuponera de Descuentos
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Encuentra los mejores cupones de descuento de negocios locales.
            Ahorra en tus compras favoritas.
          </p>
        </div>
      </section>

      {/* Buscador + cupones */}
      <main className="container mx-auto px-4 py-8">
        <CuponeraGrid coupons={coupons ?? []} />
      </main>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-primary-foreground">
            ¿Tienes un negocio?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-primary-foreground/80">
            Crea cupones de descuento y publícalos en nuestra cuponera para alcanzar más clientes.
          </p>
          <Link href="/auth/registro">
            <Button variant="secondary" size="lg">
              Comenzar gratis
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
