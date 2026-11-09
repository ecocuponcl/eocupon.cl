import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

test("la sesión persiste al recargar y al navegar a otra ruta privada", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.reload()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/dashboard/mis-cupones")
  await expect(page).toHaveURL(/\/dashboard\/mis-cupones$/)
  await expect(page.getByPlaceholder("tu@email.com")).toHaveCount(0)
})
