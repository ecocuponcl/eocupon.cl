/** @type {import('next').NextConfig} */
const SUPABASE_URL = "https://vwjdfyljacoxwabtfoco.supabase.co"

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
              "img-src 'self' data: blob:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-analytics.com",
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
