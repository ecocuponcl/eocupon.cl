"use client"

import { useState, type FormEvent } from "react"

type Result =
  | { kind: "idle" }
  | { kind: "ok"; emailSent: boolean }
  | { kind: "err"; message: string; waHref: string }

const PHONE = "56979540471"

export function LeadForm() {
  const [rol, setRol] = useState("municipio")
  const [enviando, setEnviando] = useState(false)
  const [result, setResult] = useState<Result>({ kind: "idle" })

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    const fd = new FormData(form)
    // Honeypot: si viene relleno, no enviamos.
    if (String(fd.get("website") ?? "").trim() !== "") return

    const payload = {
      rol: String(fd.get("rol") ?? ""),
      organizacion: String(fd.get("organizacion") ?? ""),
      nombre: String(fd.get("nombre") ?? ""),
      cargo: String(fd.get("cargo") ?? ""),
      comuna: String(fd.get("comuna") ?? ""),
      email: String(fd.get("email") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      tipo_programa: String(fd.get("tipo") ?? ""),
      comercios_estimados: String(fd.get("comercios") ?? ""),
      mensaje: String(fd.get("mensaje") ?? ""),
      origen: "landing_recicla",
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; emailSent?: boolean } | null
      if (res.ok && data?.ok) {
        setResult({ kind: "ok", emailSent: Boolean(data.emailSent) })
      } else {
        setResult({ kind: "err", message: `No pudimos registrar tu solicitud (código ${res.status}).`, waHref: waLink(payload) })
      }
    } catch {
      setResult({ kind: "err", message: "No pudimos conectar con el registro.", waHref: waLink(payload) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="rol">Soy</label>
        <select id="rol" name="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="municipio">Municipio</option>
          <option value="marca">Marca</option>
          <option value="empresa">Empresa</option>
          <option value="comercio">Comercio</option>
        </select>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="organizacion">Organización</label>
          <input id="organizacion" name="organizacion" type="text" autoComplete="organization" placeholder="Municipalidad, marca o empresa" required />
        </div>
        <div className="field">
          <label htmlFor="comuna">Comuna o territorio</label>
          <input id="comuna" name="comuna" type="text" autoComplete="address-level2" placeholder="Ej. Ñuñoa" required />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" type="text" autoComplete="name" placeholder="Tu nombre" required />
        </div>
        <div className="field">
          <label htmlFor="cargo">Cargo <span className="opt">(opcional)</span></label>
          <input id="cargo" name="cargo" type="text" autoComplete="organization-title" placeholder="Ej. Directora de Medio Ambiente" />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@organizacion.cl" required />
        </div>
        <div className="field">
          <label htmlFor="whatsapp">WhatsApp <span className="opt">(opcional)</span></label>
          <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+56 9 ..." />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="tipo">Tipo de programa</label>
          <select id="tipo" name="tipo" defaultValue="puntos_limpios">
            <option value="puntos_limpios">Puntos limpios</option>
            <option value="retail">Retail / punto de venta</option>
            <option value="eventos">Eventos y activaciones</option>
            <option value="educativo">Educativo / colegios</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="comercios">Comercios estimados <span className="opt">(opcional)</span></label>
          <input id="comercios" name="comercios" type="number" min={0} placeholder="Ej. 20" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="mensaje">¿Qué quieres lograr? <span className="opt">(opcional)</span></label>
        <textarea id="mensaje" name="mensaje" placeholder="Ej. incentivar el reciclaje en 10 puntos limpios durante 2026" />
      </div>

      {/* Honeypot anti-spam (oculto para personas) */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="consent">
        <input type="checkbox" name="consent" required /> Autorizo que EcoCupon use estos datos para contactarme sobre el programa, conforme a la Ley 19.628 y la Ley 21.719.
      </label>

      <div className="form-actions">
        <button className="btn btn--wa" type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </div>

      {result.kind === "ok" && (
        <div className="form-result show ok" role="status" aria-live="polite">
          <p>
            {result.emailSent
              ? "Recibimos tu solicitud y te enviamos un correo de confirmación. Te contactaremos en 48 horas hábiles."
              : "Recibimos tu solicitud. Te contactaremos al email o WhatsApp que dejaste."}
          </p>
          <a className="btn btn--ghost btn--sm" href={waSimple()} target="_blank" rel="noopener">Adelantar por WhatsApp</a>
        </div>
      )}

      {result.kind === "err" && (
        <div className="form-result show err" role="status" aria-live="polite">
          <p>{result.message} Envía los mismos datos por WhatsApp:</p>
          <a className="btn btn--wa" href={result.waHref} target="_blank" rel="noopener">Enviar por WhatsApp</a>
        </div>
      )}

      <p className="fine">
        Si el registro en línea no está disponible, te damos un botón para enviar los mismos datos por WhatsApp. No mostramos una confirmación que no ocurrió.
      </p>
    </form>
  )
}

function waSimple() {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent("Hola, acabo de enviar mi solicitud al piloto de EcoCupon Recicla.")}`
}

function waLink(p: Record<string, string>) {
  let t = `Hola, quiero postular al piloto de EcoCupon Recicla. Rol: ${p.rol}. Organización: ${p.organizacion}. Comuna: ${p.comuna}.`
  if (p.nombre) t += ` Nombre: ${p.nombre}.`
  if (p.cargo) t += ` Cargo: ${p.cargo}.`
  if (p.email) t += ` Email: ${p.email}.`
  if (p.whatsapp) t += ` WhatsApp: ${p.whatsapp}.`
  if (p.tipo_programa) t += ` Tipo: ${p.tipo_programa}.`
  if (p.comercios_estimados) t += ` Comercios: ${p.comercios_estimados}.`
  if (p.mensaje) t += ` Objetivo: ${p.mensaje}.`
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`
}