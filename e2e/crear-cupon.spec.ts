import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// PENDIENTE DE AUTORIZACIÓN para ejecutarse: crear un cupón escribe una fila en
// public.coupons y sube un logo al bucket `logos` del proyecto de producción.
test.fixme(true, "Escribe en la base de datos de producción: requiere autorización explícita.")

test("se crea un cupón y aparece en Mis Cupones", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()

  await page.goto("/dashboard/crear")
  await page.getByPlaceholder("Ej: Descuento de Verano").fill("Cupón de prueba QA")
  await page.getByPlaceholder("VERANO50").fill("QA-TEST-01")
  await page.getByPlaceholder("Mi Tienda").fill("Negocio de Prueba QA")
  await page.getByRole("button", { name: /guardar|crear/i }).click()

  await page.goto("/dashboard/mis-cupones")
  await expect(page.getByText("Cupón de prueba QA")).toBeVisible()
})

test("la pantalla de creación exige sesión", async ({ page }) => {
  await page.goto("/dashboard/crear")
  await expect(page).toHaveURL(/\/auth\/login$/)
})
