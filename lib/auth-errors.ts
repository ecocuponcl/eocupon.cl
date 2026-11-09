/**
 * Supabase Auth devuelve sus mensajes de error en inglés. La interfaz está en
 * español, así que se traducen aquí, en un solo sitio, para que login, registro,
 * recuperación y cambio de contraseña no se desincronicen.
 *
 * Si aparece un mensaje que no está en la tabla, se muestra el original detrás
 * de un texto en español: preferimos un mensaje feo a ocultar la causa real.
 */
const MENSAJES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed":
    "Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.",
  "User already registered": "Ya existe una cuenta con este correo.",
  "Email rate limit exceeded":
    "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.",
  "Password should be at least 6 characters":
    "La contraseña debe tener al menos 6 caracteres.",
  "New password should be different from the old password":
    "La contraseña nueva debe ser distinta de la anterior.",
  "Auth session missing": "Tu sesión expiró. Vuelve a iniciar sesión.",
}

export function traducirErrorAuth(
  mensaje: string | null | undefined,
): string {
  if (!mensaje) return "Ocurrió un error inesperado. Inténtalo de nuevo."

  const directo = MENSAJES[mensaje]
  if (directo) return directo

  // "For security purposes, you can only request this after 42 seconds."
  const espera = mensaje.match(/after (\d+) seconds/i)
  if (espera) {
    return `Por seguridad, espera ${espera[1]} segundos antes de reintentar.`
  }

  return `No pudimos completar la operación: ${mensaje}`
}
