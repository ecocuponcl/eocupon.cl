import { expect, test } from "@playwright/test"

// Verifica el lado de la app del handshake OAuth sin depender de Google:
// intercepta la llamada a Supabase Auth y corta la navegación antes de salir.
test("el botón de Google pide autorización con el proveedor y el callback correctos", async ({
  page,
}) => {
  let urlAuthorize: string | null = null
  await page.route("**/auth/v1/authorize**", async (route) => {
    urlAuthorize = route.request().url()
    await route.abort()
  })

  await page.goto("/auth/login")
  await page.getByRole("button", { name: "Continuar con Google" }).click()

  await expect
    .poll(() => urlAuthorize, { message: "debe llamarse a Supabase Auth /authorize" })
    .not.toBeNull()

  expect(urlAuthorize).toContain("provider=google")
  expect(decodeURIComponent(urlAuthorize!)).toContain("/auth/callback")
})

// El flujo completo exige una cuenta de Google real; se ejecuta solo si el
// usuario autoriza una cuenta de prueba.
// NOTA (verificado a mano el 2026-11-09): hoy la app envía a Google y Google
// responde redirect_uri_mismatch, porque el callback de Supabase no está
// registrado en el cliente OAuth de Google Cloud. Este test fallará hasta que
// se corrija esa configuración externa.
test("el login con Google completa el consentimiento y vuelve a /dashboard", async ({ page }) => {
  test.skip(
    !process.env.E2E_GOOGLE_EMAIL,
    "Falta E2E_GOOGLE_EMAIL: hace falta una cuenta de Google de prueba autorizada.",
  )
  test.fixme(
    true,
    "Bloqueado por redirect_uri_mismatch: registrar https://vwjdfyljacoxwabtfoco.supabase.co/auth/v1/callback en Google Cloud Console.",
  )

  await page.goto("/auth/login")
  await page.getByRole("button", { name: "Continuar con Google" }).click()
  await page.getByRole("textbox", { name: /correo|email/i }).fill(process.env.E2E_GOOGLE_EMAIL!)
  await page.getByRole("button", { name: /siguiente|next/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})
