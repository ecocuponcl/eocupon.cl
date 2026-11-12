import { expect, test } from "@playwright/test"

// No asume que existan cupones públicos: acepta tanto las tarjetas como el
// estado vacío. Las tarjetas son enlaces a /cupon/<id>.
test("la cuponera pública carga sin sesión", async ({ page }) => {
  const respuesta = await page.goto("/cuponera")

  expect(respuesta?.status()).toBe(200)
  await expect(page.getByRole("heading", { name: "Cuponera de Descuentos" })).toBeVisible()
  await expect(page.getByRole("link", { name: "EcoCupon" })).toBeVisible()
  // El input tiene aria-label explícito, no placeholder como nombre accesible
  await expect(page.getByLabel("Buscar cupones por negocio, título o código")).toBeVisible()
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible()

  const tarjetas = await page.locator('a[href^="/cupon/"]').count()
  const estaVacia = await page
    .getByText("No hay cupones disponibles")
    .isVisible()
    .catch(() => false)

  expect(
    tarjetas > 0 || estaVacia,
    `la cuponera debe mostrar cupones o su estado vacío (tarjetas=${tarjetas}, vacía=${estaVacia})`,
  ).toBe(true)
})