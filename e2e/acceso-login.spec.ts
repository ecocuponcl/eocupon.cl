import { expect, test } from "@playwright/test"

test("la pantalla de login carga con sus campos y el acceso con Google", async ({ page }) => {
  const respuesta = await page.goto("/auth/login")

  expect(respuesta?.status()).toBe(200)
  await expect(page.getByText("Bienvenido de vuelta")).toBeVisible()
  await expect(page.getByText("Ingresa tus credenciales")).toBeVisible()
  await expect(page.getByPlaceholder("tu@email.com")).toBeVisible()
  await expect(page.getByPlaceholder("********")).toBeVisible()
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible()
  await expect(page.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute(
    "href",
    "/auth/recuperar",
  )
  await expect(page.getByRole("link", { name: "Regístrate" })).toHaveAttribute(
    "href",
    "/auth/registro",
  )
})
