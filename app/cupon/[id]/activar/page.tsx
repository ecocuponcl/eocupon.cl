"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { SiteHeader } from "@/components/site-header"
import { CheckCircle2, AlertCircle, Ticket, ArrowLeft, Copy, Check } from "lucide-react"
import { SITE_URL } from "@/lib/site-url"

/** Botón que copia una URL y da feedback visual. */
function CopyLinkButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 text-primary" />
          Enlace copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}

type ActivationResult = {
  id: string
  consumer_name: string
  activated_at: string
  expires_at: string | null
  coupon_title: string
  business_name: string
  coupon_code: string
}

export default function ActivarCuponPage() {
  const params = useParams()
  const couponId = params.id as string

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ActivationResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError("Ingresa tu nombre completo")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/coupon-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon_id: couponId,
          consumer_name: name.trim(),
          consumer_phone: phone.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "No se pudo activar el cupón")
        return
      }

      setResult(data)
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de éxito tras activar
  if (result) {
    const recoveryUrl = `/cupon/${couponId}/activar/${result.id}`

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader
          action={
            <Link href={`/cupon/${couponId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al cupón
              </Button>
            </Link>
          }
        />

        <main className="container mx-auto px-4 py-10 md:py-16">
          <div className="mx-auto max-w-md space-y-4">
            {/* Estado de éxito */}
            <Card className="overflow-hidden border-border">
              <CardContent className="p-8 text-center">
                <div className="mb-5 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h1 className="mb-1 text-2xl font-bold text-foreground">
                  ¡Cupón activado!
                </h1>
                <p className="text-muted-foreground">
                  Hola{" "}
                  <span className="font-semibold text-foreground">{result.consumer_name}</span>
                  , tu cupón de{" "}
                  <span className="font-semibold text-foreground">{result.business_name}</span>{" "}
                  está listo.
                </p>
              </CardContent>
            </Card>

            {/* Instrucción principal: qué hacer en el local */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  Cómo usar tu cupón
                </p>
                <ol className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    Muestra esta pantalla o el QR en el local al momento de pagar.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    El encargado escaneará tu código o lo verificará en su sistema.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    ¡Listo! Recibirás tu beneficio de inmediato.
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Código del cupón — el que el consumidor le dice al comercio */}
            <Card className="border-border">
              <CardContent className="p-5 text-center">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código del cupón
                </p>
                <p className="mb-1 font-mono text-3xl font-bold tracking-widest text-foreground">
                  {result.coupon_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Muéstraselo al encargado si te lo piden
                </p>
              </CardContent>
            </Card>

            {/* Vigencia */}
            {result.expires_at && (
              <p className="text-center text-sm text-muted-foreground">
                Válido hasta{" "}
                <span className="font-medium text-foreground">
                  {new Date(result.expires_at).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

            {/* Acciones secundarias */}
            <div className="space-y-2">
              <CopyLinkButton
                label="Guardar enlace de mi cupón"
                value={`${SITE_URL}${recoveryUrl}`}
              />
              <Link href={`/cupon/${couponId}`}>
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al cupón
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        action={
          <Link href={`/cupon/${couponId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto max-w-md">
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Activar cupón</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresa tus datos para activar tu beneficio. No necesitas crear una cuenta.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">
                      Teléfono{" "}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Activando…" : "Activar mi cupón"}
                  </Button>
                </FieldGroup>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Tus datos se usan solo para identificarte al momento del canje.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
