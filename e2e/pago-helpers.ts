import { createHmac } from "node:crypto"
import type { Page } from "@playwright/test"

/**
 * Utilidades del E2E de pagos.
 *
 * La suite solo corre contra Flow Sandbox y una base de staging: sin esas
 * variables se omite. Nunca escribe en el proyecto Supabase de producción.
 */

export const PROYECTO_PRODUCCION = "vwjdfyljacoxwabtfoco"

export const PAGO = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  staging: process.env.E2E_STAGING === "1",
  email: process.env.E2E_USER_EMAIL ?? "",
  password: process.env.E2E_USER_PASSWORD ?? "",
  supabaseUrl: (process.env.E2E_SUPABASE_URL ?? "").replace(/\/$/, ""),
  serviceKey: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "",
  flowKey: process.env.FLOW_E2E_API_KEY ?? "",
  flowSecret: process.env.FLOW_E2E_SECRET_KEY ?? "",
  monto: Number(process.env.FLOW_E2E_PLAN_AMOUNT ?? 80_000),
  tarjeta: {
    numero: process.env.E2E_CARD_NUMBER ?? "4051885600446623",
    vence: process.env.E2E_CARD_EXP ?? "11/27",
    cvv: process.env.E2E_CARD_CVV ?? "123",
    rut: process.env.E2E_BANK_RUT ?? "11111111-1",
    clave: process.env.E2E_BANK_PASSWORD ?? "123",
  },
}

export const MOTIVO_SIN_ENTORNO =
  "Falta entorno de staging para el E2E de pagos: E2E_STAGING=1, " +
  "E2E_USER_EMAIL/PASSWORD, E2E_SUPABASE_URL/SERVICE_ROLE_KEY y " +
  "FLOW_E2E_API_KEY/FLOW_E2E_SECRET_KEY."

export function entornoListo(): boolean {
  return Boolean(
    PAGO.staging &&
      PAGO.email &&
      PAGO.password &&
      PAGO.supabaseUrl &&
      PAGO.serviceKey &&
      PAGO.flowKey &&
      PAGO.flowSecret,
  )
}

/** Aborta si la base configurada es la de producción, aunque el flag esté puesto. */
export function assertNoProduccion(): void {
  if (PAGO.supabaseUrl.includes(PROYECTO_PRODUCCION)) {
    throw new Error(
      "E2E_SUPABASE_URL apunta al proyecto Supabase de producción: la suite de pagos se aborta.",
    )
  }
}

export type RespuestaFlow<T> = T & { message?: string; code?: number }

export async function flowCall<T>(
  service: string,
  params: Record<string, string | number>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const body: Record<string, string> = { apiKey: PAGO.flowKey }
  for (const [key, value] of Object.entries(params)) body[key] = String(value)

  const payload = Object.keys(body)
    .sort()
    .map((key) => `${key}${body[key]}`)
    .join("")
  body.s = createHmac("sha256", PAGO.flowSecret).update(payload).digest("hex")

  const url = new URL(`https://sandbox.flow.cl/api/${service}`)
  let init: RequestInit = {}
  if (method === "GET") {
    for (const [key, value] of Object.entries(body)) url.searchParams.set(key, value)
  } else {
    init = {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(Object.entries(body)),
    }
  }

  const res = await fetch(url, init)
  const json = (await res.json().catch(() => ({}))) as RespuestaFlow<T>
  if (!res.ok) {
    throw new Error(`Flow ${service} (${res.status}): ${json.message ?? "error"}`)
  }
  return json as T
}

export async function supabaseGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PAGO.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: PAGO.serviceKey, Authorization: `Bearer ${PAGO.serviceKey}` },
  })
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status}`)
  return (await res.json()) as T
}

export interface PerfilPago {
  id: string
  email: string
  plan_type: string
  billing_period: string | null
  plan_ends_at: string | null
  flow_customer_id: string | null
  flow_subscription_id: string | null
}

export async function perfil(): Promise<PerfilPago> {
  const filas = await supabaseGet<PerfilPago[]>(
    `profiles?email=eq.${encodeURIComponent(PAGO.email)}&select=id,email,plan_type,billing_period,plan_ends_at,flow_customer_id,flow_subscription_id`,
  )
  if (!filas.length) throw new Error(`No hay perfil para ${PAGO.email} en staging`)
  return filas[0]
}

/** Crea el usuario de prueba en staging si no existe y le deja un RUT válido. */
export async function asegurarUsuario(): Promise<void> {
  const cabeceras = { apikey: PAGO.serviceKey, Authorization: `Bearer ${PAGO.serviceKey}` }

  const crear = await fetch(`${PAGO.supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { ...cabeceras, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: PAGO.email,
      password: PAGO.password,
      email_confirm: true,
      user_metadata: { business_name: "Prueba Pagos" },
    }),
  })
  // 422 = ya existe: sirve igual.
  if (!crear.ok && crear.status !== 422) {
    throw new Error(`No se pudo crear el usuario de prueba (${crear.status})`)
  }

  // El trigger crea el perfil; puede tardar un instante.
  let filas: { id: string }[] = []
  for (let intento = 0; intento < 5 && !filas.length; intento++) {
    filas = await supabaseGet<{ id: string }[]>(
      `profiles?email=eq.${encodeURIComponent(PAGO.email)}&select=id`,
    )
    if (!filas.length) await new Promise((listo) => setTimeout(listo, 500))
  }
  if (!filas.length) throw new Error(`El usuario no tiene perfil: ${PAGO.email}`)

  await fetch(`${PAGO.supabaseUrl}/rest/v1/profiles?id=eq.${filas[0].id}`, {
    method: "PATCH",
    headers: { ...cabeceras, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ rut: "11111111-1" }),
  })
}

