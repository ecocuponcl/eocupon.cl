import Link from "next/link"
import type { Metadata } from "next"
import { Leaf } from "lucide-react"

export const metadata: Metadata = {
  title: "Condiciones del Servicio - EcoCupon",
  description:
    "Términos y condiciones de uso de EcoCupon.cl, conforme a la legislación chilena.",
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
              Al registrarte y usar EcoCupon.cl (en adelante, la &quot;App&quot;) aceptas estas
              Condiciones del Servicio. Si no estás de acuerdo con alguna de ellas, por favor no
              utilices el servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Descripción del servicio</h2>
            <p>
              EcoCupon.cl permite generar cupones de descuento personalizados con inteligencia
              artificial, subir un logo para identificar tu negocio, compartirlos por WhatsApp y
              publicarlos en la cuponera pública. El servicio se proporciona &quot;tal cual&quot; y
              podemos modificarlo, suspenderlo o interrumpirlo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Cuentas y autenticación</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>
                Si inicias sesión con Google u otro proveedor, aceptas que el acceso se gestione
                según las condiciones de ese proveedor y la{" "}
                <strong>Ley N° 19.628</strong> sobre Protección de la Vida Privada.
              </li>
              <li>
                Podemos suspender cuentas que infrinjan estas condiciones, la ley chilena o derechos
                de terceros.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Contenido del usuario</h2>
            <p>
              Eres responsable del contenido de tus cupones y de los logos que subes. No publiques
              contenido ilícito, infractor de derechos de propiedad intelectual, discriminatorio o
              fraudulento. Podemos retirar contenido que vulnere lo anterior.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Planes y pagos</h2>
            <p>
              Las funciones de pago se regirán por el plan contratado en la sección de precios. Los
              precios y la facturación se informan al momento de la contratación. Salvo que se
              indique lo contrario, las tarifas no son reembolsables.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              6. Protección de datos personales
            </h2>
            <p>
              El tratamiento de tus datos personales se rige por nuestra{" "}
              <Link href="/privacidad" className="font-medium text-primary hover:underline">
                Política de Privacidad
              </Link>{" "}
              y por la <strong>Ley N° 19.628</strong>. Al usar la App, consientes el tratamiento
              descrito en dicha política.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              7. Limitación de responsabilidad
            </h2>
            <p>
              La App se ofrece sin garantías de disponibilidad ininterrumpida. En la medida
              permitida por la ley chilena, EcoCupon.cl no será responsable por daños indirectos,
              lucro cesante o pérdidas derivadas del uso del servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Legislación aplicable</h2>
            <p>
              Estas condiciones se interpretan y rigen conforme a las leyes de la República de
              Chile. Para cualquier controversia, las partes se someten a los tribunales competentes
              de acuerdo a la ley chilena.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Contacto</h2>
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
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
