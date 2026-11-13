"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SITE_URL } from "@/lib/site-url"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

// Genera la URL de la imagen igual que en /dashboard/crear
function buildImageUrl(
  title: string,
  business: string,
  code: string,
  discount: number,
  logo = "",
  url = "",
) {
  const params = new URLSearchParams()
  params.set("title", title)
  params.set("business", business)
  params.set("code", code)
  params.set("discount", String(discount))
  if (logo) params.set("logo", logo)
  if (url) params.set("url", url)
  return `/api/coupon-image?${params.toString()}`
}

interface CouponForm {
  title: string
  business_name: string
  coupon_code: string
  discount_percentage: string
  conditions: string
  redemption_period: string
  expires_campaign_at: string
  is_public: boolean
  max_total_redemptions: string
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function EditarCuponPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [form, setForm] = useState<CouponForm>({
    title: "",
    business_name: "",
    coupon_code: "",
    discount_percentage: "20",
    conditions: "",
    redemption_period: "once",
    expires_campaign_at: "",
    is_public: false,
    max_total_redemptions: "",
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!UUID_RE.test(id)) {
      setError("ID de cupón inválido")
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("coupons")
        .select("title, business_name, coupon_code, discount_percentage, conditions, redemption_period, expires_campaign_at, is_public, logo_url, max_total_redemptions")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (error || !data) {
        setError("No se encontró el cupón o no tienes permiso para editarlo")
        setLoading(false)
        return
      }

      setLogoUrl(data.logo_url ?? null)
      setForm({
        title: data.title ?? "",
        business_name: data.business_name ?? "",
        coupon_code: data.coupon_code ?? "",
        discount_percentage: String(data.discount_percentage ?? 20),
        conditions: data.conditions ?? "",
        redemption_period: data.redemption_period ?? "once",
        expires_campaign_at: data.expires_campaign_at
          ? new Date(data.expires_campaign_at).toISOString().split("T")[0]
          : "",
        is_public: data.is_public ?? false,
        max_total_redemptions: data.max_total_redemptions ? String(data.max_total_redemptions) : "",
      })
      setLoading(false)
    }

    load()
  }, [id, router])

  const handleSave = async () => {
    if (!form.title.trim() || !form.business_name.trim() || !form.coupon_code.trim()) {
      setError("Título, nombre del negocio y código son obligatorios")
      return
    }

    const discount = parseInt(form.discount_percentage, 10)
    if (isNaN(discount) || discount < 1 || discount > 100) {
      setError("El descuento debe ser entre 1 y 100")
      return
    }

    setError(null)
    setSaving(true)

    try {
      const supabase = createClient()

      // Regenerar URL de la imagen con los datos actualizados
      const newImageUrl = buildImageUrl(
        form.title.trim(),
        form.business_name.trim(),
        form.coupon_code.trim().toUpperCase(),
        discount,
        logoUrl ?? "",
        `${SITE_URL}/cupon/${id}`,
      )

      const { error } = await supabase
        .from("coupons")
        .update({
          title: form.title.trim(),
          business_name: form.business_name.trim(),
          coupon_code: form.coupon_code.trim().toUpperCase(),
          discount_percentage: discount,
          conditions: form.conditions.trim() || null,
          redemption_period: form.redemption_period,
          expires_campaign_at: form.expires_campaign_at
            ? new Date(form.expires_campaign_at).toISOString()
            : null,
          is_public: form.is_public,
          generated_image_url: newImageUrl,
          max_total_redemptions: form.max_total_redemptions
            ? parseInt(form.max_total_redemptions, 10)
            : null,
        })
        .eq("id", id)
      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof CouponForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar cupón</h1>
          <p className="text-muted-foreground">Guardar regenera la imagen automáticamente</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Datos del cupón</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 rounded-lg bg-primary/10 p-3 text-center text-sm font-medium text-primary">
              ¡Cambios guardados!
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Título del cupón</FieldLabel>
              <Input
                id="title"
                placeholder="Ej: Descuento de Verano"
                value={form.title}
                onChange={set("title")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="business_name">Nombre del negocio</FieldLabel>
                <Input
                  id="business_name"
                  placeholder="Mi Tienda"
                  value={form.business_name}
                  onChange={set("business_name")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="coupon_code">Código</FieldLabel>
                <Input
                  id="coupon_code"
                  placeholder="VERANO50"
                  value={form.coupon_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coupon_code: e.target.value.toUpperCase() }))
                  }
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="discount">Descuento (%)</FieldLabel>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={form.discount_percentage}
                  onChange={set("discount_percentage")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="is_public">Visibilidad</FieldLabel>
                <Select
                  value={form.is_public ? "public" : "private"}
                  onValueChange={(v) => setForm((f) => ({ ...f, is_public: v === "public" }))}
                >
                  <SelectTrigger id="is_public">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Publicado en cuponera</SelectItem>
                    <SelectItem value="private">Solo con enlace</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="redemption_period">Política de canje</FieldLabel>
                <Select
                  value={form.redemption_period}
                  onValueChange={(v) => setForm((f) => ({ ...f, redemption_period: v }))}
                >
                  <SelectTrigger id="redemption_period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Canje único</SelectItem>
                    <SelectItem value="monthly">1 canje por mes</SelectItem>
                    <SelectItem value="weekly">1 canje por semana</SelectItem>
                    <SelectItem value="daily">1 canje por día</SelectItem>
                    <SelectItem value="unlimited">Sin límite</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="expires_at">
                  Vence el{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <Input
                  id="expires_at"
                  type="date"
                  value={form.expires_campaign_at}
                  onChange={set("expires_campaign_at")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="max_redemptions">
                  Límite de canjes{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </FieldLabel>
                <Input
                  id="max_redemptions"
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                  value={form.max_total_redemptions}
                  onChange={set("max_total_redemptions")}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="conditions">
                Condiciones{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Textarea
                id="conditions"
                placeholder="Ej: Válido solo en tienda física. No acumulable con otras promociones."
                value={form.conditions}
                onChange={set("conditions")}
                rows={3}
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
              <Link href={`/dashboard/${id}/canjes`}>
                <Button variant="outline">Ver canjes</Button>
              </Link>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
