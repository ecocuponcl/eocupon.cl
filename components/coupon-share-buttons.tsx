"use client"

import { useState, useSyncExternalStore } from "react"
import { MessageCircle, Copy, Check, Share2, Download } from "lucide-react"

interface CouponShareButtonsProps {
  couponId: string
  /** URL canónica del cupón. Sale del servidor (SITE_URL), no del navegador. */
  url: string
  title: string
  code: string
  discount: number
  imageUrl?: string | null
}

export function CouponShareButtons({
  couponId,
  url,
  title,
  code,
  discount,
  imageUrl,
}: CouponShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [aviso, setAviso] = useState<"copiada" | "descargada" | null>(null)
  // `false` en el servidor y el valor real en el cliente: evita el desajuste
  // de hidratación (React #418, que llegó a producción) sin renders en cascada.
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  )

  const couponUrl = url

  const shareText = `${title} - ${discount}% OFF con el código ${code}`

  // El enlace viaja siempre. En móvil se adjunta la imagen Y el texto lleva la
  // URL, para que quien la reciba pueda abrir el cupón sin pedir nada; antes la
  // ruta con imagen iba sin enlace y la ruta con enlace iba sin imagen.
  const shareTextWithLink = couponUrl ? `${shareText}. Ver cupón: ${couponUrl}` : shareText

  const incrementShares = async () => {
    // Llama al Route Handler del servidor en vez de Supabase directamente.
    // Esto permite cerrar el GRANT EXECUTE to anon en las RPCs sin romper el UX.
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_id: couponId, event: "share" }),
      })
    } catch {
      // El contador es métrica secundaria: si falla, el usuario ya compartió.
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
  // El texto lleva el enlace, así el mensaje llega con la imagen y con la
  // página del cupón: quien lo reciba puede mirarlo o abrirlo.
  const shareImage = async (): Promise<boolean> => {
    const file = await fetchImageFile()
    if (!file) return false

    if (typeof navigator === "undefined" || !navigator.canShare?.({ files: [file] })) {
      return false
    }

    try {
      await navigator.share({ files: [file], title, text: shareTextWithLink })
      incrementShares()
      return true
    } catch {
      return false
    }
  }

  const downloadFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }

  const handleDownload = async () => {
    const file = await fetchImageFile()
    if (!file) return
    downloadFile(file)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  // En escritorio no hay share de archivos, pero sí portapapeles: se copia el
  // PNG y WhatsApp lo recibe con un pegado. Si el navegador no lo permite, se
  // descarga y se avisa.
  const copyImage = async (file: File): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.clipboard || typeof ClipboardItem === "undefined") {
      return false
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })])
      return true
    } catch {
      return false
    }
  }

  // El mensaje va con imagen y enlace: en el teléfono el sistema adjunta el PNG,
  // en escritorio WhatsApp abre con el texto (el enlace muestra el cupón como
  // vista previa) y la imagen queda copiada para pegarla en el chat.
  const handleWhatsApp = async () => {
    setAviso(null)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isMobile && (await shareImage())) return

    const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareTextWithLink)}`
    window.open(whatsapp, "_blank", "noopener,noreferrer")
    incrementShares()

    const file = await fetchImageFile()
    if (file && (await copyImage(file))) {
      setAviso("copiada")
      return
    }

    if (file) downloadFile(file)
    setAviso("descargada")
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
        await navigator.share({ title, text: shareTextWithLink, url: couponUrl })
        incrementShares()
      } catch {
        // El usuario canceló: no hay nada que registrar.
      }
    }
  }

  return (
    <div className="eco-share">
      <p className="eco-share__label">Comparte este cupón</p>
      <div className="eco-share__grid">
        <button
          type="button"
          onClick={handleWhatsApp}
          className="eco-btn eco-btn--primary eco-btn--sm"
        >
          <MessageCircle size={18} aria-hidden="true" />
          WhatsApp
        </button>
        <button type="button" onClick={handleCopyLink} className="eco-btn eco-btn--sm">
          {copied ? (
            <>
              <Check size={18} aria-hidden="true" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={18} aria-hidden="true" />
              Copiar link
            </>
          )}
        </button>
        {canNativeShare && (
          <button type="button" onClick={handleShare} className="eco-btn eco-btn--sm">
            <Share2 size={18} aria-hidden="true" />
            Compartir
          </button>
        )}
      </div>
      {aviso && (
        <p className="eco-share__note">
          {aviso === "copiada"
            ? "Imagen copiada. Pégala en el chat de WhatsApp con Ctrl+V (⌘V en Mac)."
            : "Descargamos la imagen: adjúntala en el chat de WhatsApp."}
        </p>
      )}
      {imageUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="eco-btn eco-btn--quiet eco-btn--sm"
        >
          {downloaded ? (
            <>
              <Check size={18} aria-hidden="true" />
              Imagen descargada
            </>
          ) : (
            <>
              <Download size={18} aria-hidden="true" />
              Descargar imagen
            </>
          )}
        </button>
      )}
    </div>
  )
}