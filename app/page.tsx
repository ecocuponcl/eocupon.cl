import type { Metadata } from "next"
import Link from "next/link"
import { EcoPage } from "@/components/eco-page"
import { EcoHeader } from "@/components/eco-header"
import { EcoFooter } from "@/components/eco-footer"
import { ReelPlayer } from "@/components/reel-player"

export const metadata: Metadata = {
  title: "Cupones de descuento para tu negocio",
  description:
    "Crea cupones de descuento para tu comercio, compártelos por WhatsApp y publícalos en la cuponera de EcoCupon. Gratis para empezar.",
  alternates: { canonical: "/" },
}

const steps = [
  {
    title: "Elige la oferta",
    line: "Elige el descuento, el código y el nombre de tu negocio.",
    detail: "20 %",
  },
  {
    title: "El cupón se arma",
    line: "La imagen sale con el código y el QR puestos, sin diseñar nada.",
    detail: "TARDE15",
  },
  {
    title: "Compártelo",
    line: "Descárgalo o mándalo por WhatsApp, y publícalo en la cuponera.",
    detail: "ecocupon.cl",
  },
]

const specs = [
  { name: "Imagen lista para usar", line: "Tu cupón en PNG con el código y el QR, sin diseñar nada." },
  { name: "Descarga instantánea", line: "Baja el cupón como imagen, listo para usar." },
  { name: "Comparte fácil", line: "Mándalo por WhatsApp o copia el enlace con un clic." },
  { name: "Cuponera pública", line: "Publícalo en la cuponera y alcanza más clientes." },
  { name: "Códigos únicos", line: "Cada cupón lleva su propio código, rastreable." },
  { name: "Rápido y simple", line: "El cupón queda listo antes de que cierres la pantalla." },
]

const plans = [
  {
    name: "Gratis",
    audience: "Para probar la plataforma",
    price: "$0",
    suffix: "/mes",
    note: "7 días de Pro al registrarte, sin tarjeta",
    features: ["3 cupones por mes", "Imagen con código QR", "Compartir por WhatsApp", "Cuponera pública"],
    cta: "Comenzar gratis",
    href: "/auth/registro",
    external: false,
    featured: false,
  },
  {
    name: "Pro",
    audience: "Para negocios en crecimiento",
    price: "$9.000",
    suffix: "/mes + IVA",
    note: "o $80.000 al año + IVA (2 meses gratis)",
    features: ["50 cupones por mes", "Logo de tu negocio en el cupón", "Soporte por WhatsApp"],
    cta: "Suscribirse",
    href: "/dashboard/cuenta",
    external: false,
    featured: true,
  },
  {
    name: "Business",
    audience: "Para empresas y agencias",
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
    q: "¿Cuánto cuesta empezar?",
    a: "Gratis: 3 cupones al mes con imagen, código QR y enlace. El plan Pro suma 50 cupones y el logo de tu negocio.",
  },
  {
    q: "¿Necesito tarjeta para la prueba?",
    a: "No. Al registrarte tienes 7 días de Pro sin tarjeta, y al terminar sigues en el plan Gratis.",
  },
  {
    q: "¿Cómo comparto el cupón?",
    a: "Descárgalo como imagen o mándalo por WhatsApp. También queda en la cuponera, con su enlace y su QR apuntando al mismo cupón.",
  },
  {
    q: "¿Los cupones son distintos entre sí?",
    a: "Sí: cada cupón lleva su propio código, y ves cuántas veces se vio y cuántas se compartió.",
  },
  {
    q: "¿Puedo poner el logo de mi negocio?",
    a: "Sí. En Pro y en Business el cupón sale con el logo de tu comercio.",
  },
]

