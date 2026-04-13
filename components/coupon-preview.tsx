"use client"

import { useEffect, useRef } from "react"

interface CouponPreviewProps {
  imageUrl: string | null
  title: string
  discountPercentage: number
  couponCode: string
  businessName: string
}

export function CouponPreview({
  imageUrl,
  title,
  discountPercentage,
  couponCode,
  businessName,
}: CouponPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = 800
    const height = 600
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = "#f0f9f0"
    ctx.fillRect(0, 0, width, height)

    const drawContent = () => {
      // Draw background image if exists
      if (imageUrl) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Draw image with cover fit
          const scale = Math.max(width / img.width, height / img.height)
          const x = (width - img.width * scale) / 2
          const y = (height - img.height * scale) / 2
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
          
          // Draw overlay
          drawOverlay()
        }
        img.src = imageUrl
      } else {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, "#22c55e")
        gradient.addColorStop(1, "#84cc16")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        
        drawOverlay()
      }
    }

    const drawOverlay = () => {
      // Semi-transparent overlay for readability
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fillRect(0, 0, width, height)

      // Discount badge (top right)
      const badgeX = width - 140
      const badgeY = 30
      ctx.fillStyle = "#22c55e"
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, 120, 60, 12)
      ctx.fill()
      
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 36px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(`-${discountPercentage}%`, badgeX + 60, badgeY + 42)

      // Business name (top left)
      if (businessName) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 24px system-ui"
        ctx.textAlign = "left"
        ctx.fillText(businessName, 30, 55)
      }

      // Title (center)
      if (title) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 48px system-ui"
        ctx.textAlign = "center"
        ctx.fillText(title, width / 2, height / 2 - 30)
      }

      // Coupon code box (center-bottom)
      if (couponCode) {
        const codeBoxWidth = 300
        const codeBoxHeight = 70
        const codeBoxX = (width - codeBoxWidth) / 2
        const codeBoxY = height / 2 + 30

        // Code background
        ctx.fillStyle = "#fef08a"
        ctx.beginPath()
        ctx.roundRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 12)
        ctx.fill()

        // Code text
        ctx.fillStyle = "#422006"
        ctx.font = "bold 32px monospace"
        ctx.textAlign = "center"
        ctx.fillText(couponCode, width / 2, codeBoxY + 47)
      }

      // CTA text (bottom)
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px system-ui"
      ctx.textAlign = "center"
      ctx.fillText("Usa este código en tu compra", width / 2, height - 60)

      // EcoCupon branding (bottom right)
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.font = "14px system-ui"
      ctx.textAlign = "right"
      ctx.fillText("Creado con EcoCupon.cl", width - 20, height - 20)
    }

    drawContent()
  }, [imageUrl, title, discountPercentage, couponCode, businessName])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
      <canvas
        ref={canvasRef}
        id="coupon-canvas"
        className="h-auto w-full"
        style={{ aspectRatio: "4/3" }}
      />
      {!imageUrl && !title && !couponCode && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <p className="text-sm text-muted-foreground">
            Genera una imagen para ver la vista previa
          </p>
        </div>
      )}
    </div>
  )
}
