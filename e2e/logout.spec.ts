import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

test("cerrar sesión deja de dar acceso al dashboard", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // El menú de usuario del dashboard expone "Cerrar sesión".
  await page.getByRole("button", { name: /mi negocio|menu|menú|cuenta/i }).first().click()
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click()

  await expect(page).toHaveURL("/")
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/auth\/login$/)
})
