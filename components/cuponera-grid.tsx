"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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
      <div className="mx-auto flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            aria-label="Buscar cupones por negocio, título o código"
            placeholder="Buscar por negocio, título o código"
            className="h-11 pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {query ? (
          <Button
            variant="outline"
            className="h-11"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="h-11" onClick={() => setQuery(term)}>
            Buscar
          </Button>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {term
          ? `${results.length} cupones encontrados para ${query}`
          : `${coupons.length} cupones disponibles`}
      </div>

      {results.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((coupon) => (
            <Link key={coupon.id} href={`/cupon/${coupon.id}`}>
              <Card className="group h-full overflow-hidden border-border transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {coupon.generated_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coupon.generated_image_url}
                      alt={`Cupón de ${coupon.business_name ?? "comercio"}: ${coupon.title}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
                      <span className="text-4xl font-bold text-primary">
                        {coupon.discount_percentage}%
                      </span>
                    </div>
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    -{coupon.discount_percentage}%
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-1 line-clamp-1 font-semibold text-foreground group-hover:text-primary">
                    {coupon.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {coupon.business_name}
                  </p>
                  <div className="rounded-lg bg-secondary/50 p-2 text-center">
                    <span className="font-mono text-sm font-bold text-secondary-foreground">
                      {coupon.coupon_code}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Ticket className="h-10 w-10" />
              </EmptyMedia>
              <EmptyTitle>
                {term ? "Ningún cupón coincide" : "No hay cupones disponibles"}
              </EmptyTitle>
              <EmptyDescription>
                {term
                  ? "Prueba con el nombre del negocio, el título de la oferta o el código."
                  : "Sé el primero en publicar un cupón de descuento"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {term ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  Ver todos los cupones
                </Button>
              ) : (
                <Link href="/auth/registro">
                  <Button>Crear mi cupón</Button>
                </Link>
              )}
            </EmptyContent>
          </Empty>
        </div>
      )}
    </>
  )
}