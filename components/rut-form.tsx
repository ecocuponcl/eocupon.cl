"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { saveRut, type RutState } from "@/app/dashboard/cuenta/actions"

export function RutForm({ rut }: { rut: string | null }) {
  const [state, formAction, pending] = useActionState<RutState, FormData>(
    saveRut,
    { saved: rut ?? undefined },
  )

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="rut">RUT del comercio</Label>
        <Input
          id="rut"
          name="rut"
          defaultValue={state.saved ?? ""}
          placeholder="12.345.678-9"
          inputMode="text"
          autoComplete="off"
          aria-describedby="rut-ayuda"
          required
        />
        <p id="rut-ayuda" className="text-sm text-muted-foreground">
          Se usa para emitir la boleta de tu suscripción. Se guarda como 12345678-9.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar RUT"}
      </Button>
    </form>
  )
}