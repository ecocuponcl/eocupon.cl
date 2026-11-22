import type { Metadata } from "next"
import Link from "next/link"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"

export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Planes de EcoCupon para comercios: empieza gratis y sube a Pro o Business cuando lo necesites.",
  alternates: { canonical: "/precios" },
}

const plans = [
  {
    name: "Gratis",
    description: "Para empezar a probar",
    price: "$0",
    suffix: "/mes",
    note: "7 días de Pro al registrarte, sin tarjeta",
    features: [
      "3 cupones por mes",
      "Imagen con QR y código",
      "Compartir por WhatsApp",
      "Cuponera pública",
    ],
    cta: "Comenzar gratis",
    href: "/auth/registro",
    external: false,
    featured: false,
  },
  {
    name: "Pro",
    description: "Para negocios en crecimiento",
    price: "$9.000",
    suffix: "/mes + IVA",
    note: "o $80.000 al año + IVA (2 meses gratis)",
    features: [
      "50 cupones por mes",
      "Logo de tu negocio en el cupón",
      "Cuponera pública",
      "Soporte por WhatsApp",
    ],
    cta: "Suscribirme",
    href: "/dashboard/cuenta",
    external: false,
    featured: true,
  },
  {
    name: "Business",
    description: "Para empresas y agencias",
    price: "$29.990",
    suffix: "/mes + IVA",
    note: "",
    features: [
      "Cupones ilimitados",
      "Cupones con tu logo",
      "Atención por WhatsApp",
      "Acompañamiento personalizado",
      "Soporte dedicado",
    ],
    cta: "Contactar ventas",
    href: "https://wa.me/56979540471?text=Hola,%20me%20interesa%20el%20plan%20Business%20de%20EcoCupon",
    external: true,
    featured: false,
  },
]

const faq = [
  {
    q: "¿Puedo cambiar o cancelar mi plan?",
    a: "Sí. El cambio o la cancelación se gestiona por WhatsApp y aplica al periodo siguiente; no pierdes lo que ya pagaste.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjetas de crédito y débito a través de Flow, con cobro automático cada mes. La boleta sale con el RUT de tu comercio.",
  },
  {
    q: "¿Hay garantía de devolución?",
    a: "Sí: 30 días de garantía si el servicio no te sirve.",
  },
  {
    q: "¿Necesito tarjeta para la prueba?",
    a: "No. Al registrarte tienes 7 días de Pro sin tarjeta, y al terminar sigues en el plan Gratis.",
  },
]

export default function PreciosPage() {
  return (
    <EcoPage>
      <EcoHeader />

      <main>
        <section className="eco-section" aria-labelledby="precios-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h1 id="precios-title" className="eco-h1">
                Planes y precios
              </h1>
              <p className="eco-lead">
                Elige el plan para tu negocio. Todos incluyen cupones con imagen, código y QR.
              </p>
            </div>

            <div className="eco-plans" style={{ marginTop: "var(--space-2xl)" }}>
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={plan.featured ? "eco-plan eco-plan--featured" : "eco-plan"}
                >
                  <div className="eco-plan__head">
                    <h2 className="eco-plan__name">{plan.name}</h2>
                    {plan.featured ? <span className="eco-plan__tag">Más popular</span> : null}
                  </div>
                  <p className="eco-plan__for">{plan.description}</p>
                  <div>
                    <p className="eco-plan__price">
                      {plan.price}
                      <small> {plan.suffix}</small>
                    </p>
                    {plan.note ? <p className="eco-plan__note">{plan.note}</p> : null}
                  </div>
                  <ul className="eco-plan__list">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <div className="eco-plan__action">
                    <Link
                      href={plan.href}
                      className={plan.featured ? "eco-btn eco-btn--primary" : "eco-btn"}
                      target={plan.external ? "_blank" : undefined}
                      rel={plan.external ? "noopener noreferrer" : undefined}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="eco-faq">
              <h2 className="eco-faq__title">Preguntas frecuentes</h2>
              <div className="eco-faq__list">
                {faq.map((item) => (
                  <details key={item.q} className="eco-faq__item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}