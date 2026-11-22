import type { ReactNode } from "react"
import { Schibsted_Grotesk, Instrument_Sans, DM_Mono } from "next/font/google"
import "@/app/landing.css"

/**
 * Cascarón de las páginas públicas que usan el sistema del landing (Dose).
 * Las tipografías se cargan acá una sola vez y viajan como variables CSS.
 */
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--eco-display",
  display: "swap",
})

const body = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--eco-body",
  display: "swap",
})

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--eco-mono",
  display: "swap",
})

export function EcoPage({ children }: { children: ReactNode }) {
  return (
    <div className={`eco ${display.variable} ${body.variable} ${mono.variable}`} data-theme="dose">
      {children}
    </div>
  )
}