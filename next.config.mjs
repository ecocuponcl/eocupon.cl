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
          // CSP conservadora: bloquea scripts de terceros no autorizados.
          // 'unsafe-inline' en scripts se mantiene para no romper el bootstrap
          // de Next en producción; restringirlo vía nonces es la mejora siguiente.
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
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
