import { expect, test } from "@playwright/test"

// Este test NO envía el formulario a propósito: enviarlo crearía un usuario real
// en el proyecto Supabase de producción. Ver registro-real.spec.ts.
test("el registro muestra sus campos y valida el correo en el navegador", async ({ page }) => {
  const respuesta = await page.goto("/auth/registro")

  expect(respuesta?.status()).toBe(200)
  await expect(page.getByPlaceholder("Mi Tienda")).toBeVisible()
  await expect(page.getByPlaceholder("tu@email.com")).toBeVisible()
  await expect(page.getByPlaceholder("Mínimo 6 caracteres")).toBeVisible()
  await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible()

  const correo = page.getByPlaceholder("tu@email.com")
  await expect(correo).toHaveAttribute("type", "email")

  // Validación nativa del navegador: un correo mal formado es inválido y el
  // formulario no se puede enviar.
  const correoInvalido = await correo.evaluate((el: HTMLInputElement) => {
    el.value = "no-es-un-correo"
    return !el.checkValidity()
  })
  expect(correoInvalido).toBe(true)

  // Los campos obligatorios están vacíos: el formulario tampoco es enviable.
  const formularioInvalido = await correo.evaluate(
    (el: HTMLInputElement) => !(el.form?.checkValidity() ?? true),
  )
  expect(formularioInvalido).toBe(true)
})
