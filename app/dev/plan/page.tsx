"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Herramienta privada para alternar el plan de la cuenta dueña y comparar
 * ambos flujos. No está enlazada desde ninguna parte y el endpoint exige el
 * código secreto más el correo autorizado.
 */
export default function DevPlanPage() {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function change(plan: "pro" | "free") {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch("/api/dev/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, plan }),
      })
      const json = (await res.json().catch(() => ({}))) as { plan?: string; error?: string }
      setStatus(
        res.ok
          ? `Listo: ahora estás en el plan ${json.plan}. Recarga el panel para verlo.`
          : (json.error ?? "No se pudo cambiar el plan."),
      )
    } catch {
      setStatus("No se pudo conectar con el servidor.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Plan de prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cambia el plan de tu cuenta para comparar los dos flujos. Necesitas sesión iniciada con
            el correo autorizado.
          </p>
          <Input
            type="password"
            placeholder="Código de prueba"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => change("pro")} disabled={busy || !code}>
              Activar Pro
            </Button>
            <Button variant="outline" onClick={() => change("free")} disabled={busy || !code}>
              Volver a Gratis
            </Button>
          </div>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>
    </main>
  )
}