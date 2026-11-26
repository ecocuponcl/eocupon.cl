import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El panel y los formularios de sesión no aportan nada al índice, las
        // rutas de API no deben rastrearse y `/dev` es una herramienta interna.
        disallow: ["/dashboard", "/auth/", "/api/", "/dev"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}