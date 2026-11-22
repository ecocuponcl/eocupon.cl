import Link from "next/link"
import { Leaf } from "lucide-react"

/** Colophon del landing: el wordmark, los enlaces reales, el crédito de las fotos. */
export function EcoFooter() {
  return (
    <footer className="eco-footer">
      <div className="eco-container eco-footer__grid">
        <div className="eco-footer__row">
          <Link href="/" className="eco-wordmark" aria-label="EcoCupon, ir al inicio">
            <span className="eco-wordmark__mark">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="eco-wordmark__text">EcoCupon</span>
          </Link>

          <nav className="eco-footer__links" aria-label="Pie de página">
            <Link href="/precios">Precios</Link>
            <Link href="/cuponera">Cuponera</Link>
            <Link href="/condiciones">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/auth/login">Iniciar sesión</Link>
            <a href="https://wa.me/56979540471?text=Hola,%20tengo%20una%20duda%20sobre%20EcoCupon">
              Soporte por WhatsApp
            </a>
          </nav>

          <p className="eco-small">&copy; {new Date().getFullYear()} EcoCupon</p>
        </div>

        <p className="eco-credits" data-credits>
          Fotografías:{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Matin_ensoleill%C3%A9_au_march%C3%A9_de_la_Terrasse.jpg">
            Touam (Hervé Agnoux)
          </a>{" "}
          (CC BY-SA 4.0, Wikimedia Commons)
        </p>
      </div>
    </footer>
  )
}
