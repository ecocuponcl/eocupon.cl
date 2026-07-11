import { ImageResponse } from "next/og"

// Genera la imagen del cupón de forma determinista y gratuita (sin IA externa).
// El nuevo Fluid Compute de Vercel corre en Node.js; next/og funciona en este runtime.
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title = (searchParams.get("title") || "Cupón de descuento").slice(0, 60)
  const business = (searchParams.get("business") || "").slice(0, 40)
  const code = (searchParams.get("code") || "DESCUENTO").slice(0, 20)
  const discount = Math.max(
    0,
    Math.min(100, parseInt(searchParams.get("discount") || "0", 10) || 0),
  )

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
        {/* Fila superior: negocio + descuento */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
            {business || "EcoCupon"}
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

        {/* Pie: CTA + marca */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 22 }}>
            Usa este código en tu compra
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 16, opacity: 0.85 }}>
            Creado con EcoCupon.cl
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
