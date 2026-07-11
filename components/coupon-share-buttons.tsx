"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Copy, Check, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CouponShareButtonsProps {
  couponId: string
  title: string
  code: string
  discount: number
}

export function CouponShareButtons({ couponId, title, code, discount }: CouponShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const couponUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/cupon/${couponId}` 
    : ""

  const shareText = `${title} - ${discount}% OFF con el código ${code}. Ver cupón: ${couponUrl}`

  const incrementShares = async () => {
    const supabase = createClient()
    await supabase.rpc("increment_shares", { coupon_id: couponId })
  }

  const handleWhatsApp = () => {
    incrementShares()
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(couponUrl)
    setCopied(true)
    incrementShares()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: couponUrl,
        })
        incrementShares()
      } catch (err) {
        // User cancelled or error
      }
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-muted-foreground">
        Comparte este cupón
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button onClick={handleWhatsApp} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
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
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="secondary" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        )}
      </div>
    </div>
  )
}
