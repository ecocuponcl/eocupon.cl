/**
 * Plantilla del correo de confirmación para quien postula al piloto.
 * HTML con estilos inline (compatible con clientes de correo) + versión texto.
 */

export type LeadEmailData = {
  nombre: string
  organizacion: string
  comuna: string
  rol: string
  tipoPrograma?: string | null
}

const ROL_LABEL: Record<string, string> = {
  municipio: "Municipio",
  marca: "Marca",
  empresa: "Empresa",
  comercio: "Comercio",
}

const TIPO_LABEL: Record<string, string> = {
  puntos_limpios: "Puntos limpios",
  retail: "Retail / punto de venta",
  eventos: "Eventos y activaciones",
  educativo: "Educativo / colegios",
  otro: "Otro",
}

const WA = "https://wa.me/56979540471"

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  )
}

export function leadConfirmationEmail(d: LeadEmailData) {
  const nombre = esc(d.nombre || "hola")
  const rol = ROL_LABEL[d.rol] ?? esc(d.rol)
  const tipo = d.tipoPrograma ? (TIPO_LABEL[d.tipoPrograma] ?? esc(d.tipoPrograma)) : "Por definir"

  const subject = "Recibimos tu solicitud · EcoCupon Recicla"

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF6EA;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Recibimos tu postulación al piloto de EcoCupon Recicla.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EA;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2DAC6;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="background:#1E7A4C;padding:20px 28px;">
        <span style="color:#F1E6B2;font-size:18px;font-weight:bold;letter-spacing:-0.02em;">EcoCupon Recicla</span>
      </td></tr>
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#131812;">Hola, ${nombre}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3C443A;">
          Recibimos tu solicitud para el <strong>piloto de EcoCupon Recicla</strong>. Gracias por sumarte.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EAD6;border-radius:12px;padding:0;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6E6B5A;font-weight:bold;">Tu solicitud</p>
            <p style="margin:0 0 6px;font-size:14px;color:#131812;"><strong>Organización:</strong> ${esc(d.organizacion)}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#131812;"><strong>Comuna / territorio:</strong> ${esc(d.comuna)}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#131812;"><strong>Perfil:</strong> ${rol}</p>
            <p style="margin:0;font-size:14px;color:#131812;"><strong>Tipo de programa:</strong> ${tipo}</p>
          </td></tr>
        </table>
        <p style="margin:18px 0 8px;font-size:15px;line-height:1.6;color:#3C443A;">
          <strong>¿Qué sigue?</strong> Te contactaremos en un plazo de <strong>48 horas hábiles</strong> al email o WhatsApp que dejaste, para definir alcance, comercios y fechas.
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3C443A;">
          Si quieres adelantar la conversación, escríbenos por WhatsApp.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr><td style="background:#1E7A4C;border-radius:999px;">
            <a href="${WA}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#F7F4E6;text-decoration:none;">Hablar por WhatsApp</a>
          </td></tr>
        </table>
        <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#6E6B5A;">
          EcoCupon Recicla es una alianza entre EcoCupon y Recicla-Ya: Recicla-Ya recibe y verifica los materiales; EcoCupon administra participantes, cupones y canjes.
        </p>
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #E2DAC6;">
        <p style="margin:0 0 6px;font-size:12px;color:#6E6B5A;line-height:1.6;">
          Recibes este correo porque enviaste una solicitud en ecocupon.cl/recicla. Si no fuiste tú, ignóralo.
        </p>
        <p style="margin:0;font-size:12px;color:#6E6B5A;line-height:1.6;">
          Datos tratados conforme a la Ley 19.628 y la Ley 21.719 · <a href="https://www.ecocupon.cl" style="color:#124D33;text-decoration:none;">ecocupon.cl</a> · <a href="https://recicla-ya.cl" style="color:#124D33;text-decoration:none;">recicla-ya.cl</a>
        </p>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:11px;color:#6E6B5A;font-family:Arial,Helvetica,sans-serif;">EcoCupon Recicla · Programa piloto 2026</p>
  </td></tr>
</table>
</body></html>`

  const text = `Hola, ${d.nombre}

Recibimos tu solicitud para el piloto de EcoCupon Recicla.

Organización: ${d.organizacion}
Comuna / territorio: ${d.comuna}
Perfil: ${rol}
Tipo de programa: ${tipo}

Te contactaremos en un plazo de 48 horas hábiles al email o WhatsApp que dejaste.

WhatsApp: +56 9 7954 0471
Email: ecocupon.cl@gmail.com

EcoCupon Recicla · Ecocupon + Recicla-Ya
Datos tratados conforme a la Ley 19.628 y la Ley 21.719.`

  return { subject, html, text }
}