"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Copy, Check, Share2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CouponShareButtonsProps {
  couponId: string
  title: string
  code: string
  discount: number
  imageUrl?: string | null
}

export function CouponShareButtons({
  couponId,
  title,
  code,
  discount,
  imageUrl,
}: CouponShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  // `false` en el servidor y el valor real en el cliente: evita el desajuste
  // de hidratación (React #418, que llegó a producción) sin renders en cascada.
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  )

  const couponUrl =
    typeof window !== "undefined" ? `${window.location.origin}/cupon/${couponId}` : ""

  const shareText = `${title} - ${discount}% OFF con el código ${code}`

  const incrementShares = async () => {
    const supabase = createClient()
    const { error } = await supabase.rpc("increment_shares", { coupon_id: couponId })

    // El contador es métrica secundaria: si falla, el usuario ya compartió igual.
    if (error) {
      console.error("No se pudo registrar el compartido:", error.message)
    }
  }

  const fetchImageFile = async (): Promise<File | null> => {
    if (!imageUrl) return null
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) return null
      const blob = await response.blob()
      return new File([blob], `cupon-${code}.png`, {
        type: blob.type || "image/png",
      })
    } catch {
      return null
    }
  }

  // Comparte la imagen como archivo cuando el navegador lo permite (móvil).
  // Es lo que un comerciante espera: el cupón adjunto, no solo un enlace.
  const shareImage = async (): Promise<boolean> => {
    const file = await fetchImageFile()
    if (!file) return false

    if (typeof navigator === "undefined" || !navigator.canShare?.({ files: [file] })) {
      return false
    }

    try {
      await navigator.share({ files: [file], title, text: shareText })
      incrementShares()
      return true
    } catch {
      return false
    }
  }

  const handleDownload = async () => {
    const file = await fetchImageFile()
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const handleWhatsApp = async () => {
    // Si el dispositivo puede compartir archivos, WhatsApp recibe el cupón
    // adjunto. Si no, se cae al enlace, que sigue funcionando.
    if (await shareImage()) return

    incrementShares()
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}. Ver cupón: ${couponUrl}`)}`,
      "_blank",
    )
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(couponUrl)
    setCopied(true)
    incrementShares()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (await shareImage()) return

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: couponUrl })
        incrementShares()
      } catch {
        // El usuario canceló: no hay nada que registrar.
      }
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-muted-foreground">
        Comparte este cupón
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button onClick={handleWhatsApp} className="h-11 min-h-11 gap-2">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="h-11 min-h-11 gap-2"
        >
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
        {canNativeShare && (
          <Button
            variant="secondary"
            onClick={handleShare}
            className="h-11 min-h-11 gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        )}
      </div>
      {imageUrl && (
        <Button
          variant="ghost"
          onClick={handleDownload}
          className="h-11 min-h-11 w-full gap-2"
        >
          {downloaded ? (
            <>
              <Check className="h-4 w-4" />
              Imagen descargada
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Descargar imagen
            </>
          )}
        </Button>
      )}
    </div>
  )
}