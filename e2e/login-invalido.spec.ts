import { expect, test } from "@playwright/test"
import { CORREO_INEXISTENTE } from "./helpers"

// No requiere credenciales válidas: comprueba el camino de error real contra
// Supabase Auth (la petición llega al proveedor y devuelve 400).
test("credenciales inválidas muestran error y Supabase responde 400", async ({ page }) => {
  await page.goto("/auth/login")

  const peticionToken = page.waitForResponse(
    (r) => r.url().includes("/auth/v1/token") && r.request().method() === "POST",
  )

  await page.getByPlaceholder("tu@email.com").fill(CORREO_INEXISTENTE)
  await page.getByPlaceholder("********").fill("ClaveInvalida123!")
  await page.getByRole("button", { name: "Iniciar sesión" }).click()

  const respuesta = await peticionToken
  expect(respuesta.status()).toBe(400)

  // Supabase responde en inglés ("Invalid login credentials") y la app lo
  // traduce en lib/auth-errors.ts antes de mostrarlo.
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible()
  // Un login fallido no debe dejar sesión ni sacar al usuario de la pantalla.
  await expect(page).toHaveURL(/\/auth\/login$/)
})
