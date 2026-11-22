import Link from "next/link"
import { Leaf } from "lucide-react"

/** Nav del landing: borde a borde, el wordmark y las dos acciones reales. */
export function EcoHeader() {
  return (
    <header className="eco-nav">
      <div className="eco-container eco-nav__inner">
        <Link href="/" className="eco-wordmark" aria-label="EcoCupon, ir al inicio">
          <span className="eco-wordmark__mark">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="eco-wordmark__text">EcoCupon</span>
        </Link>

        <nav className="eco-nav__actions" aria-label="Cuenta">
          <Link href="/auth/login" className="eco-btn eco-btn--sm eco-btn--quiet">
            Iniciar sesión
          </Link>
          <Link href="/auth/registro" className="eco-btn eco-btn--sm eco-btn--primary">
            Comenzar gratis
          </Link>
        </nav>
      </div>
    </header>
  )
}
