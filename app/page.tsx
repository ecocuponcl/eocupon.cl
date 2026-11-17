import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Share2, Download, Zap, Shield, Users, Ticket, Check } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ReelPlayer } from "@/components/reel-player"

export const metadata: Metadata = {
  title: "Cupones de descuento para tu negocio",
  description:
    "Crea cupones de descuento para tu comercio, compártelos por WhatsApp y publícalos en la cuponera de EcoCupon. Gratis para empezar.",
  alternates: { canonical: "/" },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
              <Ticket className="h-4 w-4" />
              Imagen, enlace y código QR en un solo paso
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground lg:text-5xl xl:text-6xl">
              Tu oferta lista para <span className="text-primary">compartir</span>
            </h1>
            <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
              Crea un cupón con el descuento, el código y el QR de tu negocio, y mándalo por WhatsApp en dos minutos.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/registro">
                <Button size="lg" className="gap-2 px-8">
                  <Zap className="h-5 w-5" />
                  Crear mi primer cupón
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="px-8">
                  Ver demostración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo: el cupón se arma y se comparte, animado */}
      <section id="demo" className="scroll-mt-20 border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Mira el cupón en movimiento
            </h2>
            <p className="text-lg text-muted-foreground">
              Quince segundos en cinco planos: el cupón se arma paso a paso, se comparte por
              WhatsApp y los contadores de vistas y compartidos se mueven.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <ReelPlayer />
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
              Sin complicaciones y sin diseñador: tú defines la oferta, el cupón se arma solo.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Describe o sube",
                description: "Elige el descuento, el nombre del negocio y el código que quieras usar. Sin plantillas que rellenar.",
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
              { icon: Sparkles, title: "Imagen lista para usar", description: "Tu cupón en PNG con el código y el QR, sin diseñar nada" },
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
                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  7 días de Pro al registrarte, sin tarjeta
                </p>
                <ul className="mb-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    3 cupones por mes
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    Imagen con código QR
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    Compartir por WhatsApp
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    Cuponera pública
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
                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">$9.000</span>
                  <span className="text-muted-foreground">/mes + IVA</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  o $80.000 al año + IVA (2 meses gratis)
                </p>
                <ul className="mb-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    50 cupones por mes
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    Logo de tu negocio en el cupón
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    Soporte por WhatsApp
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
            Crea tu cupón, compártelo por WhatsApp y mide cuánta gente lo vio y lo reenvió.
          </p>
          <Link href="/auth/registro">
            <Button size="lg" variant="secondary" className="px-8">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
