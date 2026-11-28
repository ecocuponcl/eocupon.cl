import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { effectivePlan, PLAN_LIMITS, trialDaysLeft } from "@/lib/plans"
import { FLOW_PLANS } from "@/lib/flow"
import { RutForm } from "@/components/rut-form"
import { FlowSubscribe } from "@/components/flow-subscribe"

const DATE = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Santiago",
})

export const metadata = { title: "Mi cuenta" }

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { estado } = await searchParams

  const { data: profile } = await supabase
    .from("profiles")
    .select("rut, plan_type, trial_ends_at, plan_ends_at, billing_period, flow_subscription_id")
    .eq("id", user.id)
    .single()

  const plan = effectivePlan(profile?.plan_type, profile?.trial_ends_at, profile?.plan_ends_at)
  const trialLeft = trialDaysLeft(profile?.trial_ends_at)
  const paidUntil = profile?.plan_ends_at ? new Date(profile.plan_ends_at) : null
  const paidActive = plan === "pro" && paidUntil !== null && paidUntil > new Date()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi cuenta</h1>
        <p className="text-muted-foreground">Tu plan, tu RUT y la boleta de la suscripción.</p>
      </div>

      {estado === "activo" ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
          Suscripción activa. Ya puedes usar las funciones de Pro.
        </div>
      ) : null}
      {estado === "tarjeta" ? (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          No quedó registrada la tarjeta. Inténtalo de nuevo.
        </div>
      ) : null}
      {estado === "pendiente" ? (
        <div className="rounded-lg bg-muted p-3 text-sm" role="status">
          Quedó pendiente confirmar el cobro con Flow. El acceso se activa cuando Flow confirme el
          pago; si tu tarjeta fue rechazada, escríbenos por WhatsApp.
        </div>
      ) : null}
      {estado === "error" ? (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          No pudimos completar el cobro. Si te cobraron, escríbenos por WhatsApp.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Plan actual</CardTitle>
          <CardDescription>
            {paidActive
              ? `Pro, hasta el ${DATE.format(paidUntil)}${profile?.billing_period ? ` (plan ${profile.billing_period})` : ""}.`
              : plan === "pro" && trialLeft > 0
                ? `Prueba de Pro: ${trialLeft} ${trialLeft === 1 ? "día" : "días"} restantes.`
                : "Gratis. Hasta 3 cupones por mes y sin logo en el cupón."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {paidActive
              ? `${PLAN_LIMITS.pro.couponsPerMonth} cupones al mes y el logo de tu negocio en el cupón.`
              : "Con Pro: 50 cupones al mes y el logo de tu negocio en el cupón."}
          </p>

          {paidActive ? null : (
            <div>
              <h2 className="mb-2 text-sm font-medium">Suscribirme a Pro</h2>
              <FlowSubscribe
                prices={{ mensual: FLOW_PLANS.mensual.amount, anual: FLOW_PLANS.anual.amount }}
                disabled={!profile?.rut}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la boleta</CardTitle>
          <CardDescription>El RUT con el que se emite cada cobro de Flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <RutForm rut={profile?.rut ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}