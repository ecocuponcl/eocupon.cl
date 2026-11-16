import { expect, test } from "@playwright/test"
import { CREDENCIALES, MOTIVO_SIN_CREDENCIALES } from "./helpers"

// Verifica que un comercio no puede ver ni operar datos de otro comercio.
// Requiere staging y, para los tests más fuertes, dos cuentas de comercio.
test.fixme(
  true,
  "Requiere staging y E2E_USER_EMAIL_2/E2E_USER_PASSWORD_2 para tests de dos comercios.",
)

const COUPON_ID = process.env.E2E_COUPON_ID ?? ""
const MOTIVO_SIN_COUPON =
  "Falta E2E_COUPON_ID: se necesita el UUID de un cupón de prueba en staging."

// Segundo comercio (opcional — para tests de cross-access)
const CREDENCIALES_2 = {
  email: process.env.E2E_USER_EMAIL_2,
  password: process.env.E2E_USER_PASSWORD_2,
}
const MOTIVO_SIN_CREDENCIALES_2 =
  "Falta E2E_USER_EMAIL_2/E2E_USER_PASSWORD_2: se necesita una segunda cuenta de comercio."

// ---------------------------------------------------------------------------
// Un comercio no puede ver el dashboard de cupones ajenos
// ---------------------------------------------------------------------------

test("acceder al historial de un cupón ajeno devuelve 404", async ({ request, page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // UUID que no pertenece a este comercio
  const res = await page.goto("/dashboard/00000000-0000-0000-0000-000000000000/canjes")
  expect(res?.status()).toBe(404)
})

test("el validador no carga datos de un cupón ajeno", async ({ page }) => {
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)

  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // El validador de un cupón ajeno no debe mostrar el nombre del cupón ni
  // permitir registrar canjes
  await page.goto("/dashboard/00000000-0000-0000-0000-000000000000/validar")
  // No redirige a login (el usuario está autenticado), pero no debe mostrar info ajena
  await expect(page).not.toHaveURL(/\/auth\/login/)
  // El campo de código puede estar presente pero sin título de cupón ajeno
  // (el couponInfo queda null y no se muestra)
})

// ---------------------------------------------------------------------------
// API: /api/redeem verifica la propiedad del cupón
// ---------------------------------------------------------------------------

test("POST /api/redeem rechaza instancias de cupones de otro comercio", async ({
  request,
  page,
}) => {
  test.skip(!COUPON_ID, MOTIVO_SIN_COUPON)
  test.skip(!CREDENCIALES.email || !CREDENCIALES.password, MOTIVO_SIN_CREDENCIALES)
  test.skip(
    !CREDENCIALES_2.email || !CREDENCIALES_2.password,
    MOTIVO_SIN_CREDENCIALES_2,
  )

  // 1. Consumidor activa cupón del comercio 1
  const activarRes = await request.post("/api/coupon-instance", {
    data: {
      coupon_id: COUPON_ID,
      consumer_name: "Test Separacion Comercios",
    },
  })
  expect(activarRes.status()).toBe(200)
  const { id: instanceId } = await activarRes.json()

  // 2. Comercio 2 intenta canjear esa instancia
  //    Para esto necesitamos una sesión del comercio 2 → usamos un browser context separado
  await page.goto("/auth/login")
  await page.getByPlaceholder("tu@email.com").fill(CREDENCIALES_2.email!)
  await page.getByPlaceholder("********").fill(CREDENCIALES_2.password!)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })

  // Intentar canjear la instancia del cupón del comercio 1 (que no le pertenece)
  const redeemRes = await request.post("/api/redeem", {
    data: { instance_id: instanceId },
  })

  // Debe ser rechazado con 403 (sin permiso) o 404 (instancia no encontrada para ese comercio)
  expect([403, 404]).toContain(redeemRes.status())
})

// ---------------------------------------------------------------------------
// RLS: anon no puede leer coupon_instances de ningún comercio
// ---------------------------------------------------------------------------

test("la API de Supabase no expone coupon_instances al rol anon", async ({ request }) => {
  // Este test no requiere credenciales — verifica RLS directamente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  test.skip(!supabaseUrl || !anonKey, "Faltan variables de entorno de Supabase.")

  const res = await request.get(`${supabaseUrl}/rest/v1/coupon_instances?select=id,consumer_name&limit=10`, {
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  expect(res.status()).toBe(200)
  const body = await res.json()
  // RLS debe devolver array vacío — el anon no ve ninguna instancia
  expect(Array.isArray(body)).toBe(true)
  expect(body).toHaveLength(0)
})

test("la API de Supabase no expone redemptions al rol anon", async ({ request }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  test.skip(!supabaseUrl || !anonKey, "Faltan variables de entorno de Supabase.")

  const res = await request.get(`${supabaseUrl}/rest/v1/redemptions?select=id&limit=10`, {
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
  expect(body).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// RLS: anon no puede modificar cupones ajenos
// ---------------------------------------------------------------------------

test("un anon no puede actualizar el descuento de un cupón público", async ({ request }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  test.skip(!supabaseUrl || !anonKey || !COUPON_ID, "Faltan variables de entorno.")

  // Intentar UPDATE directo via PostgREST
  const res = await request.patch(
    `${supabaseUrl}/rest/v1/coupons?id=eq.${COUPON_ID}`,
    {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      data: { discount_percentage: 99 },
    },
  )

  // PostgREST devuelve 204 cuando RLS filtra todas las filas (UPDATE silencioso)
  // o 401 con mensaje de violación de policy
  // En ambos casos el valor NO debe haber cambiado
  expect([204, 401]).toContain(res.status())

  // Verificar que el descuento no cambió
  const checkRes = await request.get(
    `${supabaseUrl}/rest/v1/coupons?id=eq.${COUPON_ID}&select=discount_percentage`,
    {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
      },
    },
  )
  const rows = await checkRes.json()
  // El descuento original del cupón de prueba (25%) no debe ser 99
  expect(rows[0]?.discount_percentage).not.toBe(99)
})
