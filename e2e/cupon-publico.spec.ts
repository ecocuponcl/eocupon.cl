import { expect, test } from "@playwright/test"
import { UUID_INEXISTENTE } from "./helpers"

// Solo se usa un UUID inexistente: el cupón privado de un tercero no se toca y
// no se inventan identificadores de cupones reales.
test("un cupón inexistente devuelve 404", async ({ page }) => {
  const respuesta = await page.goto(`/cupon/${UUID_INEXISTENTE}`)

  expect(respuesta?.status()).toBe(404)
  await expect(page.getByText("404")).toBeVisible()
})
