import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty"
import {
  ArrowLeft,
  CheckCircle2,
  Ticket,
  Users,
  TrendingUp,
  QrCode,
} from "lucide-react"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CanjesPage({ params }: PageProps) {
  const { id } = await params

  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Verificar que el cupón pertenece al usuario
  const { data: coupon } = await supabase
    .from("coupons")
    .select("id, title, business_name, discount_percentage, coupon_code, redemption_period")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!coupon) notFound()

  const admin = createAdminClient()
  const reader = admin ?? supabase

  // Instancias del cupón
  const { data: instances } = await reader
    .from("coupon_instances")
    .select("id, consumer_name, consumer_phone, activated_at, expires_at, is_active")
    .eq("coupon_id", id)
    .order("activated_at", { ascending: false })
    .limit(100)

  // Canjes del comercio autenticado para este cupón
  const { data: redemptions } = await reader
    .from("redemptions")
    .select("id, instance_id, redeemed_at, period, notes, coupon_instances(consumer_name, consumer_phone)")
    .eq("redeemed_by", user.id)
    .order("redeemed_at", { ascending: false })
    .limit(200)

  // Filtrar solo los canjes que pertenecen a instancias de este cupón
  const instanceIds = new Set((instances ?? []).map((i) => i.id))
  const couponRedemptions = (redemptions ?? []).filter((r) =>
    instanceIds.has(r.instance_id)
  )

  const stats = {
    instances: instances?.length ?? 0,
    redemptions: couponRedemptions.length,
    conversion:
      (instances?.length ?? 0) > 0
        ? Math.round((couponRedemptions.length / (instances?.length ?? 1)) * 100)
        : 0,
  }

  const periodLabel: Record<string, string> = {
    once: "canje único",
    daily: "diario",
    weekly: "semanal",
    monthly: "mensual",
    unlimited: "ilimitado",
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{coupon.title}</h1>
          <p className="text-muted-foreground">
            {coupon.business_name} ·{" "}
            <span className="font-mono font-semibold">{coupon.coupon_code}</span>
            {coupon.redemption_period && (
              <span className="ml-1 text-xs">
                · {periodLabel[coupon.redemption_period] ?? coupon.redemption_period}
              </span>
            )}
          </p>
        </div>
        <Link href={`/dashboard/${id}/validar`}>
          <Button size="sm" className="gap-2">
            <QrCode className="h-4 w-4" />
            Validar canje
          </Button>
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.instances}</p>
              <p className="text-sm text-muted-foreground">Activaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
              <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.redemptions}</p>
              <p className="text-sm text-muted-foreground">Canjes confirmados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/50">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.conversion}%</p>
              <p className="text-sm text-muted-foreground">Conversión</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de canjes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Canjes confirmados
        </h2>

        {couponRedemptions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Ticket className="h-10 w-10" />
              </EmptyMedia>
              <EmptyTitle>Sin canjes todavía</EmptyTitle>
              <EmptyDescription>
                Los canjes aparecerán aquí cuando valides el beneficio de un cliente.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={`/dashboard/${id}/validar`}>
                <Button className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Ir al validador
                </Button>
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-3">
            {couponRedemptions.map((r) => {
              const consumer = r.coupon_instances as unknown as {
                consumer_name: string
                consumer_phone: string | null
              } | null

              return (
                <Card key={r.id} className="border-border">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {consumer?.consumer_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {consumer?.consumer_name ?? "Cliente"}
                      </p>
                      {consumer?.consumer_phone && (
                        <p className="text-xs text-muted-foreground">
                          {consumer.consumer_phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(r.redeemed_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.redeemed_at).toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {r.period === "once" ? "único" : r.period}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
