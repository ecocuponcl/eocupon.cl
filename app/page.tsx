import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Sparkles, Share2, Download, Zap, Shield, Users, Ticket, QrCode, MessageCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Cupones de descuento para tu negocio",
  description:
    "Crea cupones de descuento para tu comercio, compártelos por WhatsApp y publícalos en la cuponera de EcoCupon. Gratis para empezar.",
  alternates: { canonical: "/" },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            {/* La marca se oculta en pantallas muy estrechas: con el texto, el
                logo y los dos botones no caben en 375 px y la página desbordaba. */}
            <span className="hidden text-xl font-bold text-foreground sm:inline">EcoCupon</span>
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
          <div className="flex items-center gap-2">
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
              <Ticket className="h-4 w-4" />
              Imagen, enlace y código QR en un solo paso
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
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
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary/75 px-6 py-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-background p-1.5">
                  <Image
                    src="/marca/4time-logo.png"
                    alt="4Time Repuestos"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-primary-foreground">
                  <p className="font-semibold leading-tight">4Time Repuestos</p>
                  <p className="text-xs opacity-90">Repuestos para tu vehículo</p>
                </div>
              </div>

              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src="/marca/4time-producto.jpg"
                  alt="Producto en promoción de 4Time Repuestos"
                  width={768}
                  height={576}
                  sizes="(max-width: 768px) 90vw, 384px"
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  -10%
                </span>
              </div>

              <div className="space-y-4 p-5">
                <div className="text-center">
                  <p className="text-2xl font-bold leading-tight text-foreground">
                    10% de descuento
                  </p>
                  <p className="text-sm text-muted-foreground">
                    en tu primera compra
                  </p>
                </div>

                <div className="rounded-xl bg-secondary p-4 text-center">
                  <p className="text-xs font-medium text-secondary-foreground/70">
                    Código de descuento
                  </p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-secondary-foreground">
                    HOLA4TIME
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-foreground/5">
                    <QrCode className="h-8 w-8 text-foreground/60" />
                  </div>
                  <p className="text-sm leading-snug text-muted-foreground">
                    Escanea el QR o comparte el enlace. Válido en la primera compra.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </div>
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-foreground">
                    <Download className="h-4 w-4" />
                    Imagen
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
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="mb-8 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    3 cupones por mes
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
                    50 cupones por mes
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Logo de tu negocio
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Publicar en cuponera
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Vistas y compartidos
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
              <Link href="/precios" className="hover:text-foreground">Precios</Link>
              <Link href="/condiciones" className="hover:text-foreground">Términos</Link>
              <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
              <Link href="/cuponera" className="hover:text-foreground">Cuponera</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EcoCupon. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
