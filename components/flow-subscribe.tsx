"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Period = "mensual" | "anual"

export function FlowSubscribe({
  prices,
  disabled,
}: {
  prices: Record<Period, number>
  disabled?: boolean
}) {
  const [loading, setLoading] = useState<Period | null>(null)
  const [error, setError] = useState<string | null>(null)

  const format = (value: number) => `$${value.toLocaleString("es-CL")}`

  async function start(period: Period) {
    setLoading(period)
    setError(null)

    try {
      const response = await fetch("/api/flow/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ period }),
      })
      const json = (await response.json().catch(() => ({}))) as { url?: string; error?: string }

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "No se pudo iniciar el cobro.")
      }

      window.location.assign(json.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar el cobro.")
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading !== null}
          onClick={() => start("mensual")}
        >
          {loading === "mensual" ? "Abriendo Flow…" : `Mensual · ${format(prices.mensual)}`}
        </Button>
        <Button
          type="button"
          disabled={disabled || loading !== null}
          onClick={() => start("anual")}
        >
          {loading === "anual" ? "Abriendo Flow…" : `Anual · ${format(prices.anual)}`}
        </Button>
      </div>

      {disabled ? (
        <p className="text-sm text-muted-foreground">Guarda el RUT del comercio antes de suscribirte.</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}