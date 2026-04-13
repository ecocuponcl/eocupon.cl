import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Leaf, Sparkles, Crown } from "lucide-react"

const plans = [
  {
    name: "Gratis",
    description: "Para empezar a probar",
    price: "0",
    icon: Leaf,
    features: [
      "3 cupones por mes",
      "Generacion basica con IA",
      "Compartir por WhatsApp",
      "Enlace publico",
    ],
    cta: "Comenzar Gratis",
    href: "/auth/registro",
    popular: false,
  },
  {
    name: "Pro",
    description: "Para negocios en crecimiento",
    price: "9.990",
    icon: Sparkles,
    features: [
      "50 cupones por mes",
      "Generacion avanzada con IA",
      "Subir imagenes propias",
      "Publicar en cuponera",
      "Estadisticas basicas",
      "Soporte prioritario",
    ],
    cta: "Suscribirse",
    href: "https://app.reveniu.com/checkout-custom-link/xKK23b48El4xxc6ANca8FfyMlHq43P0N",
    popular: true,
  },
  {
    name: "Business",
    description: "Para empresas y agencias",
    price: "29.990",
    icon: Crown,
    features: [
      "Cupones ilimitados",
      "IA premium y personalizada",
      "API de integracion",
      "Dashboard multiusuario",
      "Estadisticas avanzadas",
      "Soporte dedicado 24/7",
      "Logo y branding custom",
    ],
    cta: "Contactar Ventas",
    href: "https://wa.me/56912345678?text=Hola,%20me%20interesa%20el%20plan%20Business%20de%20EcoCupon",
    popular: false,
  },
]

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">EcoCupon</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/cuponera">Cuponera</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Iniciar Sesion</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Planes y Precios
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elige el plan perfecto para tu negocio. Todos incluyen generacion de cupones con IA.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Mas Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${plan.popular ? "bg-primary" : "bg-secondary"}`}>
                    <plan.icon className={`h-6 w-6 ${plan.popular ? "text-primary-foreground" : "text-secondary-foreground"}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    asChild 
                    className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href={plan.href} target={plan.href.startsWith("http") ? "_blank" : undefined}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-2">Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-muted-foreground">Si, puedes actualizar o cambiar tu plan cuando quieras. Los cambios se aplican inmediatamente.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-2">Que metodos de pago aceptan?</h3>
              <p className="text-muted-foreground">Aceptamos tarjetas de credito, debito y transferencia bancaria a traves de Reveniu.</p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-2">Hay garantia de devolucion?</h3>
              <p className="text-muted-foreground">Si, ofrecemos garantia de devolucion de 30 dias si no estas satisfecho con el servicio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 EcoCupon. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
