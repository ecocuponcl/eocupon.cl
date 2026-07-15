import Link from "next/link"
import type { Metadata } from "next"
import { Leaf } from "lucide-react"

export const metadata: Metadata = {
  title: "Condiciones del Servicio - EcoCupon",
  description: "Términos y condiciones de uso de EcoCupon.",
}

export default function CondicionesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">EcoCupon</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Condiciones del Servicio</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Última actualización: 14 de julio de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Aceptación</h2>
            <p>
              Al registrarte y usar EcoCupon (la &quot;App&quot;) aceptas estas Condiciones del
              Servicio. Si no estás de acuerdo con alguna, por favor no utilices el servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Descripción del servicio</h2>
            <p>
              EcoCupon permite generar cupones de descuento personalizados con inteligencia
              artificial, subir un logo para identificar tu negocio, compartirlos por WhatsApp y
              publicarlos en la cuponera pública. El servicio se proporciona &quot;tal cual&quot; y
              podemos modificarlo o suspenderlo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Cuentas</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>
                Si inicias sesión con Google, aceptas que el acceso se gestione según las
                condiciones de ese proveedor.
              </li>
              <li>
                Nos reservamos el derecho de suspender cuentas que infrinjan estas condiciones o
                la ley.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Contenido del usuario</h2>
            <p>
              Eres responsable del contenido de tus cupones y de los logos que subes. No publiques
              contenido ilegal, infractor de derechos de terceros o fraudulento. Podemos retirar
              contenido que vulnere lo anterior.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Planes y pagos</h2>
            <p>
              Las funciones de pago se regirán por el plan contratado. Los precios y la facturación
              se informan en la sección de precios. Salvo que se indique lo contrario, las tarifas
              no son reembolsables.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Limitación de responsabilidad</h2>
            <p>
              La App se ofrece sin garantías de disponibilidad ininterrumpida. En la medida
              permitida por la ley, EcoCupon no será responsable por daños indirectos derivados del
              uso del servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Contacto</h2>
            <p>
              Para dudas sobre estas condiciones escríbenos a{" "}
              <a
                href="mailto:ecocupon.cl@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                ecocupon.cl@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
