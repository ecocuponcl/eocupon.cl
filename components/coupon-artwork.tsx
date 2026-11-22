"use client"

import { type CouponLayout, useCouponFormat } from "@/components/coupon-format"

interface CouponArtworkProps {
  alt: string
  discount: number
  isExpired: boolean
  images: Record<CouponLayout, string>
}

const OPTIONS: { value: CouponLayout; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
]

export function CouponArtwork({ alt, discount, isExpired, images }: CouponArtworkProps) {
  const { layout, setLayout } = useCouponFormat()

  return (
    <>
      <div className={`eco-coupon__media eco-coupon__media--${layout}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[layout]} alt={alt} />
        <span className="eco-coupon__tag">-{discount}% OFF</span>
        {isExpired && (
          <div className="eco-coupon__expired">
            <span>Cupón vencido</span>
          </div>
        )}
      </div>

      <div className="eco-coupon__toolbar">
        <span>Formato de la imagen</span>
        <div className="eco-seg" role="group" aria-label="Formato de la imagen">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLayout(option.value)}
              aria-pressed={layout === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}