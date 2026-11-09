/** @type {import('next').NextConfig} */
const SUPABASE_URL = "https://vwjdfyljacoxwabtfoco.supabase.co"

// En desarrollo, React/Next (Turbopack) usa eval() para reconstruir stack traces
// y otras devtools. El CSP estricto de producción lo bloquea y dispara el error
// de consola "eval() is not supported in this environment". En producción NO
// añadimos unsafe-eval porque React en modo producción nunca usa eval().
const isDev = process.env.NODE_ENV !== "production"
const CSP_SCRIPT_DEV = isDev ? " 'unsafe-eval'" : ""

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            // Sin `includeSubDomains`: si algún subdominio no sirve HTTPS,
            // quedaría inaccesible para los navegadores que ya vieron la cabecera.
            value: "max-age=63072000",
          },
          // CSP conservadora: bloquea scripts de terceros no autorizados.
          //
          // 'unsafe-inline' en scripts se mantiene a propósito. La alternativa
          // (nonce + 'strict-dynamic') se implementó y se DESCARTÓ con
          // evidencia: `/`, `/precios`, `/auth/*`, `/condiciones` y
          // `/privacidad` se prerenderizan como estáticas, así que su HTML se
          // genera en el build sin nonce; el proxy sí mandaría un nonce en la
          // cabecera y, como 'strict-dynamic' hace que el navegador ignore la
          // lista de hosts, esos scripts quedarían bloqueados. Para usar nonce
          // habría que forzar esas rutas a dinámicas (perdiendo el prerender) o
          // usar hashes. Ver docs/designs/2026-11-09-egm-analisis-estructural.md.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `img-src 'self' data: blob: ${SUPABASE_URL}`,
              "style-src 'self' 'unsafe-inline'",
              `script-src 'self' 'unsafe-inline' https://va.vercel-analytics.com${CSP_SCRIPT_DEV}`,
              "font-src 'self' data:",
              `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_URL.replace("https://", "wss://")} https://va.vercel-analytics.com https://vitals.vercel-analytics.com`,
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
