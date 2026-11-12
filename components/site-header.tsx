import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SiteHeaderProps {
  /** Botón extra en la derecha (opcional) */
  action?: React.ReactNode
}

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="hidden text-xl font-bold text-foreground sm:inline">EcoCupon</span>
        </Link>

        <div className="flex items-center gap-2">
          {action ?? (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/auth/registro">
                <Button size="sm">Comenzar gratis</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
