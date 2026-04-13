import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Leaf } from "lucide-react"

export default function VerificarPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Revisa tu Correo</h1>
        <p className="text-muted-foreground mb-6">
          Te hemos enviado un enlace de verificacion a tu correo electronico. 
          Haz clic en el enlace para activar tu cuenta.
        </p>
        <div className="bg-secondary/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            No recibes el correo? Revisa tu carpeta de spam o solicita uno nuevo.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Volver a Iniciar Sesion</Link>
        </Button>
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Leaf className="h-4 w-4" />
          <span className="text-sm">EcoCupon</span>
        </div>
      </div>
    </div>
  )
}
