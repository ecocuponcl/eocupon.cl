// Datos compartidos por la suite. Las credenciales nunca se escriben en el repo:
// se leen del entorno. Ver e2e/README.md.

export const CREDENCIALES = {
  email: process.env.E2E_USER_EMAIL,
  password: process.env.E2E_USER_PASSWORD,
}

export const MOTIVO_SIN_CREDENCIALES =
  "Falta E2E_USER_EMAIL/E2E_USER_PASSWORD: se necesita una cuenta de prueba " +
  "autorizada en el proyecto Supabase (hoy apunta a producción)."

export const CORREO_INEXISTENTE = "auditoria-no-existe@example.invalid"

export const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000"
