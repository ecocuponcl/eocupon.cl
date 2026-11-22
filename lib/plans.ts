/**
 * Límites por plan. Fuente única para la interfaz y para el servidor.
 *
 * El límite mensual se aplica además en la base (`0015_plan_limits.sql`),
 * porque el cliente inserta cupones directo contra PostgREST: un chequeo sólo
 * en React se salta con una petición a mano.
 */
export type PlanType = "free" | "pro" | "business"

export interface PlanLimits {
  label: string
  /** Cupones por mes calendario. `null` = sin límite. */
  couponsPerMonth: number | null
  /** Logo del negocio en el cupón. */
  logo: boolean
}

/** Días de Pro que recibe una cuenta nueva. */
export const TRIAL_DAYS = 7

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { label: "Gratis", couponsPerMonth: 3, logo: false },
  pro: { label: "Pro", couponsPerMonth: 50, logo: true },
  business: { label: "Business", couponsPerMonth: null, logo: true },
}

export function normalizePlan(value: string | null | undefined): PlanType {
  return value === "pro" || value === "business" ? value : "free"
}

/** Un prueba vigente da las funciones de Pro sin cambiar el plan guardado. */
export function effectivePlan(
  value: string | null | undefined,
  trialEndsAt: string | null | undefined,
  planEndsAt?: string | null,
): PlanType {
  const plan = normalizePlan(value)

  // Pro y Business son de pago: si el periodo venció, la cuenta opera como free
  // aunque el plan guardado siga escrito (la misma regla vive en el trigger).
  if (plan !== "free" && planEndsAt) {
    const end = new Date(planEndsAt).getTime()
    if (Number.isFinite(end) && end <= Date.now()) return "free"
  }

  if (trialEndsAt) {
    const end = new Date(trialEndsAt).getTime()
    if (Number.isFinite(end) && end > Date.now()) return "pro"
  }
  return plan
}

export function limitsFor(value: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlan(value)]
}

/** Días que quedan de prueba; 0 si no hay o ya venció. */
export function trialDaysLeft(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0
  const end = new Date(trialEndsAt).getTime()
  if (!Number.isFinite(end)) return 0
  const left = Math.ceil((end - Date.now()) / 86_400_000)
  return left > 0 ? left : 0
}