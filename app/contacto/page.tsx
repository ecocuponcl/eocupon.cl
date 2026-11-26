import Link from "next/link"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"
import { JsonLd } from "@/components/json-ld"
import {
  SITE_EMAIL,
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP,
  breadcrumbJsonLd,
  contactPageJsonLd,
  pageMetadata,
} from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Contacto",
  description:
    "Contacta a EcoCupon por WhatsApp o correo. Respondemos dudas sobre cupones, planes y el uso de la plataforma en Chile.",
  path: "/contacto",
})

const whatsappConMensaje = `${SITE_WHATSAPP}?text=Hola,%20tengo%20una%20consulta%20sobre%20EcoCupon`

export default function ContactoPage() {
  return (
    <EcoPage>
      <JsonLd data={contactPageJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Contacto", path: "/contacto" },
        ])}
      />
      <EcoHeader />

      <main>
        <section className="eco-section" aria-labelledby="contacto-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h1 id="contacto-title" className="eco-h1">
                Contacto
              </h1>
              <p className="eco-lead">
                ¿Tienes dudas sobre los cupones, los planes o tu cuenta? Escríbenos y te
                respondemos.
              </p>
            </div>

            <div style={{ marginTop: "var(--space-2xl)", maxWidth: "40rem" }}>
              <dl className="eco-dl">
                <div className="eco-dl__pair">
                  <dt>WhatsApp</dt>
                  <dd>
                    <a href={whatsappConMensaje}>{SITE_PHONE_DISPLAY}</a> — la vía más rápida para
                    dudas y soporte.
                  </dd>
                </div>
                <div className="eco-dl__pair">
                  <dt>Correo</dt>
                  <dd>
                    <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
                  </dd>
                </div>
                <div className="eco-dl__pair">
                  <dt>Dónde atendemos</dt>
                  <dd>Comercios de todo Chile. El servicio funciona en línea.</dd>
                </div>
                <div className="eco-dl__pair">
                  <dt>Datos personales</dt>
                  <dd>
                    Para ejercer tus derechos sobre tus datos, revisa la{" "}
                    <Link href="/privacidad">Política de Privacidad</Link>.
                  </dd>
                </div>
              </dl>

              <div style={{ marginTop: "var(--space-xl)" }}>
                <a href={whatsappConMensaje} className="eco-btn eco-btn--primary">
                  Escribir por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="eco-section--s" aria-labelledby="que-es-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="que-es-title" className="eco-h2">
                Qué es EcoCupon
              </h2>
              <p className="eco-body">
                EcoCupon es una plataforma en línea para comercios chilenos: creas un cupón con
                descuento, código y QR, lo compartes por WhatsApp o como imagen, y ves cuántas
                personas lo vieron y lo compartieron.
              </p>
            </div>
            <div style={{ marginTop: "var(--space-xl)" }}>
              <Link href="/precios" className="eco-btn">
                Ver planes y precios
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}