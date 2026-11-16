import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// Requiere staging con SUPABASE_SERVICE_ROLE_KEY + E2E_COUPON_ID.
// La activación necesita la service key (el handler /api/coupon-instance la exige).
// Estos tests se marcan fixme en producción; en staging se ejecutan quitando el fixme.
test.fixme(
  true,
  "Requiere staging con SUPABASE_SERVICE_ROLE_KEY y E2E_COUPON_ID configurados.",
)

const COUPON_ID = process.env.E2E_COUPON_ID ?? ""
const MOTIVO_SIN_COUPON = "Falta E2E_COUPON_ID: se necesita el UUID de un cupón de prueba en staging."

// ---------------------------------------------------------------------------
// Activación y página recuperable
// ---------------------------------------------------------------------------

test("activar un cupón real devuelve la instancia con coupon_code (no el UUID)", async ({
  request,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)

  const res = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Codigo Individual",
      consumer_phone: "+56900000001",
    },
  })

  expect(res.status()).toBe(200)

  const body = await res.json()

  // La respuesta debe incluir el code del cupón (legible por el consumidor)
  // y el id de la instancia (UUID que va en la URL permanente)
  expect(body).toHaveProperty("id")
  expect(body).toHaveProperty("coupon_code")
  expect(body).toHaveProperty("consumer_name", "Test Codigo Individual")
  expect(body).toHaveProperty("business_name")

  // El coupon_code no debe ser el mismo que el id de instancia (son cosas distintas)
  expect(body.coupon_code).not.toBe(body.id)
  // El id de instancia debe ser un UUID
  expect(body.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )
})

test("la URL recuperable /cupon/[id]/activar/[instanceId] carga con el coupon_code visible", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)

  // 1. Activar vía API para obtener el instanceId
  const res = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Recuperable",
    },
  })
  expect(res.status()).toBe(200)
  const { id: instanceId, coupon_code } = await res.json()

  // 2. Navegar a la URL recuperable
  await page.goto(`/cupon/${COUPON_ID}/activar/${instanceId}`)

  // 3. La página debe mostrar el coupon_code (ej: "QA-TEST-2026"), NO el UUID de instancia
  await expect(page.getByText(coupon_code)).toBeVisible({ timeout: 8000 })

  // 4. El nombre del consumidor debe estar visible
  await expect(page.getByText("Test Recuperable")).toBeVisible()

  // 5. Debe haber un botón o enlace para volver al cupón
  await expect(page.getByRole("link", { name: /volver|ver cupón/i })).toBeVisible()
})

test("la URL recuperable con instanceId inválido devuelve 404", async ({ page }) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)

  const response = await page.goto(
    `/cupon/${COUPON_ID}/activar/00000000-0000-0000-0000-000000000000`,
  )
  expect(response?.status()).toBe(404)
})

test("la pantalla de éxito después de activar muestra el coupon_code grande y los pasos", async ({
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)

  await page.goto(`/cupon/${COUPON_ID}/activar`)

  // Llenar el formulario de activación
  await page.getByLabel("Nombre completo").fill("Test Pantalla Exito")
  await page.getByRole("button", { name: "Activar mi cupón" }).click()

  // Esperar la pantalla de éxito
  await expect(page.getByText("¡Cupón activado!")).toBeVisible({ timeout: 10_000 })

  // Debe mostrar instrucciones de uso (pasos numerados)
  await expect(page.getByText(/muestra esta pantalla|momento de pagar/i)).toBeVisible()

  // Debe mostrar el coupon_code (texto grande)
  // No debe mostrar el UUID de la instancia directamente como "código"
  const codeBlock = page.locator("p.font-mono.text-3xl")
  await expect(codeBlock).toBeVisible()
  const codeText = await codeBlock.textContent()
  // El código debe ser corto (máx ~20 chars), no un UUID de 36 chars
  expect(codeText?.trim().length).toBeLessThan(30)

  // Debe haber botón de guardar enlace (no de copiar UUID)
  await expect(
    page.getByRole("button", { name: /guardar enlace/i }),
  ).toBeVisible()
})

// ---------------------------------------------------------------------------
// Con sesión: el comercio ve la instancia en el historial
// ---------------------------------------------------------------------------

test("después de activar, la instancia aparece en el historial de canjes del comercio", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // 1. Activar como consumidor
  const res = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Historial Instance",
    },
  })
  expect(res.status()).toBe(200)
  const { consumer_name } = await res.json()

  // 2. Login como comercio
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // 3. Ver historial de canjes
  await page.goto(`/dashboard/${COUPON_ID}/canjes`)

  // La instancia debe aparecer como "activación"
  await expect(page.getByText(consumer_name)).toBeVisible({ timeout: 8000 })
})
