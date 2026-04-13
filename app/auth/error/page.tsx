import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Leaf } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Error de Autenticacion</h1>
        <p className="text-muted-foreground mb-6">
          Hubo un problema al verificar tu cuenta. Por favor intenta nuevamente.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/auth/login">Volver a Iniciar Sesion</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Leaf className="h-4 w-4" />
          <span className="text-sm">EcoCupon</span>
        </div>
      </div>
    </div>
  )
}
