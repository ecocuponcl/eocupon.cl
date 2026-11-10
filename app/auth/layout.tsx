import type { Metadata } from "next"

// Los formularios de sesión no aportan nada al índice y comparten metadatos:
// antes heredaban el título de la portada y competían con ella en los resultados
// de búsqueda (ver auditoría SEO, hallazgo S-03).
export const metadata: Metadata = {
  title: "Acceso a tu cuenta",
  description:
    "Inicia sesión o crea tu cuenta de EcoCupon para gestionar tus cupones de descuento.",
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}