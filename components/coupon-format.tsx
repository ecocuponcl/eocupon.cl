"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type CouponLayout = "horizontal" | "vertical"

interface CouponFormatValue {
  layout: CouponLayout
  setLayout: (layout: CouponLayout) => void
}

// El formato elegido afecta a la vista previa y a lo que se comparte o
// descarga, así que vive en un contexto: la imagen y los botones son
// componentes hermanos dentro del mismo artículo.
const CouponFormatContext = createContext<CouponFormatValue | null>(null)

export function CouponFormatProvider({
  children,
  defaultLayout = "vertical",
}: {
  children: React.ReactNode
  defaultLayout?: CouponLayout
}) {
  const [layout, setLayout] = useState<CouponLayout>(defaultLayout)
  const value = useMemo(() => ({ layout, setLayout }), [layout])

  return <CouponFormatContext.Provider value={value}>{children}</CouponFormatContext.Provider>
}

export function useCouponFormat() {
  const value = useContext(CouponFormatContext)
  if (!value) {
    throw new Error("useCouponFormat debe usarse dentro de CouponFormatProvider")
  }
  return value
}