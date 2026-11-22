"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeRut } from "@/lib/rut"

export interface RutState {
  error?: string
  saved?: string
}

export async function saveRut(_state: RutState, formData: FormData): Promise<RutState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." }
  }

  const rut = normalizeRut(String(formData.get("rut") ?? ""))
  if (!rut) {
    return { error: "Ese RUT no es válido: revisa el dígito verificador." }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { error: "No se pudo guardar el RUT en este momento." }
  }

  const { error } = await admin.from("profiles").update({ rut }).eq("id", user.id)
  if (error) {
    console.error("[cuenta] no se pudo guardar el RUT", error)
    return { error: "No se pudo guardar el RUT en este momento." }
  }

  revalidatePath("/dashboard/cuenta")
  return { saved: rut }
}