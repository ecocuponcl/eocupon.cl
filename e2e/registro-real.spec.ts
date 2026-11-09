import { expect, test } from "@playwright/test"

// PENDIENTE DE AUTORIZACIÓN: enviar este formulario crea un usuario real en el
// proyecto Supabase de producción y dispara el trigger handle_new_user, que
// inserta en profiles. No se ejecuta hasta que el usuario autorice una cuenta
// de prueba (y, si aplica, un proyecto de staging).
test.fixme(true, "Crearía un usuario real en producción: requiere autorización explícita.")

test("el registro crea la cuenta y pide confirmación por correo", async ({ page }) => {
  test.skip(!process.env.E2E_NEW_USER_EMAIL, "Falta E2E_NEW_USER_EMAIL autorizado.")

  await page.goto("/auth/registro")
  await page.getByPlaceholder("Mi Tienda").fill("Negocio de Prueba QA")
  await page.getByPlaceholder("tu@email.com").fill(process.env.E2E_NEW_USER_EMAIL!)
  await page.getByPlaceholder("Mínimo 6 caracteres").fill("ClaveDePrueba123!")
  await page.getByRole("button", { name: "Crear cuenta" }).click()

  await expect(page.getByText("Revisa tu correo")).toBeVisible()
})
