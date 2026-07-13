import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"])

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor" },
      { status: 500 },
    )
  }

  // 1) Validar la sesión del usuario en el servidor (lee las cookies).
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2) Leer el archivo del body (multipart/form-data).
  const form = await req.formData()
  const file = form.get("file")
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 })
  }

  // 3) Cliente con service role (bypassea la RLS de Storage).
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 4) Ruta siempre bajo el user.id del usuario autenticado (aislamiento por usuario).
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : ""
  const safeExt = ALLOWED_EXT.has(ext) ? ext : "png"
  const path = `${user.id}/${Date.now()}.${safeExt}`

  const { error: uploadError } = await admin.storage
    .from("logos")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    })
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = admin.storage.from("logos").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
