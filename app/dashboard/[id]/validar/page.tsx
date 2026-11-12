"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ArrowLeft,
  Ticket,
  Clock,
  User,
  Phone,
  Loader2,
} from "lucide-react"

type RedeemState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "already_redeemed"; consumer_name: string; redeemed_at: string }
  | { status: "expired" | "inactive" | "not_found"; message: string }
  | { status: "ready"; consumer_name: string; consumer_phone: string | null; coupon_title: string }
  | { status: "success"; consumer_name: string; redeemed_at: string; coupon_title: string }
  | { status: "error"; message: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function computeCurrentPeriod(redemptionPeriod: string | null): string {
  const now = new Date()
  if (!redemptionPeriod || redemptionPeriod === "once") return "once"
  if (redemptionPeriod === "unlimited") return "__unlimited__"
  if (redemptionPeriod === "monthly") {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  }
  if (redemptionPeriod === "weekly") {
    const jan1 = new Date(now.getUTCFullYear(), 0, 1)
    const week = Math.ceil(
      ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7
    )
    return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
  }
  if (redemptionPeriod === "daily") {
    const doy = Math.floor(
      (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        Date.UTC(now.getUTCFullYear(), 0, 0)) /
        86400000
    )
    return `${now.getUTCFullYear()}-D${String(doy).padStart(3, "0")}`
  }
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

export default function ValidarPage() {
  const params = useParams()
  const router = useRouter()
  const couponId = params.id as string

  const [instanceCode, setInstanceCode] = useState("")
  const [redeemState, setRedeemState] = useState<RedeemState>({ status: "idle" })
  const [couponInfo, setCouponInfo] = useState<{
    title: string
    redemption_period: string | null
  } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar info del cupón al montar
  useEffect(() => {
    async function loadCoupon() {
      const supabase = createClient()
      const { data } = await supabase
        .from("coupons")
        .select("title, redemption_period, business_name")
        .eq("id", couponId)
        .maybeSingle()
      if (data) setCouponInfo(data)
    }
    if (UUID_RE.test(couponId)) loadCoupon()
  }, [couponId])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = instanceCode.trim()

    if (!UUID_RE.test(code)) {
      setRedeemState({ status: "error", message: "El código no tiene el formato correcto" })
      return
    }

    setRedeemState({ status: "loading" })

    try {
      // Verificar estado de la instancia directamente (lectura pública con service role
      // en el handler; aquí usamos la RPC del servidor o la API de redeem con GET).
      // Usamos la ruta de redeem con method GET para verificar sin confirmar.
      const res = await fetch(`/api/redeem?instance_id=${code}&coupon_id=${couponId}`)
      const data = await res.json()

      if (res.status === 404) {
        setRedeemState({ status: "not_found", message: "Código no encontrado" })
        return
      }
      if (res.status === 410) {
        setRedeemState({ status: "expired", message: data.error })
        return
      }
      if (res.status === 409 && data.code === "already_redeemed") {
        setRedeemState({
          status: "already_redeemed",
          consumer_name: data.consumer_name ?? "Cliente",
          redeemed_at: data.last_redeemed_at ?? new Date().toISOString(),
        })
        return
      }
      if (!res.ok) {
        setRedeemState({ status: "error", message: data.error ?? "Error al verificar" })
        return
      }

      // Instancia lista para canjear
      setRedeemState({
        status: "ready",
        consumer_name: data.consumer_name,
        consumer_phone: data.consumer_phone,
        coupon_title: data.coupon_title,
      })
      setConfirmOpen(true)
    } catch {
      setRedeemState({ status: "error", message: "Error de conexión" })
    }
  }

  const handleConfirmRedeem = async () => {
    setRedeemState({ status: "loading" })
    setConfirmOpen(false)

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance_id: instanceCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setRedeemState({ status: "error", message: data.error ?? "Error al registrar" })
        return
      }

      setRedeemState({
        status: "success",
        consumer_name: data.consumer_name,
        redeemed_at: data.redeemed_at,
        coupon_title: data.coupon_title,
      })
      setInstanceCode("")
    } catch {
      setRedeemState({ status: "error", message: "Error de conexión" })
    }
  }

  const handleReset = () => {
    setRedeemState({ status: "idle" })
    setInstanceCode("")
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const periodLabel: Record<string, string> = {
    once: "canje único",
    daily: "1 canje por día",
    weekly: "1 canje por semana",
    monthly: "1 canje por mes",
    unlimited: "canjes ilimitados",
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Validar canje
          </h1>
          {couponInfo && (
            <p className="text-muted-foreground">
              {couponInfo.title}
              {couponInfo.redemption_period && (
                <span className="ml-2 text-xs">
                  · {periodLabel[couponInfo.redemption_period] ?? couponInfo.redemption_period}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Link href={`/dashboard/${couponId}/canjes`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-4 w-4" />
              Historial
            </Button>
          </Link>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            Código del cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder="Pega o escribe el código del cliente"
              value={instanceCode}
              onChange={(e) => setInstanceCode(e.target.value)}
              className="font-mono"
              autoFocus
            />
            <Button
              type="submit"
              disabled={redeemState.status === "loading" || !instanceCode.trim()}
            >
              {redeemState.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            El cliente puede mostrarte el código en pantalla o tú escanearlo con la cámara.
          </p>
        </CardContent>
      </Card>

      {/* Resultado */}
      {redeemState.status !== "idle" && redeemState.status !== "loading" && (
        <Card
          className={`border-2 ${
            redeemState.status === "success"
              ? "border-primary/50 bg-primary/5"
              : redeemState.status === "already_redeemed" || redeemState.status === "expired"
              ? "border-destructive/40 bg-destructive/5"
              : redeemState.status === "not_found" || redeemState.status === "error"
              ? "border-border bg-muted/40"
              : "border-primary/50"
          }`}
        >
          <CardContent className="p-6">
            {/* ÉXITO */}
            {redeemState.status === "success" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    ¡Beneficio entregado!
                  </p>
                  <p className="text-muted-foreground">
                    {redeemState.consumer_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(redeemState.redeemed_at).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button onClick={handleReset} className="mt-2">
                  Validar otro código
                </Button>
              </div>
            )}

            {/* YA CANJEÓ */}
            {redeemState.status === "already_redeemed" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    Ya canjeó este periodo
                  </p>
                  <p className="text-muted-foreground">{redeemState.consumer_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Último canje:{" "}
                    {new Date(redeemState.redeemed_at).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Intentar con otro código
                </Button>
              </div>
            )}

            {/* VENCIDO / INACTIVO / NO ENCONTRADO / ERROR */}
            {(redeemState.status === "expired" ||
              redeemState.status === "inactive" ||
              redeemState.status === "not_found" ||
              redeemState.status === "error") && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {redeemState.status === "not_found"
                      ? "Código no encontrado"
                      : redeemState.status === "expired"
                      ? "Cupón vencido"
                      : "No se puede canjear"}
                  </p>
                  <p className="text-sm text-muted-foreground">{redeemState.message}</p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación */}
      {redeemState.status === "ready" && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {redeemState.consumer_name}
                  </p>
                  {redeemState.consumer_phone && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {redeemState.consumer_phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-primary/5 p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">Beneficio a entregar</p>
                <p className="mt-1 font-bold text-foreground">{redeemState.coupon_title}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setConfirmOpen(false)
                    handleReset()
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1 gap-2" onClick={handleConfirmRedeem}>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar entrega
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
