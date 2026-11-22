import { ImageResponse } from "next/og"
import QRCode from "qrcode"

// Genera la imagen del cupón de forma determinista y gratuita (sin IA externa).
// El nuevo Fluid Compute de Vercel corre en Node.js; next/og funciona en este runtime.
export const dynamic = "force-dynamic"

// Allowlist de hosts para el logo. El logo siempre vive en Supabase Storage
// (bucket `logos`, público). Restringir el fetch a esos hosts evita SSRF
// (p. ej. http://169.254.169.254/ metadata de cloud, o IPs internas).
function isAllowedLogoHost(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:") return false
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : ""
    const allowed = ["supabase.co", supabaseHost].filter(Boolean)
    return allowed.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024

// Descarga una imagen remota y la embebe como data URL para que Satori la
// renderice sin depender del fetch de imágenes remotas (evita problemas de CORS).
// Solo acepta hosts de Supabase Storage y rechaza respuestas no imagen o
// demasiado grandes.
async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url || !isAllowedLogoHost(url)) return null
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const len = Number(res.headers.get("content-length") || 0)
    if (len > MAX_LOGO_BYTES) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_LOGO_BYTES) return null
    const ct = res.headers.get("content-type") || "image/png"
    if (!ct.startsWith("image/")) return null
    return `data:${ct};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title = (searchParams.get("title") || "Cupón de descuento").slice(0, 60)
  const business = (searchParams.get("business") || "").slice(0, 40)
  const code = (searchParams.get("code") || "DESCUENTO").slice(0, 20)
  const discount = Math.max(
    0,
    Math.min(100, parseInt(searchParams.get("discount") || "0", 10) || 0),
  )
  const logoParam = searchParams.get("logo")
  const qrUrl = searchParams.get("url")

  // Logo y QR se resuelven antes de renderizar (data URLs).
  const logoDataUrl = await toDataUrl(logoParam)
  let qrDataUrl: string | null = null
  if (qrUrl) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 300,
        color: { dark: "#005F3A", light: "#FFFFFF" },
      })
    } catch {
      qrDataUrl = null
    }
  }

  // Dose: papel cálido, tinta verde-negra y un solo verde de acento. Son los
  // mismos tokens del landing (app/landing.css), en hex porque Satori no
  // resuelve oklch.
  const paper = "#FAF7EF"
  const paper2 = "#E9F8EF"
  const ink = "#0C1C16"
  const ink2 = "#26342F"
  const muted = "#54655D"
  const rule = "#CBD6C9"
  const accent = "#007948"
  const accentDeep = "#005F3A"
  const accentSoft = "#A9E8C6"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          background: paper,
          color: ink,
          position: "relative",
        }}
      >
        {/* Lomo de plástico: la firma del tema, un borde de acento sin radio */}
        <div style={{ display: "flex", width: 12, height: "100%", background: accent }} />

        {/* Cuerpo: negocio, descuento y oferta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "44px 40px 40px 40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt=""
                width={56}
                height={56}
                style={{ borderRadius: 14, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: accent,
                  color: "#FFFFFF",
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {(business || "E").charAt(0)}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: ink }}>
                {business || "EcoCupon"}
              </div>
              <div style={{ display: "flex", fontSize: 14, color: muted }}>
                Cupón de descuento
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 112,
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: -4,
                color: accentDeep,
              }}
            >
              {discount}%
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                maxWidth: 400,
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.2,
                color: ink,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 500, color: ink2 }}>
              Usa este código en tu compra
            </div>
            <div style={{ display: "flex", fontSize: 13, color: muted }}>
              Creado con EcoCupon.cl
            </div>
          </div>
        </div>

        {/* Troquel: línea perforada y las muescas del talón */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 26,
            left: 514,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: paper,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 26,
            left: 514,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: paper,
          }}
        />

        {/* Talón: QR y código */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            width: 268,
            padding: "40px 24px",
            background: paper2,
            borderLeft: `2px dashed ${rule}`,
          }}
        >
          {qrDataUrl ? (
            <div
              style={{
                display: "flex",
                background: "#FFFFFF",
                padding: 12,
                borderRadius: 16,
                border: `1px solid ${rule}`,
              }}
            >
              <img src={qrDataUrl} alt="" width={150} height={150} />
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", fontSize: 13, color: muted }}>Código</div>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 12,
                background: accentSoft,
                color: ink,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1,
                maxWidth: 220,
                overflowWrap: "anywhere",
                textAlign: "center",
              }}
            >
              {code}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 13, color: muted }}>
            Escanea o presenta el código
          </div>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 600,
      headers: {
        // Imagen determinista por parámetros: cached en el CDN de Vercel.
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  )
}
