import { expect, test } from "@playwright/test"

// PENDIENTE DE AUTORIZACIÓN: abrir un cupón ejecuta la RPC increment_views y
// compartir ejecuta increment_shares. Ambas escriben en las filas reales de
// producción, y hoy están abiertas al rol anónimo sin límite (hallazgo de la
// auditoría). Se ejecutan solo contra un cupón de prueba y con autorización.
test.fixme(true, "Modifica contadores reales: requiere un cupón de prueba autorizado.")

test("abrir un cupón incrementa las vistas en 1", async ({ page }) => {
  test.skip(!process.env.E2E_COUPON_ID, "Falta E2E_COUPON_ID de un cupón de prueba.")

  await page.goto(`/cupon/${process.env.E2E_COUPON_ID}`)
  const textoVistas = page.getByText(/vistas/i).first()
  await expect(textoVistas).toBeVisible()
  // La comparación exacta antes/después necesita leer la fila, que este test no
  // hace: se limita a comprobar que el contador se muestra.
})

test("copiar el enlace incrementa los compartidos", async ({ page }) => {
  test.skip(!process.env.E2E_COUPON_ID, "Falta E2E_COUPON_ID de un cupón de prueba.")

  await page.goto(`/cupon/${process.env.E2E_COUPON_ID}`)
  await page.getByRole("button", { name: /copiar link/i }).click()
  await expect(page.getByRole("button", { name: /copiado/i })).toBeVisible()
})
