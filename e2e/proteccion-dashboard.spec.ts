import { expect, test } from "@playwright/test"

const RUTAS_PRIVADAS = ["/dashboard", "/dashboard/crear", "/dashboard/mis-cupones"]

test("las rutas privadas redirigen a login cuando no hay sesión", async ({ page }) => {
  for (const ruta of RUTAS_PRIVADAS) {
    await page.goto(ruta)

    await expect(page, `${ruta} debería terminar en el login`).toHaveURL(/\/auth\/login$/)
    await expect(page.getByPlaceholder("tu@email.com")).toBeVisible()
  }
})
