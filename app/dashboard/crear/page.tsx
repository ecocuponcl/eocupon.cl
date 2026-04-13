"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { 
  Sparkles, 
  Upload, 
  Download, 
  MessageCircle, 
  Copy, 
  Check, 
  Globe,
  ImageIcon,
  AlertCircle
} from "lucide-react"
import { CouponPreview } from "@/components/coupon-preview"

export default function CreateCouponPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [prompt, setPrompt] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState("20")
  const [couponCode, setCouponCode] = useState("")
  const [businessName, setBusinessName] = useState("")
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedCouponId, setSavedCouponId] = useState<string | null>(null)

  // Generate random code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCouponCode(code)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Generate image with AI
  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) {
      setError("Por favor ingresa una descripción o sube una imagen")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || "Professional coupon background for discounts",
          image: uploadedImage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al generar la imagen")
      }

      setGeneratedImage(data.imageUrl)
      
      // Auto-fill business name from user metadata
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.business_name && !businessName) {
        setBusinessName(user.user_metadata.business_name)
      }
      
      // Generate code if empty
      if (!couponCode) {
        generateCode()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsGenerating(false)
    }
  }

  // Save coupon to database
  const handleSave = async (isPublic: boolean = false) => {
    if (!generatedImage || !title || !couponCode || !businessName) {
      setError("Por favor completa todos los campos requeridos")
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No autenticado")
      }

      const { data, error } = await supabase
        .from("coupons")
        .insert({
          user_id: user.id,
          title,
          description: prompt,
          discount_percentage: parseInt(discountPercentage),
          coupon_code: couponCode,
          business_name: businessName,
          image_url: generatedImage,
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

  // Share functions
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
    const canvas = document.getElementById("coupon-canvas") as HTMLCanvasElement
    if (canvas) {
      const link = document.createElement("a")
      link.download = `cupon-${couponCode || "descuento"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear Cupón</h1>
        <p className="text-muted-foreground">Genera un cupón de descuento con inteligencia artificial</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Genera con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Describe tu cupón (opcional)</FieldLabel>
                <Textarea
                  placeholder="Ej: Cupón de descuento para restaurante con temática tropical, colores vibrantes..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </Field>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o sube una imagen</span>
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="max-h-32 rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Haz clic o arrastra una imagen</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button 
                className="w-full gap-2" 
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && !uploadedImage)}
              >
                {isGenerating ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar imagen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Overlay Options */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Personaliza tu cupón</CardTitle>
            </CardHeader>
            <CardContent>
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

        {/* Preview Section */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CouponPreview
                imageUrl={generatedImage}
                title={title}
                discountPercentage={parseInt(discountPercentage) || 0}
                couponCode={couponCode}
                businessName={businessName}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {generatedImage && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-6">
                <Button 
                  className="w-full gap-2" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Descargar cupón
                </Button>

                {!savedCouponId ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleSave(false)}
                      disabled={isSaving || !title || !couponCode || !businessName}
                    >
                      {isSaving ? <Spinner className="h-4 w-4" /> : "Guardar"}
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleSave(true)}
                      disabled={isSaving || !title || !couponCode || !businessName}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Publicar en cuponera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-primary/10 p-3 text-center text-sm text-primary">
                      Cupón guardado exitosamente
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={handleWhatsApp} className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Enviar por WhatsApp
                      </Button>
                      <Button variant="outline" onClick={handleCopyLink} className="gap-2">
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
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/dashboard")}
                    >
                      Ver mis cupones
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
