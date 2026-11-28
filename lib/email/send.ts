/**
 * Envío de correo transaccional.
 *
 * Usa la API HTTP de Resend (sin dependencia npm). Requiere:
 *   RESEND_API_KEY     — clave de Resend
 *   LEADS_EMAIL_FROM   — remitente verificado (ej. "EcoCupon <no-reply@ecocupon.cl>")
 *
 * Si no hay clave, NO envía y devuelve false (no lanza). Así un lead igual se
 * guarda aunque el correo no esté configurado; nunca se simula el envío.
 */
export async function sendEmail(args: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.LEADS_EMAIL_FROM || "EcoCupon Recicla <no-reply@ecocupon.cl>"
  if (!key) {
    console.warn("[email] RESEND_API_KEY no configurada: no se envía correo")
    return false
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      // Sin timeout, un cuelgue de Resend retiene la función hasta el límite de Vercel.
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [args.to], subject: args.subject, html: args.html, text: args.text }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("[email] Resend respondió", res.status, detail.slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error("[email] fallo de red:", err instanceof Error ? err.message : String(err))
    return false
  }
}