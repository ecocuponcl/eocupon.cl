import Link from "next/link"
import type { Metadata } from "next"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"

export const metadata: Metadata = {
  title: "Condiciones del Servicio",
  description:
    "Términos y condiciones de uso de EcoCupon.cl, conforme a la legislación chilena.",
  alternates: { canonical: "/condiciones" },
}

export default function CondicionesPage() {
  return (
    <EcoPage>
      <EcoHeader />

      <main className="eco-section">
        <div className="eco-container">
          <div className="eco-headblock">
            <h1 className="eco-h2">Condiciones del Servicio</h1>
          </div>

          <div className="eco-doc">
            <p className="eco-doc__meta">Última actualización: 14 de julio de 2026</p>

            <section>
              <h2>1. Aceptación</h2>
              <p>
                Al registrarte y usar EcoCupon.cl (en adelante, la &quot;App&quot;) aceptas estas
                Condiciones del Servicio. Si no estás de acuerdo con alguna de ellas, por favor no
                utilices el servicio.
              </p>
            </section>

            <section>
              <h2>2. Descripción del servicio</h2>
              <p>
                EcoCupon.cl permite generar cupones de descuento con su código y su imagen QR,
                subir un logo para identificar tu negocio, compartirlos por WhatsApp y
                publicarlos en la cuponera pública. El servicio se proporciona &quot;tal cual&quot; y
                podemos modificarlo, suspenderlo o interrumpirlo.
              </p>
            </section>

            <section>
              <h2>3. Cuentas y autenticación</h2>
              <ul>
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

            <section>
              <h2>4. Contenido del usuario</h2>
              <p>
                Eres responsable del contenido de tus cupones y de los logos que subes. No publiques
                contenido ilícito, infractor de derechos de propiedad intelectual, discriminatorio o
                fraudulento. Podemos retirar contenido que vulnere lo anterior.
              </p>
            </section>

            <section>
              <h2>5. Planes y pagos</h2>
              <p>
                Las funciones de pago se regirán por el plan contratado en la sección de precios. Los
                precios y la facturación se informan al momento de la contratación. Salvo que se
                indique lo contrario, las tarifas no son reembolsables.
              </p>
            </section>

            <section>
              <h2>6. Protección de datos personales</h2>
              <p>
                El tratamiento de tus datos personales se rige por nuestra{" "}
                <Link href="/privacidad">Política de Privacidad</Link> y por la{" "}
                <strong>Ley N° 19.628</strong>. Al usar la App, consientes el tratamiento descrito
                en dicha política.
              </p>
            </section>

            <section>
              <h2>7. Limitación de responsabilidad</h2>
              <p>
                La App se ofrece sin garantías de disponibilidad ininterrumpida. En la medida
                permitida por la ley chilena, EcoCupon.cl no será responsable por daños indirectos,
                lucro cesante o pérdidas derivadas del uso del servicio.
              </p>
            </section>

            <section>
              <h2>8. Legislación aplicable</h2>
              <p>
                Estas condiciones se interpretan y rigen conforme a las leyes de la República de
                Chile. Para cualquier controversia, las partes se someten a los tribunales competentes
                de acuerdo a la ley chilena.
              </p>
            </section>

            <section>
              <h2>9. Contacto</h2>
              <p>
                Para dudas sobre estas condiciones escríbenos a{" "}
                <a href="mailto:ecocupon.cl@gmail.com">ecocupon.cl@gmail.com</a>.
              </p>
            </section>
          </div>

          <div style={{ marginTop: "var(--space-2xl)" }}>
            <Link href="/" className="eco-btn eco-btn--quiet">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}