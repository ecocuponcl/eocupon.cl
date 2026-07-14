"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, MessageCircle, Copy, Check, Eye, Trash2, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Coupon {
  id: string
  title: string
  discount_percentage: number
  coupon_code: string
  business_name: string
  generated_image_url: string | null
  is_public: boolean
  views: number
  shares_count: number
  created_at: string
}

interface CouponCardProps {
  coupon: Coupon
  showActions?: boolean
  onDelete?: () => void
  onTogglePublic?: () => void
}

export function CouponCard({ coupon, showActions, onDelete, onTogglePublic }: CouponCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const link = `${window.location.origin}/cupon/${coupon.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = `${coupon.title} - ${coupon.discount_percentage}% OFF con el código ${coupon.coupon_code}. Ver cupón: ${window.location.origin}/cupon/${coupon.id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleDownload = async () => {
    if (!coupon.generated_image_url) return
    
    try {
      const response = await fetch(coupon.generated_image_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cupon-${coupon.coupon_code}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading:", error)
    }
  }

  return (
    <Card className="group overflow-hidden border-border transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {coupon.generated_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coupon.generated_image_url}
            alt={coupon.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
            <span className="text-4xl font-bold text-primary">{coupon.discount_percentage}%</span>
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
          -{coupon.discount_percentage}%
        </div>
        {coupon.is_public && (
          <div className="absolute left-3 top-3 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            Publicado
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-foreground line-clamp-1">{coupon.title}</h3>
          <p className="text-sm text-muted-foreground">{coupon.business_name}</p>
        </div>
        <div className="mb-4 rounded-lg bg-secondary/50 p-2 text-center">
          <span className="font-mono text-sm font-bold text-secondary-foreground">{coupon.coupon_code}</span>
        </div>
        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {coupon.views} vistas
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {coupon.shares_count} compartidos
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="flex-1 gap-1">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleWhatsApp}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar por WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Enlace copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cupon/${coupon.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver cupón
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {showActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={onTogglePublic}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {coupon.is_public ? "Ocultar" : "Publicar"}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Borrar</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
