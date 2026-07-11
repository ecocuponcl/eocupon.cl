"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Sparkles, Globe, Download, MessageCircle, Copy, Check, AlertCircle } from "lucide-react"

function buildImageUrl(title: string, business: string, code: string, discount: string) {
  const params = new URLSearchParams()
  params.set("title", title)
  params.set("business", business)
  params.set("code", code)
  params.set("discount", String(parseInt(discount, 10) || 0))
  return `/api/coupon-image?${params.toString()}`
}

export default function CreateCouponPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState("20")
  const [couponCode, setCouponCode] = useState("")
  const [businessName, setBusinessName] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedCouponId, setSavedCouponId] = useState<string | null>(null)

  const previewUrl = buildImageUrl(title, businessName, couponCode, discountPercentage)

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    setCouponCode(code)
  }

  const handleSave = async (isPublic = false) => {
    if (!title || !couponCode || !businessName) {
      setError("Por favor completa todos los campos requeridos")
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { data, error } = await supabase
        .from("coupons")
        .insert({
          user_id: user.id,
          title,
          description: "",
          discount_percentage: parseInt(discountPercentage, 10) || 0,
          coupon_code: couponCode,
          business_name: businessName,
          image_url: previewUrl,
          is_public: isPublic,
        })
        .select()
        .single()

      if (error) throw error
      setSavedCouponId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleWhatsApp = () => {
    const text = `${title} - ${discountPercentage}% OFF con el código ${couponCode}. ${savedCouponId ? `Ver cupón: ${window.location.origin}/cupon/${savedCouponId}` : ""}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleCopyLink = () => {
    if (savedCouponId) {
      navigator.clipboard.writeText(`${window.location.origin}/cupon/${savedCouponId}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cupon-${couponCode || "descuento"}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError("No se pudo descargar la imagen")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear Cupón</h1>
        <p className="text-muted-foreground">Diseña tu cupón de descuento y compártelo al instante</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Preview Section */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vista previa del cupón"
                  className="h-auto w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {savedCouponId ? (
            <Card className="border-border">
              <CardContent className="space-y-4 p-6">
                <Button className="w-full gap-2" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Descargar cupón
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleWhatsApp} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                  <Button variant="secondary" onClick={handleCopyLink} className="gap-2">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar link
                      </>
                    )}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
                  Ver mis cupones
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="space-y-4 p-6">
                <Button
                  className="w-full gap-2"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !title || !couponCode || !businessName}
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !title || !couponCode || !businessName}
                >
                  <Globe className="h-4 w-4" />
                  Publicar en cuponera
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Personalize Section */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Personaliza tu cupón</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <FieldGroup>
                <Field>
                  <FieldLabel>Título del cupón</FieldLabel>
                  <Input
                    placeholder="Ej: Descuento de Verano"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Descuento (%)</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Código</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="VERANO50"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                      <Button variant="outline" size="icon" onClick={generateCode} title="Generar código">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Nombre del negocio</FieldLabel>
                  <Input
                    placeholder="Mi Tienda"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
