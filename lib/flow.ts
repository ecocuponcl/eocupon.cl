import "server-only"
import { createHmac } from "node:crypto"
import { SITE_URL } from "@/lib/site-url"

/**
 * Cliente mínimo del API de Flow.
 *
 * Cada llamada va firmada: los parámetros se ordenan por nombre y se concatenan
 * como `clavevalor` **sin separadores** (así lo define Flow, no es un descuido),
 * y ese texto se firma con HMAC-SHA256 usando la secret key. La firma viaja como
 * `s` y la secret key nunca sale del servidor.
 */

const FLOW_API =
  process.env.FLOW_ENV === "sandbox"
    ? "https://sandbox.flow.cl/api"
    : "https://www.flow.cl/api"

export class FlowError extends Error {
  code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = "FlowError"
    this.code = code
  }
}

function sign(params: Record<string, string>, secret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("")
  return createHmac("sha256", secret).update(payload).digest("hex")
}

export async function flowCall<T>(
  service: string,
  params: Record<string, string | number>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const apiKey = process.env.FLOW_API_KEY
  const secret = process.env.FLOW_SECRET_KEY

  if (!apiKey || !secret) {
    throw new Error("Flow no está configurado: faltan FLOW_API_KEY o FLOW_SECRET_KEY")
  }

  const body: Record<string, string> = { apiKey }
  for (const [key, value] of Object.entries(params)) body[key] = String(value)
  body.s = sign(body, secret)

  const url = new URL(`${FLOW_API}/${service}`)
  const init: RequestInit = { cache: "no-store", signal: AbortSignal.timeout(15_000) }

  if (method === "GET") {
    for (const [key, value] of Object.entries(body)) url.searchParams.set(key, value)
  } else {
    init.method = "POST"
    init.headers = { "content-type": "application/x-www-form-urlencoded" }
    init.body = new URLSearchParams(Object.entries(body))
  }

  const response = await fetch(url, init)
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    const message = typeof json.message === "string" ? json.message : "Error de Flow"
    throw new FlowError(message, Number(json.code ?? response.status))
  }

  return json as T
}

const FLOW_TIME_ZONE = "America/Santiago"

/** Desfase de Chile respecto de UTC en un instante dado (cambia con el verano). */
function chileOffset(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FLOW_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant))

  const field = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    field("hour") % 24,
    field("minute"),
    field("second"),
  )

  return asUtc - instant
}

/**
 * Flow entrega las fechas como `yyyy-mm-dd hh:mm:ss` en hora de Chile y sin zona.
 * Interpretarlas tal cual depende del reloj del servidor (en Vercel corre en UTC y
 * quedaban 3 horas antes), así que se convierten explícitamente desde Chile.
 */
export function flowDate(value: string): Date | null {
  // La documentación de Flow escribe el formato como `yyyy-mm-dd hh:mm.ss`, pero
  // la API responde con dos puntos: se aceptan ambos separadores de segundos.
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})[:.](\d{2})$/.exec(value.trim())
  if (!match) return null

  const wall = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  )

  // Dos pasadas: el desfase de Chile cambia con el horario de verano.
  let instant = wall - chileOffset(wall)
  instant = wall - chileOffset(instant)

  return new Date(instant)
}

/** Precios y planes. El monto se puede mover por entorno sin tocar código. */
export const FLOW_PLANS = {
  mensual: {
    planId: "ecocupon-pro-mensual",
    name: "EcoCupon Pro mensual",
    amount: Number(process.env.FLOW_PRICE_MONTHLY ?? 9000),
    interval: 3,
  },
  anual: {
    planId: "ecocupon-pro-anual",
    name: "EcoCupon Pro anual",
    amount: Number(process.env.FLOW_PRICE_ANNUAL ?? 80000),
    interval: 4,
  },
} as const

export type BillingPeriod = keyof typeof FLOW_PLANS

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return value === "mensual" || value === "anual"
}

export interface FlowCustomer {
  customerId: string
}

export interface FlowCardRegister {
  url: string
  token: string
}

export interface FlowCardStatus {
  status: string
  customerId: string
  creditCardType?: string
  last4CardDigits?: string
}

export interface FlowSubscription {
  subscriptionId: string
  status: number
  period_end?: string
  next_invoice_date?: string
  subscription_end?: string
  cancel_at?: string | null
  invoices?: { id: number; status: number; amount?: string | number }[]
}

export interface FlowPaymentStatus {
  flowOrder: number
  commerceOrder?: string
  status: number
  amount?: string | number
  payer?: string
  subscriptionId?: string | number
  paymentData?: { date?: string }
}

/** Crea el plan si todavía no existe en la cuenta de Flow. */
export async function ensurePlan(period: BillingPeriod): Promise<(typeof FLOW_PLANS)[BillingPeriod]> {
  const plan = FLOW_PLANS[period]

  try {
    await flowCall("plans/get", { planId: plan.planId })
    return plan
  } catch {
    // Todavía no existe: se crea abajo.
  }

  await flowCall(
    "plans/create",
    {
      planId: plan.planId,
      name: plan.name,
      amount: plan.amount,
      currency: "CLP",
      interval: plan.interval,
      interval_count: 1,
      urlCallback: `${SITE_URL}/api/flow/callback`,
    },
    "POST",
  )

  return plan
}

/** Id del cliente en Flow; se crea una sola vez por usuario. */
export async function ensureCustomer(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null },
  existing: string | null,
): Promise<string> {
  if (existing) return existing

  const businessName =
    typeof user.user_metadata?.business_name === "string" && user.user_metadata.business_name.trim()
      ? user.user_metadata.business_name.trim()
      : user.email?.split("@")[0] || "Comercio EcoCupon"

  const customer = await flowCall<FlowCustomer>(
    "customer/create",
    { name: businessName, email: user.email ?? "", externalId: user.id },
    "POST",
  )

  return customer.customerId
}

/** URL de Flow donde el cliente enrola su tarjeta. */
export async function startCardRegister(
  customerId: string,
  period: BillingPeriod,
): Promise<string> {
  const register = await flowCall<FlowCardRegister>(
    "customer/register",
    {
      customerId,
      url_return: `${SITE_URL}/api/flow/registro?periodo=${period}`,
    },
    "POST",
  )

  return `${register.url}?token=${register.token}`
}