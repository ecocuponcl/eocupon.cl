/**
 * RUT chileno: normalización y dígito verificador (módulo 11).
 *
 * Se guarda siempre como `12345678-9` (sin puntos, sin espacios, K mayúscula).
 */

export function normalizeRut(input: string): string | null {
  const cleaned = input.replace(/[.\s]/g, "").replace(/-/g, "").toUpperCase()
  const match = /^(\d{1,8})([0-9K])$/.exec(cleaned)
  if (!match) return null

  const body = match[1].padStart(1, "0")
  const check = match[2]

  let sum = 0
  let factor = 2
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const remainder = 11 - (sum % 11)
  const expected = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder)

  if (check !== expected) return null
  return `${Number(body)}-${expected}`
}