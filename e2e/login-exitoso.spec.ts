import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// Se ejecuta solo con una cuenta de prueba autorizada (E2E_USER_EMAIL /
// E2E_USER_PASSWORD). No crea ni modifica nada.
test("un login correcto entra al dashboard", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("link", { name: "Crear nuevo cupón" })).toBeVisible()
})
