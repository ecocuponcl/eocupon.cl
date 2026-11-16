import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// Requiere staging. Verifica las dos capas de protección anti-doble-canje:
//   1. Capa de código: SELECT previo en /api/redeem
//   2. Capa de BD: índice único (instance_id, period)
test.fixme(
  true,
  "Escribe en la base de datos: requiere staging con todas las variables configuradas.",
)

const COUPON_ID = process.env.E2E_COUPON_ID ?? ""
const MOTIVO_SIN_COUPON =
  "Falta E2E_COUPON_ID: se necesita el UUID de un cupón de prueba en staging."

// ---------------------------------------------------------------------------
// Bloqueo de doble canje (UI)
// ---------------------------------------------------------------------------

test("intentar canjear dos veces el mismo código muestra 'ya canjeó este periodo'", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // 1. Activar como consumidor
  const activarRes = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Doble Canje",
    },
  })
  expect(activarRes.status()).toBe(200)
  const { id: instanceId } = await activarRes.json()

  // 2. Login como comercio
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // 3. Primer canje (debe funcionar)
  await page.goto(`/dashboard/${COUPON_ID}/validar`)
  await page.getByPlaceholder(/pega o escribe el código/i).fill(instanceId)
  await page.getByRole("button", { name: /buscar/i }).click()
  await expect(page.getByRole("button", { name: "Confirmar entrega" })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole("button", { name: "Confirmar entrega" }).click()
  await expect(page.getByText("¡Beneficio entregado!")).toBeVisible({ timeout: 10_000 })

  // 4. Resetear y buscar el mismo código de nuevo
  await page.getByRole("button", { name: /validar otro/i }).click()
  await page.getByPlaceholder(/pega o escribe el código/i).fill(instanceId)
  await page.getByRole("button", { name: /buscar/i }).click()

  // 5. Debe mostrar que ya canjeó (no el diálogo de confirmación)
  await expect(page.getByText(/ya canjeó este periodo/i)).toBeVisible({
    timeout: 10_000,
  })
  await expect(
    page.getByRole("button", { name: "Confirmar entrega" }),
  ).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// Bloqueo de doble canje (API directa) — race condition
// ---------------------------------------------------------------------------

test("dos solicitudes POST simultáneas al mismo instanceId solo registran un canje", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // 1. Activar
  const activarRes = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Race Condition",
    },
  })
  expect(activarRes.status()).toBe(200)
  const { id: instanceId } = await activarRes.json()

  // 2. Login para obtener cookies de sesión
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // 3. Enviar dos solicitudes POST simultáneas (simula race condition)
  // Ambas van con las cookies de sesión que el browser ya tiene
  const [res1, res2] = await Promise.all([
    request.post("/api/redeem", { data: { instance_id: instanceId } }),
    request.post("/api/redeem", { data: { instance_id: instanceId } }),
  ])

  const statuses = [res1.status(), res2.status()].sort()
  // Una debe tener éxito (200) y la otra ser rechazada (409 already_redeemed)
  // O ambas 409 si la BD rechazó el primero también (índice único disparado antes del check)
  // En cualquier caso, NO pueden ser dos 200.
  const twoHundreds = statuses.filter((s) => s === 200).length
  expect(twoHundreds).toBeLessThanOrEqual(1)

  // Verificar que solo hay un redemption en el historial
  await page.goto(`/dashboard/${COUPON_ID}/canjes`)
  const rows = page.getByText("Test Race Condition")
  await expect(rows).toHaveCount(1, { timeout: 8000 })
})

// ---------------------------------------------------------------------------
// Pre-check devuelve estado correcto después del canje
// ---------------------------------------------------------------------------

test("el pre-check GET /api/redeem devuelve 409 para una instancia ya canjeada", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(
    !CREDENCIALES.email || !CREDENCIALES.password,
    MOTIVO_SIN_CREDENCIALES,
  )

  // 1. Activar + hacer login + canjear
  const activarRes = await request.post("/api/coupon-instance", {
    data: { coupon_id: COUPON_ID, consumer_name: "Test Pre-Check Post-Canje" },
  })
  const { id: instanceId } = await activarRes.json()

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // Canjear
  const redeemRes = await request.post("/api/redeem", {
    data: { instance_id: instanceId },
  })
  expect(redeemRes.status()).toBe(200)

  // 2. Pre-check (GET) debe ahora devolver 409
  const checkRes = await request.get(
    `/api/redeem?instance_id=${instanceId}&coupon_id=${COUPON_ID}`,
  )
  expect(checkRes.status()).toBe(409)
  const checkBody = await checkRes.json()
  expect(checkBody.code).toBe("already_redeemed")
})
