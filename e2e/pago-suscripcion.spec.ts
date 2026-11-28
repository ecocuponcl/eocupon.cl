import { expect, test, type Page } from "@playwright/test"
import {
  MOTIVO_SIN_ENTORNO,
  PAGO,
  assertNoProduccion,
  asegurarRut,
  asegurarUsuario,
  entornoListo,
  flowCall,
  inscribirTarjeta,
  login,
  pagarOrden,
  perfil,
  reiniciarSuscripcion,
  supabaseGet,
  suscribirse,
} from "./pago-helpers"

/**
 * E2E de suscripciones y cobros con Flow Sandbox.
 *
 * Requiere un entorno de staging (ver docs/runbooks/staging-e2e.md). Sin él la
 * suite se omite: nunca escribe en el proyecto Supabase de producción.
 * El aviso de Flow se inyecta llamando al mismo endpoint que Flow usa, porque el
 * callback real necesita una URL pública que en CI no está disponible.
 */

test.describe.configure({ mode: "serial" })

interface Perfil {
  id: string
  email: string
  plan_type: string
  billing_period: string | null
  plan_ends_at: string | null
  flow_customer_id: string | null
  flow_subscription_id: string | null
}

async function perfilActual(): Promise<Perfil> {
  return perfil()
}

async function totalSuscripciones(customerId: string): Promise<number> {
  const r = await flowCall<{ total: number }>("customer/getSubscriptions", { customerId })
  return r.total
}

async function pagosDeOrden(flowOrder: number): Promise<number> {
  const filas = await supabaseGet<unknown[]>(`flow_payments?flow_order=eq.${flowOrder}&select=flow_order`)
  return filas.length
}

async function crearOrden(commerceOrder: string, amount: number) {
  return flowCall<{ token: string; url: string; flowOrder: number }>(
    "payment/create",
    {
      commerceOrder,
      subject: "E2E EcoCupon",
      currency: "CLP",
      amount,
      email: PAGO.email,
      paymentMethod: 9,
      urlConfirmation: "http://127.0.0.1:9/e2e",
      urlReturn: PAGO.baseURL,
    },
    "POST",
  )
}

async function avisar(page: Page, token: string) {
  const res = await page.request.post(`${PAGO.baseURL}/api/flow/callback`, { form: { token } })
  return { status: res.status(), json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}

test.beforeEach(() => {
  test.skip(!entornoListo(), MOTIVO_SIN_ENTORNO)
  test.setTimeout(180_000)
})

test.beforeAll(async () => {
  if (!entornoListo()) return
  assertNoProduccion()
  await asegurarUsuario()
  await reiniciarSuscripcion()
})

test("la suscripción activa el plan y fija plan_ends_at", async ({ page }) => {
  await login(page)
  await asegurarRut(page)
  await suscribirse(page, "Anual")
  await inscribirTarjeta(page)

  await page.waitForURL(/\/dashboard\/cuenta\?estado=(activo|pendiente)/, { timeout: 120_000 })
  expect(page.url()).toContain("estado=activo")
  await expect(page.getByText(/Pro, hasta el/)).toBeVisible()

  const p = await perfilActual()
  expect(p.plan_type).toBe("pro")
  expect(p.billing_period).toBe("anual")
  expect(p.flow_subscription_id).toBeTruthy()
  expect(new Date(p.plan_ends_at ?? 0).getTime()).toBeGreaterThan(Date.now())
})

test("volver a pulsar el plan no crea una segunda suscripción", async ({ page }) => {
  const antes = await perfilActual()

  await login(page)
  await suscribirse(page, "Anual")
  await inscribirTarjeta(page)
  await page.waitForURL(/\/dashboard\/cuenta\?estado=activo/, { timeout: 120_000 })

  const despues = await perfilActual()
  expect(despues.flow_subscription_id).toBe(antes.flow_subscription_id)
  expect(await totalSuscripciones(despues.flow_customer_id!)).toBe(1)
})

test("una suscripción cancelada se puede volver a contratar", async ({ page }) => {
  const antes = await perfilActual()
  await flowCall("subscription/cancel", { subscriptionId: antes.flow_subscription_id! }, "POST")

  await login(page)
  await suscribirse(page, "Anual")
  await inscribirTarjeta(page)
  await page.waitForURL(/\/dashboard\/cuenta\?estado=activo/, { timeout: 120_000 })

  const despues = await perfilActual()
  expect(despues.flow_subscription_id).not.toBe(antes.flow_subscription_id)
  expect(despues.plan_type).toBe("pro")
})

test("el aviso de pago registra el cobro y el duplicado no extiende el periodo", async ({ page }) => {
  const p = await perfilActual()
  const orden = await crearOrden(`sus_${p.flow_subscription_id}_e2e_${Date.now()}`, PAGO.monto)

  await pagarOrden(page, orden.url)
  const antes = await perfilActual()

  const primero = await avisar(page, orden.token)
  expect(primero.status).toBe(200)
  expect(primero.json.ok).toBe(true)
  expect(await pagosDeOrden(orden.flowOrder)).toBe(1)

  const conPago = await perfilActual()
  expect(conPago.plan_ends_at).toBeTruthy()

  const segundo = await avisar(page, orden.token)
  expect(segundo.status).toBe(200)
  expect(segundo.json.duplicated).toBe(true)
  expect(await pagosDeOrden(orden.flowOrder)).toBe(1)
  expect((await perfilActual()).plan_ends_at).toBe(conPago.plan_ends_at)

  // La fecha no depende del orden de los avisos: debe seguir siendo la de Flow.
  expect(conPago.plan_ends_at).not.toBe(antes.plan_ends_at ?? "sin-fecha")
})

test("un pago rechazado no registra cobro ni extiende el periodo", async ({ page }) => {
  const p = await perfilActual()
  const antes = p.plan_ends_at
  const orden = await crearOrden(`sus_${p.flow_subscription_id}_e2e_rechazo_${Date.now()}`, PAGO.monto)

  await pagarOrden(page, orden.url, true)
  const aviso = await avisar(page, orden.token)

  expect(aviso.status).toBe(200)
  expect(aviso.json.status).toBe(3)
  expect(await pagosDeOrden(orden.flowOrder)).toBe(0)
  expect((await perfilActual()).plan_ends_at).toBe(antes)
})

test("un importe distinto al del plan se ignora", async ({ page }) => {
  const p = await perfilActual()
  const antes = p.plan_ends_at
  const orden = await crearOrden(`sus_${p.flow_subscription_id}_e2e_monto_${Date.now()}`, 500)

  await pagarOrden(page, orden.url)
  const aviso = await avisar(page, orden.token)

  expect(aviso.status).toBe(200)
  expect(aviso.json.ignored).toBe("amount")
  expect(await pagosDeOrden(orden.flowOrder)).toBe(0)
  expect((await perfilActual()).plan_ends_at).toBe(antes)
})

test("un token que Flow no conoce devuelve error", async ({ page }) => {
  const aviso = await avisar(page, "token-que-no-existe")
  expect(aviso.status).toBe(500)
})

test("un aviso sin token responde 400", async ({ page }) => {
  const res = await page.request.post(`${PAGO.baseURL}/api/flow/callback`, { form: {} })
  expect(res.status()).toBe(400)
})