export default function LandingPage() {
  return (
    <EcoPage>
      <EcoHeader />

      <main>
        {/* Hero · Stage: la copia a la izquierda, el cupón real sobre su bandeja */}
        <section className="eco-hero" aria-labelledby="hero-title">
          <div className="eco-container eco-hero__grid">
            <div className="eco-hero__copy">
              <h1 id="hero-title" className="eco-h1">
                Tu oferta lista para compartir
              </h1>
              <p className="eco-lead">
                Crea tu cupón y mándalo por WhatsApp en dos minutos.
              </p>
              <div className="eco-hero__actions">
                <Link href="/auth/registro" className="eco-btn eco-btn--primary">
                  Crear mi primer cupón
                </Link>
                <Link href="#demo" className="eco-btn">
                  Ver demostración
                </Link>
              </div>
              <p className="eco-small">Gratis para empezar. 7 días de Pro al registrarte, sin tarjeta.</p>
            </div>

            <figure className="eco-tray">
              <img
                className="eco-tray__img"
                src="/producto/cupon-verano20.png"
                width={800}
                height={600}
                alt="Cupón de descuento del 20% con el código VERANO20 y su código QR, generado por EcoCupon"
                fetchPriority="high"
              />
              <figcaption className="eco-label">
                <span className="eco-label__line">
                  Así se ve el cupón de tu negocio: el descuento, el código y su QR en la misma imagen.
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* La demostración: el cupón en movimiento */}
        <section id="demo" className="eco-band" aria-labelledby="demo-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="demo-title" className="eco-h2">
                Mira el cupón en movimiento
              </h2>
              <p className="eco-body">
                Quince segundos en cinco planos: el cupón se arma y se comparte por WhatsApp.
              </p>
            </div>
            <div className="eco-reel" style={{ marginTop: "var(--space-2xl)" }}>
              <ReelPlayer />
            </div>
          </div>
        </section>

        {/* La secuencia: cada paso, una banda de plástico */}
        <section id="como-funciona" className="eco-section" aria-labelledby="pasos-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="pasos-title" className="eco-h2">
                Crea tu cupón en 3 pasos
              </h2>
              <p className="eco-body">Tú defines la oferta. El cupón se arma solo.</p>
            </div>
            <ol className="eco-seq" style={{ marginTop: "var(--space-2xl)" }}>
              {steps.map((step, i) => (
                <li key={step.title} className={`eco-seq__item eco-seq__item--${i + 1}`}>
                  <span className="eco-seq__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="eco-seq__body">
                    <h3 className="eco-seq__title">{step.title}</h3>
                    <p className="eco-seq__line">{step.line}</p>
                  </div>
                  <span className="eco-seq__detail">{step.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* La cuponera: dónde lo van a ver */}
        <section id="cuponera" className="eco-section--s" aria-labelledby="cuponera-title">
          <div className="eco-container eco-split">
            <div className="eco-split__copy">
              <div className="eco-headblock">
                <h2 id="cuponera-title" className="eco-h2">
                  Publica en la cuponera
                </h2>
                <p className="eco-body">Publica en nuestra red y alcanza más clientes.</p>
              </div>
              <dl className="eco-facts">
                <div className="eco-facts__row">
                  <dt>Código único</dt>
                  <dd>Cada cupón lleva el suyo, y queda registrado.</dd>
                </div>
                <div className="eco-facts__row">
                  <dt>Vistas y compartidos</dt>
                  <dd>Mira cuánta gente lo vio y cuánta lo reenvió.</dd>
                </div>
                <div className="eco-facts__row">
                  <dt>Enlace y QR</dt>
                  <dd>Los dos llevan al mismo cupón.</dd>
                </div>
              </dl>
            </div>

            <figure className="eco-split__visual">
              <div className="eco-slot" data-slot="cuponera" data-alt="Foto propia de los comercios que usan EcoCupon">
                <img
                  src="/fotos/mercado-stand-in.jpg"
                  width={1920}
                  height={1442}
                  alt=""
                  loading="lazy"
                  sizes="50vw"
                />
              </div>
            </figure>
          </div>
        </section>

        {/* Lo que trae cada cupón */}
        <section id="beneficios" className="eco-band" aria-labelledby="beneficios-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="beneficios-title" className="eco-h2">
                Todo lo que necesitas para promocionar
              </h2>
            </div>
            <dl className="eco-dl" style={{ marginTop: "var(--space-2xl)" }}>
              {specs.map((spec) => (
                <div key={spec.name} className="eco-dl__pair">
                  <dt>{spec.name}</dt>
                  <dd>{spec.line}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="eco-section" aria-labelledby="precios-title">
          <div className="eco-container">
            <div className="eco-headblock">
              <h2 id="precios-title" className="eco-h2">
                Planes simples y transparentes
              </h2>
            </div>
            <div className="eco-plans" style={{ marginTop: "var(--space-2xl)" }}>
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={plan.featured ? "eco-plan eco-plan--featured" : "eco-plan"}
                >
                  <div className="eco-plan__head">
                    <h3 className="eco-plan__name">{plan.name}</h3>
                    {plan.featured ? <span className="eco-plan__tag">Más popular</span> : null}
                  </div>
                  <p className="eco-plan__for">{plan.audience}</p>
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
              <h3 className="eco-faq__title">Preguntas frecuentes</h3>
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

        {/* El cierre */}
        <section className="eco-close" aria-labelledby="cierre-title">
          <div className="eco-container eco-close__grid">
            <div className="eco-headblock">
              <h2 id="cierre-title" className="eco-h2">
                Comienza a crear cupones hoy
              </h2>
              <p className="eco-close__line">
                Crea tu cupón, compártelo por WhatsApp y mide cuánta gente lo vio y lo reenvió.
              </p>
            </div>
            <div>
              <Link href="/auth/registro" className="eco-btn">
                Crear cuenta gratis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EcoFooter />
    </EcoPage>
  )
}
