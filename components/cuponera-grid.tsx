"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Ticket, X } from "lucide-react"

export interface CuponeraCoupon {
  id: string
  title: string
  business_name: string | null
  coupon_code: string
  discount_percentage: number
  generated_image_url: string | null
}

export function CuponeraGrid({ coupons }: { coupons: CuponeraCoupon[] }) {
  const [query, setQuery] = useState("")

  const term = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!term) return coupons
    return coupons.filter((coupon) => {
      const haystack = `${coupon.title} ${coupon.business_name ?? ""} ${coupon.coupon_code}`
      return haystack.toLowerCase().includes(term)
    })
  }, [coupons, term])

  return (
    <>
      <div className="eco-search">
        <div className="eco-search__field">
          <Search className="eco-search__icon" aria-hidden="true" />
          <input
            type="search"
            name="q"
            aria-label="Buscar cupones por negocio, título o código"
            placeholder="Buscar por negocio, título o código"
            className="eco-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {query && (
          <button
            type="button"
            className="eco-btn"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {term
          ? `${results.length} cupones encontrados para ${query}`
          : `${coupons.length} cupones disponibles`}
      </div>

      {results.length > 0 ? (
        <div className="eco-cards">
          {results.map((coupon) => (
            <Link key={coupon.id} href={`/cupon/${coupon.id}`} className="eco-card">
              <div className="eco-card__media">
                {coupon.generated_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coupon.generated_image_url}
                    alt={`Cupón de ${coupon.business_name ?? "comercio"}: ${coupon.title}`}
                    loading="lazy"
                  />
                ) : (
                  <span className="eco-card__fallback" aria-hidden="true">
                    {coupon.discount_percentage}%
                  </span>
                )}
                <span className="eco-card__tag">-{coupon.discount_percentage}%</span>
              </div>
              <div className="eco-card__body">
                <h2 className="eco-card__title">{coupon.title}</h2>
                <p className="eco-card__biz">{coupon.business_name}</p>
                <p className="eco-card__code">{coupon.coupon_code}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="eco-empty">
          <Ticket size={40} aria-hidden="true" />
          <h2>{term ? "Ningún cupón coincide" : "No hay cupones disponibles"}</h2>
          <p>
            {term
              ? "Prueba con el nombre del negocio, el título de la oferta o el código."
              : "Sé el primero en publicar un cupón de descuento."}
          </p>
          {term ? (
            <button type="button" className="eco-btn" onClick={() => setQuery("")}>
              Ver todos los cupones
            </button>
          ) : (
            <Link href="/auth/registro" className="eco-btn eco-btn--primary">
              Crear mi cupón
            </Link>
          )}
        </div>
      )}
    </>
  )
}