import { expect, test } from "@playwright/test"

// Requiere acceso al buzón de una cuenta de prueba y, con el flujo real, un
// enlace de confirmación emitido por Supabase. Ninguna de las dos cosas está
// disponible todavía.
test("el enlace de confirmación activa la cuenta y permite entrar", async ({ page }) => {
  test.skip(
    !process.env.E2E_CONFIRMATION_URL,
    "Falta E2E_CONFIRMATION_URL: requiere un correo de confirmación de una cuenta de prueba autorizada.",
  )

  await page.goto(process.env.E2E_CONFIRMATION_URL!)
  await expect(page).toHaveURL(/\/auth\/callback|\/dashboard/)
})

test("la pantalla de verificación explica que hay que revisar el correo", async ({ page }) => {
  const respuesta = await page.goto("/auth/verificar")

  expect(respuesta?.status()).toBe(200)
  await expect(page.getByText("Revisa tu Correo")).toBeVisible()
})
