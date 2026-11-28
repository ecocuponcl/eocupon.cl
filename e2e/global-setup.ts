import fs from "node:fs"

/**
 * Los e2e crean cupones y usuarios: si se ejecutan contra la base de producción
 * ensucian datos reales. Este guard corta la corrida antes de tocar nada.
 *
 * `pnpm dev` carga `.env.local`, así que ese archivo es la fuente de verdad de a
 * qué base apuntarían las pruebas. Para correrlas a sabiendas contra producción
 * hay que exportar E2E_ALLOW_PROD=1.
 */

const PRODUCCION = "vwjdfyljacoxwabtfoco"

function leerEnvLocal(): string {
  try {
    return fs.readFileSync(".env.local", "utf8")
  } catch {
    return ""
  }
}

export default async function globalSetup() {
  if (process.env.E2E_ALLOW_PROD === "1") return

  // El servidor de pruebas hereda el entorno del proceso, y en Next la variable
  // de entorno gana sobre `.env.local`; el guard mira lo mismo que verá la app.
  const destino = process.env.NEXT_PUBLIC_SUPABASE_URL ?? leerEnvLocal()

  if (destino.includes(PRODUCCION)) {
    throw new Error(
      "Los e2e escriben datos y la configuración apunta a la base de producción " +
        `(${PRODUCCION}). Usa una base de staging en .env.local o exporta ` +
        "E2E_ALLOW_PROD=1 solo si sabes lo que haces.",
    )
  }
}