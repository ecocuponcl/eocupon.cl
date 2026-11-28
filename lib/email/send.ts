import nodemailer from "nodemailer"

/**
 * Envío de correo transaccional.
 *
 * El proveedor se elige con EMAIL_PROVIDER:
 *   gmail  (por defecto) — SMTP de Gmail con contraseña de aplicación.
 *          Requiere GMAIL_USER y GMAIL_APP_PASSWORD.
 *   resend — API HTTP de Resend. Requiere RESEND_API_KEY y, opcionalmente,
 *          LEADS_EMAIL_FROM (remitente verificado).
 *
 * Sin credenciales NO envía y devuelve false (no lanza). Así un lead igual se
 * guarda aunque el correo no esté configurado; nunca se simula el envío.
 */

export interface Correo {
  to: string
  subject: string
  html: string
  text: string
}

const TIMEOUT_MS = 15_000

export async function sendEmail(args: Correo): Promise<boolean> {
  return process.env.EMAIL_PROVIDER === "resend" ? enviarPorResend(args) : enviarPorGmail(args)
}

async function enviarPorGmail({ to, subject, html, text }: Correo): Promise<boolean> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    console.warn("[email] GMAIL_USER o GMAIL_APP_PASSWORD sin configurar: no se envía correo")
    return false
  }

  const transporte = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  })

  try {
    // Gmail reescribe el remitente si no es la cuenta autenticada.
    await transporte.sendMail({ from: `EcoCupon Recicla <${user}>`, to, subject, html, text })
    return true
  } catch (err) {
    console.error("[email] Gmail falló:", err instanceof Error ? err.message : String(err))
    return false
  } finally {
    transporte.close()
  }
}

async function enviarPorResend({ to, subject, html, text }: Correo): Promise<boolean> {
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
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