import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import { Leaf, Ticket, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function CuponeraPage() {
  const supabase = await createClient()

  // Fetch public coupons
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EcoCupon</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/registro">
              <Button size="sm">Crear cupones</Button>
            </Link>
          </div>
        </div>
      </header>

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
          <div className="mx-auto flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar cupones..." 
                className="pl-10"
              />
            </div>
            <Button>Buscar</Button>
          </div>
        </div>
      </section>

      {/* Coupons Grid */}
      <main className="container mx-auto px-4 py-12">
        {coupons && coupons.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coupons.map((coupon) => (
              <Link key={coupon.id} href={`/cupon/${coupon.id}`}>
                <Card className="group h-full overflow-hidden border-border transition-all hover:shadow-lg hover:border-primary/30">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {coupon.image_url ? (
                      <Image
                        src={coupon.image_url}
                        alt={coupon.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
                        <span className="text-4xl font-bold text-primary">
                          {coupon.discount_percentage}%
                        </span>
                      </div>
                    )}
                    <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                      -{coupon.discount_percentage}%
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-1 font-semibold text-foreground line-clamp-1 group-hover:text-primary">
                      {coupon.title}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {coupon.business_name}
                    </p>
                    <div className="rounded-lg bg-secondary/50 p-2 text-center">
                      <span className="font-mono text-sm font-bold text-secondary-foreground">
                        {coupon.coupon_code}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            icon={<Ticket className="h-10 w-10" />}
            title="No hay cupones disponibles"
            description="Sé el primero en publicar un cupón de descuento"
            action={
              <Link href="/auth/registro">
                <Button>Crear mi cupón</Button>
              </Link>
            }
          />
        )}
      </main>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-primary-foreground">
            ¿Tienes un negocio?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-primary-foreground/80">
            Crea cupones de descuento con IA y publícalos en nuestra cuponera para alcanzar más clientes.
          </p>
          <Link href="/auth/registro">
            <Button variant="secondary" size="lg">
              Comenzar gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            2024 EcoCupon. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
