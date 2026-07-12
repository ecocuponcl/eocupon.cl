import { ImageResponse } from "next/og"
import QRCode from "qrcode"

// Genera la imagen del cupón de forma determinista y gratuita (sin IA externa).
// El nuevo Fluid Compute de Vercel corre en Node.js; next/og funciona en este runtime.
export const dynamic = "force-dynamic"

// Descarga una imagen remota y la embebe como data URL para que Satori la
// renderice sin depender del fetch de imágenes remotas (evita problemas de CORS).
async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get("content-type") || "image/png"
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
        width: 240,
        color: { dark: "#15803d", light: "#ffffff" },
      })
    } catch {
      qrDataUrl = null
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #15803d 0%, #65a30d 100%)",
          color: "white",
          padding: "48px",
        }}
      >
        {/* Fila superior: logo + negocio + descuento */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                width={72}
                height={72}
                style={{ borderRadius: 36, objectFit: "cover" }}
              />
            ) : null}
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
              {business || "EcoCupon"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "white",
              color: "#15803d",
              fontSize: 40,
              fontWeight: 800,
              padding: "8px 20px",
              borderRadius: 16,
            }}
          >
            {discount}%
          </div>
        </div>

        {/* Centro: título + código */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              backgroundColor: "#fef08a",
              color: "#422006",
              fontSize: 34,
              fontWeight: 800,
              padding: "12px 28px",
              borderRadius: 14,
              letterSpacing: 2,
            }}
          >
            {code}
          </div>
        </div>

        {/* Pie: QR (si aplica) + CTA + marca */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", fontSize: 22 }}>
              Usa este código en tu compra
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 16, opacity: 0.85 }}>
              Creado con EcoCupon.cl
            </div>
          </div>
          {qrDataUrl ? (
            <div
              style={{
                display: "flex",
                backgroundColor: "white",
                padding: 10,
                borderRadius: 14,
              }}
            >
              <img src={qrDataUrl} width={120} height={120} />
            </div>
          ) : null}
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
