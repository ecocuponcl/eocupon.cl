import { defineConfig, devices } from "@playwright/test"

// Suite funcional de EcoCupon. El proyecto Supabase que usa .env.local es
// PRODUCCIÓN: los tests que crearían usuarios, cupones o incrementarían
// contadores están marcados como pendientes en e2e/ y solo se ejecutan con
// credenciales de una cuenta de prueba autorizada (ver e2e/README.md).

// Por defecto la suite levanta su propio servidor en el puerto 3000. Con
// PLAYWRIGHT_BASE_URL se apunta a una instancia ya en marcha (Next no permite un
// segundo `next dev` sobre el mismo directorio, así que si ya tienes uno
// levantado hay que usar esta vía).
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const apuntaAServidorExterno = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: apuntaAServidorExterno
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: true,
        // El primer arranque de Turbopack compila las rutas bajo demanda y puede
        // tardar bastante en una máquina fría.
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
})
