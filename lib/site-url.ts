// URL canónica del sitio para generar enlaces compartibles (QR, links).
//
// Nunca usar window.location.origin para valores que se PERSISTEN (p. ej. la
// URL del QR que se guarda en coupons.image_url): si el cupón se crea desde
// localhost, quedaría "localhost:3000" grabado en la BD y el QR compartido
// apuntaría a localhost. Usamos una base configurable por entorno y, si no
// está definida, el dominio de producción por defecto.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ecocupon.cl"
).replace(/\/$/, "")
