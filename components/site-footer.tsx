import Link from "next/link"
import { Leaf } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">EcoCupon</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <Link href="/precios" className="hover:text-foreground">Precios</Link>
            <Link href="/cuponera" className="hover:text-foreground">Cuponera</Link>
            <Link href="/condiciones" className="hover:text-foreground">Términos</Link>
            <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EcoCupon
          </p>
        </div>
      </div>
    </footer>
  )
}
