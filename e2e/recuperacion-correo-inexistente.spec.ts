import { expect, test } from "@playwright/test"
import { CORREO_INEXISTENTE } from "./helpers"

// El formulario no debe revelar si un correo está registrado.
//
// Antes consultaba la RPC `user_exists` y mostraba una pantalla distinta
// cuando la cuenta no existía, así que cualquiera podía enumerar cuentas
// pregunta por pregunta. La respuesta ahora es la misma exista o no la cuenta.
test("la recuperación no revela si el correo está registrado", async ({ page }) => {
  await page.goto("/auth/recuperar")

  await expect(page.getByText("Recuperar contraseña")).toBeVisible()
  await page.getByPlaceholder("tu@email.com").fill(CORREO_INEXISTENTE)
  await page.getByRole("button", { name: "Enviar enlace" }).click()

  // Misma pantalla que para un correo válido, sin confirmar ni negar nada.
  // Usamos getByRole para evitar la colisión en modo strict con el párrafo
  // que también contiene "Revisa tu correo".
  await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible()
  await expect(
    page.getByText(/Si .* está registrado, te enviamos un enlace/),
  ).toBeVisible()

  // Y nada que delate la existencia de la cuenta.
  await expect(page.getByText("Este correo no está registrado")).toHaveCount(0)
})