/** Deja el perfil sin suscripción para que la suite se pueda repetir. */
export async function reiniciarSuscripcion(): Promise<void> {
  const p = await perfil()

  if (p.flow_subscription_id) {
    try {
      await flowCall("subscription/cancel", { subscriptionId: p.flow_subscription_id }, "POST")
    } catch {
      // Si ya estaba cancelada, da lo mismo.
    }
  }

  await fetch(`${PAGO.supabaseUrl}/rest/v1/profiles?id=eq.${p.id}`, {
    method: "PATCH",
    headers: {
      apikey: PAGO.serviceKey,
      Authorization: `Bearer ${PAGO.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      plan_type: "free",
      plan_ends_at: null,
      billing_period: null,
      flow_subscription_id: null,
    }),
  })
}

export async function login(page: Page): Promise<void> {
  await page.goto("/auth/login")
  await page.locator("input[type=email]").fill(PAGO.email)
  await page.locator("input[type=password]").fill(PAGO.password)
  await page.locator("button[type=submit]").click()
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
}

/** El RUT es obligatorio para suscribirse; si falta, se guarda uno de prueba. */
export async function asegurarRut(page: Page): Promise<void> {
  await page.goto("/dashboard/cuenta")
  const input = page.getByPlaceholder("12.345.678-9")
  if (await input.isVisible().catch(() => false)) {
    const actual = await input.inputValue()
    if (!actual) {
      await input.fill("11111111-1")
      await page.getByRole("button", { name: "Guardar RUT" }).click()
      await page.waitForLoadState("networkidle")
    }
  }
}

/** Pulsa el plan y espera a que la app redirija a Flow. */
export async function suscribirse(page: Page, plan: "Mensual" | "Anual"): Promise<void> {
  await page.getByRole("button", { name: new RegExp(plan) }).click()
  await page.waitForURL(/sandbox\.flow\.cl/, { timeout: 90_000 })
}

/** Completa el formulario hospedado de inscripción de tarjeta. */
export async function inscribirTarjeta(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Continuar" }).click()
  await page.waitForURL(/webpay3gint\.transbank\.cl/, { timeout: 90_000 })

  await page.getByRole("button", { name: /^Tarjetas/ }).first().click()

  const numero = page.getByRole("textbox", { name: "Número de tarjeta" })
  await numero.pressSequentially(PAGO.tarjeta.numero, { delay: 25 })
  await page.locator("button.submit").first().click()

  await page.getByRole("textbox", { name: "Fecha de expiración" }).fill(PAGO.tarjeta.vence)
  await page.getByRole("textbox", { name: "CVV" }).fill(PAGO.tarjeta.cvv)
  await page.locator("span", { hasText: "Es mi correo" }).first().click()
  await page.getByRole("button", { name: "Inscribir mi tarjeta" }).click()

  // Simulador del banco.
  await page.locator("#rutClient").fill(PAGO.tarjeta.rut)
  await page.locator("#passwordClient").fill(PAGO.tarjeta.clave)
  await page.locator("button:has-text('Aceptar')").first().click()
  await page.locator("button:has-text('Continuar')").first().click()
}

/** Paga (o rechaza) una orden de Flow Sandbox y vuelve a la app. */
export async function pagarOrden(page: Page, url: string, rechazar = false): Promise<void> {
  await page.goto(url)
  await page.locator('a:has-text("Tarjetas de crédito y débito")').first().click()
  await page.getByRole("button", { name: "Pagar ahora" }).click()

  if (rechazar) {
    await page.selectOption("select", { label: "Quiero rechazar el pago de la orden" })
  }
  await page.getByRole("button", { name: "Confirmar" }).click()
}