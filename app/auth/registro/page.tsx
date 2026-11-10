"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/google-button"
import { traducirErrorAuth } from "@/lib/auth-errors"
import { Leaf, AlertCircle, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: {
          business_name: businessName,
        },
      },
    })

    if (error) {
      setError(traducirErrorAuth(error.message))
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Revisa tu correo</h2>
            <p className="mb-6 text-muted-foreground">
              Te enviamos un enlace de confirmación a <strong>{email}</strong>. 
              Haz clic en el enlace para activar tu cuenta.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </Link>
          <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
          <CardDescription>Comienza a crear cupones con IA en minutos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="business-name">Nombre de tu negocio</FieldLabel>
                <Input
                  id="business-name"
                  name="organization"
                  autoComplete="organization"
                  type="text"
                  placeholder="Mi Tienda"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </Field>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : "Crear cuenta"}
              </Button>
            </FieldGroup>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton onError={(msg) => setError(traducirErrorAuth(msg))} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
