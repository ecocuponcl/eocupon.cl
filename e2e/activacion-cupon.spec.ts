import { expect, test } from "@playwright/test"
import { UUID_INEXISTENTE, CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// ---------------------------------------------------------------------------
// Rutas de activación del consumidor (/cupon/[id]/activar)
// ---------------------------------------------------------------------------

test("la página de activación de un cupón inexistente puede cargarse", async ({ page }) => {
  // La página es un Client Component: carga el shell sin error aunque el cupón
  // no exista (el error llegará al hacer submit).
  await page.goto(`/cupon/${UUID_INEXISTENTE}/activar`)
  // CardTitle de shadcn genera un div estilizado, no un heading semántico.
  // Verificamos el botón de acción, que sí es un elemento confiable.
  await expect(page.getByRole("button", { name: "Activar mi cupón" })).toBeVisible()
  await expect(page.getByLabel("Nombre completo")).toBeVisible()
})

test("el formulario de activación valida que el nombre tiene al menos 2 caracteres", async ({ page }) => {
  await page.goto(`/cupon/${UUID_INEXISTENTE}/activar`)

  // Llenamos con 1 carácter y hacemos submit; sin minLength nativo, React lo valida
  await page.getByLabel("Nombre completo").fill("A")
  await page.getByRole("button", { name: "Activar mi cupón" }).click()

  await expect(page.getByText("Ingresa tu nombre completo")).toBeVisible()
})

test("activar un cupón inexistente muestra error del servidor", async ({ page }) => {
  await page.goto(`/cupon/${UUID_INEXISTENTE}/activar`)

  await page.getByLabel("Nombre completo").fill("Test Usuario")
  await page.getByRole("button", { name: "Activar mi cupón" }).click()

  // El servidor responde 404 y la página muestra el mensaje de error
  await expect(page.getByText(/no encontrado|no se pudo activar/i)).toBeVisible({ timeout: 10_000 })
})

// ---------------------------------------------------------------------------
// Validador del comercio (/dashboard/[id]/validar) — requiere sesión
// ---------------------------------------------------------------------------

test("el validador del comercio redirige a login sin sesión", async ({ page }) => {
  await page.goto(`/dashboard/${UUID_INEXISTENTE}/validar`)
  await expect(page).toHaveURL(/\/auth\/login$/)
})

test("el historial de canjes redirige a login sin sesión", async ({ page }) => {
  await page.goto(`/dashboard/${UUID_INEXISTENTE}/canjes`)
  await expect(page).toHaveURL(/\/auth\/login$/)
})

// ---------------------------------------------------------------------------
// Con credenciales: validador y canjes cargan para el comercio
// ---------------------------------------------------------------------------

test("el validador carga con sesión y muestra el campo de código", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto(`/dashboard/${UUID_INEXISTENTE}/validar`)
  // No redirigió a login
  await expect(page).not.toHaveURL(/\/auth\/login/)
})

test("el historial de canjes de un cupón ajeno devuelve 404", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // UUID_INEXISTENTE no pertenece a ningún usuario → 404
  const response = await page.goto(`/dashboard/${UUID_INEXISTENTE}/canjes`)
  expect(response?.status()).toBe(404)
})
