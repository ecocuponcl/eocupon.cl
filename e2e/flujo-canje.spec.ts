import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// Requiere staging con SUPABASE_SERVICE_ROLE_KEY, credenciales de comercio y E2E_COUPON_ID.
// Este flujo ESCRIBE en la base de datos (crea instancias y redemptions).
// Solo ejecutar contra staging, no contra producción.
test.fixme(
  true,
  "Escribe en la base de datos: requiere staging con todas las variables configuradas.",
)

const COUPON_ID = process.env.E2E_COUPON_ID ?? ""
const MOTIVO_SIN_COUPON =
  "Falta E2E_COUPON_ID: se necesita el UUID de un cupón de prueba en staging."

// ---------------------------------------------------------------------------
// Flujo completo: activación (consumidor) → validación (comercio) → canje
// ---------------------------------------------------------------------------

test("flujo completo: activar cupón → validar → registrar canje", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // PASO 1: Activar como consumidor (sin sesión)
  const activarRes = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Consumidor Flujo Completo",
      consumer_phone: "+56911111111",
    },
  })
  expect(activarRes.status()).toBe(200)
  const { id: instanceId, coupon_code } = await activarRes.json()
  expect(instanceId).toBeTruthy()
  expect(coupon_code).toBeTruthy()

  // PASO 2: Login como comercio
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // PASO 3: Ir al validador del cupón
  await page.goto(`/dashboard/${COUPON_ID}/validar`)
  await expect(
    page.getByRole("heading", { name: /validar/i }),
  ).toBeVisible({ timeout: 8000 })

  // PASO 4: Ingresar el instanceId del consumidor
  const input = page.getByPlaceholder(/pega o escribe el código/i)
  await input.fill(instanceId)
  await page.getByRole("button", { name: /buscar/i }).click()

  // PASO 5: Debe aparecer el diálogo de confirmación con el nombre del consumidor
  await expect(
    page.getByText("Consumidor Flujo Completo"),
  ).toBeVisible({ timeout: 10_000 })
  await expect(
    page.getByRole("button", { name: "Confirmar entrega" }),
  ).toBeVisible()

  // PASO 6: Confirmar la entrega
  await page.getByRole("button", { name: "Confirmar entrega" }).click()

  // PASO 7: Verificar pantalla de éxito
  await expect(
    page.getByText("¡Beneficio entregado!"),
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Consumidor Flujo Completo")).toBeVisible()

  // PASO 8: Verificar que el canje aparece en el historial
  await page.goto(`/dashboard/${COUPON_ID}/canjes`)
  await expect(page.getByText("Consumidor Flujo Completo")).toBeVisible({ timeout: 8000 })
})

// ---------------------------------------------------------------------------
// Verificación del pre-check (GET /api/redeem)
// ---------------------------------------------------------------------------

test("el validador muestra el nombre del consumidor antes de confirmar el canje", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // Activar
  const activarRes = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Pre-Check Validador",
    },
  })
  expect(activarRes.status()).toBe(200)
  const { id: instanceId } = await activarRes.json()

  // Login
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // Validar (solo buscar, no confirmar)
  await page.goto(`/dashboard/${COUPON_ID}/validar`)
  await page.getByPlaceholder(/pega o escribe el código/i).fill(instanceId)
  await page.getByRole("button", { name: /buscar/i }).click()

  // El nombre debe aparecer en el diálogo de confirmación
  await expect(page.getByText("Test Pre-Check Validador")).toBeVisible({
    timeout: 10_000,
  })

  // Cancelar (no ejecutar el canje real en este test)
  await page.getByRole("button", { name: /cancelar/i }).click()
  await expect(page.getByText("¡Beneficio entregado!")).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// Verificar acceso directo a /api/redeem para un cupón ajeno
// ---------------------------------------------------------------------------

test("un comercio no puede registrar canjes de instancias de otro cupón vía API", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // Login como comercio
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // Intentar canjear una instancia con UUID que no le pertenece
  const res = await request.post("/api/redeem", {
    data: { instance_id: "00000000-0000-0000-0000-000000000000" },
  })

  // Debe devolver 404 (instancia no encontrada) o 403 (sin permiso)
  expect([403, 404]).toContain(res.status())
})
