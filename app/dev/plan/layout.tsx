import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Plan de prueba",
  robots: { index: false, follow: false },
}

export default function DevPlanLayout({ children }: { children: React.ReactNode }) {
  return children
}