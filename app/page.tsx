import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Sparkles, Share2, Download, Zap, Shield, Users } from "lucide-react"

export default function LandingPage() {
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
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Cómo funciona
            </Link>
            <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Beneficios
            </Link>
            <Link href="#precios" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Precios
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/registro">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Potenciado por Inteligencia Artificial
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Crea cupones de descuento <span className="text-primary">irresistibles</span>
            </h1>
            <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
              Genera cupones profesionales con IA, personaliza el diseño y compártelos al instante por WhatsApp o publícalos en nuestra cuponera.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/registro">
                <Button size="lg" className="gap-2 px-8">
                  <Zap className="h-5 w-5" />
                  Crear mi primer cupón
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variant="outline" size="lg" className="px-8">
                  Ver demostración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-secondary" />
                <div className="h-3 w-3 rounded-full bg-primary/60" />
              </div>
              <div className="p-6 md:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="h-10 w-full rounded-lg bg-input" />
                    <div className="h-32 w-full rounded-lg bg-input" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-10 rounded-lg bg-input" />
                      <div className="h-10 rounded-lg bg-input" />
                    </div>
                    <div className="h-12 w-full rounded-lg bg-primary" />
                  </div>
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/10 p-6">
                    <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                      -50%
                    </div>
                    <div className="mt-8 space-y-2">
                      <div className="h-6 w-3/4 rounded bg-foreground/10" />
                      <div className="h-4 w-1/2 rounded bg-foreground/10" />
                    </div>
                    <div className="mt-6 rounded-lg bg-secondary p-3 text-center">
                      <span className="font-mono text-lg font-bold text-secondary-foreground">VERANO50</span>
                    </div>
                    <p className="mt-4 text-center text-sm text-muted-foreground">Usa este código en tu compra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Crea tu cupón en 3 pasos
            </h2>
            <p className="text-lg text-muted-foreground">
              Sin complicaciones, sin diseñadores. Solo describe lo que quieres y la IA hace el resto.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Describe o sube",
                description: "Escribe una descripción o sube una imagen de tu producto. Nuestra IA generará un diseño único.",
                icon: Sparkles,
              },
              {
                step: "2",
                title: "Personaliza",
                description: "Ajusta el descuento, código promocional y nombre de tu negocio. Previsualiza al instante.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Comparte",
                description: "Descarga tu cupón, compártelo por WhatsApp o publícalo directamente en nuestra cuponera.",
                icon: Share2,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden border-border">
                <div className="absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary/30">
                  {item.step}
                </div>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Todo lo que necesitas para promocionar
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { icon: Sparkles, title: "Generación con IA", description: "Imágenes únicas creadas con inteligencia artificial" },
              { icon: Download, title: "Descarga instantánea", description: "Obtén tu cupón en formato imagen listo para usar" },
              { icon: Share2, title: "Comparte fácil", description: "Envía por WhatsApp o copia el link con un clic" },
              { icon: Users, title: "Cuponera pública", description: "Publica en nuestra red y alcanza más clientes" },
              { icon: Shield, title: "Códigos únicos", description: "Genera códigos promocionales seguros y rastreables" },
              { icon: Zap, title: "Rápido y simple", description: "Crea cupones profesionales en menos de un minuto" },
            ].map((benefit) => (
              <div key={benefit.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Planes simples y transparentes
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-8">
                <h3 className="mb-2 text-xl font-semibold text-foreground">Gratis</h3>
                <p className="mb-6 text-muted-foreground">Para probar la plataforma</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="mb-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    5 cupones por mes
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Marca de agua EcoCupon
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Compartir por WhatsApp
                  </li>
                </ul>
                <Link href="/auth/registro">
                  <Button variant="outline" className="w-full">Comenzar gratis</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="relative border-2 border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                Más popular
              </div>
              <CardContent className="p-8">
                <h3 className="mb-2 text-xl font-semibold text-foreground">Pro</h3>
                <p className="mb-6 text-muted-foreground">Para negocios en crecimiento</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$9.990</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="mb-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cupones ilimitados
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sin marca de agua
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Publicar en cuponera
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Analíticas de uso
                  </li>
                </ul>
                <a
                  href="https://app.reveniu.com/checkout-custom-link/xKK23b48El4xxc6ANca8FfyMlHq43P0N"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">Suscribirse</Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Comienza a crear cupones hoy
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Únete a cientos de negocios que ya usan EcoCupon para aumentar sus ventas con promociones inteligentes.
          </p>
          <Link href="/auth/registro">
            <Button size="lg" variant="secondary" className="px-8">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">EcoCupon</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="https://www.ecocupon.cl/pagos" className="hover:text-foreground">Pagos</Link>
              <Link href="#" className="hover:text-foreground">Términos</Link>
              <Link href="#" className="hover:text-foreground">Privacidad</Link>
              <Link href="#" className="hover:text-foreground">Contacto</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 EcoCupon. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
