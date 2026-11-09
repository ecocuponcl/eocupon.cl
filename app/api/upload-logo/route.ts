import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// SVG queda fuera a propósito: es un documento con scripts y estilos, y el
// bucket `logos` es público, así que servirlo permitiría XSS alojado en nuestro
// dominio. Si algún día se admite, hay que sanitizarlo y servirlo con
// Content-Disposition + CSP propia.
const MAX_LOGO_BYTES = 5 * 1024 * 1024

type ImageType = { ext: string; mime: string }

function sniffImage(bytes: Uint8Array): ImageType | null {
  const startsWith = (...sig: number[]) =>
    sig.every((b, i) => bytes[i] === b)

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { ext: "png", mime: "image/png" }
  }
  if (startsWith(0xff, 0xd8, 0xff)) {
    return { ext: "jpg", mime: "image/jpeg" }
  }
  if (startsWith(0x47, 0x49, 0x46, 0x38)) {
    return { ext: "gif", mime: "image/gif" }
  }
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" }
  }
  // ....ftyp + marca avif/avis
  if (
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
    (String.fromCharCode(...bytes.slice(8, 12)) === "avif" ||
      String.fromCharCode(...bytes.slice(8, 12)) === "avis")
  ) {
    return { ext: "avif", mime: "image/avif" }
  }

  return null
}

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

  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { error: "El logo no puede superar los 5 MB" },
      { status: 413 },
    )
  }

  // 3) El tipo real se decide por los bytes, no por lo que declare el cliente:
  //    extensión y Content-Type son datos del atacante.
  const bytes = new Uint8Array(await file.arrayBuffer())
  const detected = sniffImage(bytes)
  if (!detected) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa PNG, JPG, WEBP, GIF o AVIF" },
      { status: 415 },
    )
  }

  // 4) Cliente con service role (bypassea la RLS de Storage).
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 5) Ruta siempre bajo el user.id del usuario autenticado (aislamiento por usuario).
  const path = `${user.id}/${Date.now()}.${detected.ext}`

  const { error: uploadError } = await admin.storage
    .from("logos")
    .upload(path, bytes, {
      upsert: true,
      contentType: detected.mime,
    })
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = admin.storage.from("logos").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
