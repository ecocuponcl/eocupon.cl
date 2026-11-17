"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  effectivePlan,
  limitsFor,
  normalizePlan,
  trialDaysLeft,
  type PlanLimits,
  type PlanType,
} from "@/lib/plans"

/**
 * Plan del usuario con sesión abierta. La política `profiles_select_own`
 * permite leer la propia fila, así que no hace falta un endpoint.
 *
 * Sirve para la interfaz; la barrera real está en la base y en el servidor.
 */
export function usePlan() {
  const [plan, setPlan] = useState<PlanType>("free")
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      if (!user) {
        setLoading(false)
        return
      }

      // `select("*")` a propósito: `trial_ends_at` puede no existir todavía si
      // la migración 0015 no se aplicó, y pedir la columna por nombre haría
      // fallar la consulta entera.
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!active) return
      setPlan(normalizePlan(data?.plan_type))
      setTrialEndsAt(data?.trial_ends_at ?? null)
      setLoading(false)
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const effective: PlanType = effectivePlan(plan, trialEndsAt)
  const limits: PlanLimits = limitsFor(effective)

  return { plan, effective, limits, loading, trialDays: trialDaysLeft(trialEndsAt) }
}