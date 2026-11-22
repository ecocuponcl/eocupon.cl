"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import { MessageCircle, Copy, Check, Share2, Download, CircleHelp, X } from "lucide-react"
import { type CouponLayout, useCouponFormat } from "@/components/coupon-format"

interface CouponShareButtonsProps {
  couponId: string
  /** URL canónica del cupón. Sale del servidor (SITE_URL), no del navegador. */
  url: string
  title: string
  code: string
  discount: number
  images: Record<CouponLayout, string>
}

export function CouponShareButtons({
  couponId,
  url,
  title,
  code,
  discount,
  images,
}: CouponShareButtonsProps) {
  const { layout } = useCouponFormat()
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [aviso, setAviso] = useState<"copiada" | "descargada" | null>(null)
  const helpRef = useRef<HTMLDialogElement>(null)
  // `false` en el servidor y el valor real en el cliente: evita el desajuste
  // de hidratación (React #418, que llegó a producción) sin renders en cascada.
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  )

  const couponUrl = url
  const imageUrl = images[layout]

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
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) return null
      const blob = await response.blob()
      return new File([blob], `cupon-${code}-${layout}.png`, {
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

    // La pestaña se abre en blanco dentro del clic (si se abre después del
    // `await`, el navegador la bloquea) y recién navega cuando la imagen ya
    // está copiada, así el aviso alcanza a quedar visible.
    const tab = window.open("", "_blank")
    incrementShares()

    const file = await fetchImageFile()
    const copied = file ? await copyImage(file) : false

    if (file && !copied) downloadFile(file)
    setAviso(copied ? "copiada" : "descargada")

    if (tab) {
      tab.location.href = whatsapp
    } else {
      window.open(whatsapp, "_blank", "noopener,noreferrer")
    }
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
        <button type="button" onClick={handleDownload} className="eco-btn eco-btn--sm">
          {downloaded ? (
            <>
              <Check size={18} aria-hidden="true" />
              Descargada
            </>
          ) : (
            <>
              <Download size={18} aria-hidden="true" />
              Descargar {layout === "vertical" ? "vertical" : "horizontal"}
            </>
          )}
        </button>
      </div>
      {aviso && (
        <p className="eco-share__note">
          {aviso === "copiada"
            ? "Imagen copiada. En WhatsApp, pégala con Ctrl+V (⌘V en Mac) para enviarla con el texto."
            : "Descargamos la imagen: adjúntala en WhatsApp junto al texto."}
        </p>
      )}
      <button
        type="button"
        onClick={() => helpRef.current?.showModal()}
        className="eco-btn eco-btn--quiet eco-btn--sm"
      >
        <CircleHelp size={18} aria-hidden="true" />
        ¿Cómo lo envío desde el computador?
      </button>

      {/* Diálogo nativo: se dibuja en la capa superior, así no lo recorta el
          overflow del artículo. El texto explica la ruta de escritorio, que es
          la única donde WhatsApp no recibe la imagen sola. */}
      <dialog
        ref={helpRef}
        className="eco-dialog"
        aria-labelledby="ayuda-compartir-title"
        onClick={(event) => {
          if (event.target === helpRef.current) helpRef.current?.close()
        }}
      >
        <div className="eco-dialog__head">
          <h2 className="eco-dialog__title" id="ayuda-compartir-title">
            Cómo enviar el cupón por WhatsApp
          </h2>
          <button
            type="button"
            className="eco-dialog__close"
            aria-label="Cerrar"
            onClick={() => helpRef.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ol className="eco-dialog__steps">
          <li>
            <strong>Haz clic en «WhatsApp».</strong> Se abre el chat con el texto y el enlace del
            cupón.
          </li>
          <li>
            <strong>Pega la imagen.</strong> Queda copiada: en el campo del chat usa{" "}
            <kbd>Ctrl</kbd> + <kbd>V</kbd> (<kbd>⌘</kbd> + <kbd>V</kbd> en Mac) y envíala junto al
            texto.
          </li>
          <li>
            <strong>Si no se pudo copiar,</strong> la descargamos: adjúntala con el clip y elige el
            archivo PNG.
          </li>
        </ol>

        <p className="eco-dialog__alt">Otras formas de compartir</p>
        <ul className="eco-dialog__list">
          <li>
            <strong>Copiar link:</strong> pégalo en cualquier chat, correo o red social; el cupón
            aparece como vista previa con la imagen.
          </li>
          <li>
            <strong>Descargar imagen:</strong> publícala como estado, historia o adjunto en
            Instagram, Facebook o correo.
          </li>
          <li>
            <strong>Elegir formato:</strong> arriba de la imagen puedes alternar entre vertical
            (ideal para estados y chats) y horizontal (ideal para correo y publicaciones).
          </li>
        </ul>

        <p className="eco-dialog__foot">
          Desde el celular no necesitas hacer nada de esto: el botón «WhatsApp» adjunta la imagen y
          el enlace en un solo mensaje.
        </p>
      </dialog>
    </div>
  )
}