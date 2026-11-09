import { expect, test } from "@playwright/test"
import { CORREO_INEXISTENTE } from "./helpers"

// Un correo inexistente nunca dispara un envío real: la app consulta la RPC
// user_exists y muestra una pantalla propia. No se envía ningún correo.
test("la recuperación con un correo inexistente avisa que no está registrado", async ({ page }) => {
  await page.goto("/auth/recuperar")

  await expect(page.getByText("Recuperar contraseña")).toBeVisible()
  await page.getByPlaceholder("tu@email.com").fill(CORREO_INEXISTENTE)
  await page.getByRole("button", { name: "Enviar enlace" }).click()

  await expect(page.getByText("Este correo no está registrado")).toBeVisible()
  await expect(page.getByText(CORREO_INEXISTENTE)).toBeVisible()
  await expect(page.getByRole("button", { name: "Crear una cuenta" })).toBeVisible()
})
