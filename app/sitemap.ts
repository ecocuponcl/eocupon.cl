import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site-url"

// Se regenera cada hora: los cupones públicos cambian sin despliegue.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/precios`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/cuponera`, priority: 0.8, changeFrequency: "daily" },
    { url: `${SITE_URL}/privacidad`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE_URL}/condiciones`, priority: 0.3, changeFrequency: "yearly" },
  ]

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("coupons")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(1000)

    const cupones: MetadataRoute.Sitemap = (data ?? []).map((c) => ({
      url: `${SITE_URL}/cupon/${c.id}`,
      lastModified: c.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }))

    return [...estaticas, ...cupones]
  } catch {
    // Si la consulta falla, el sitemap sigue siendo útil con las páginas fijas.
    return estaticas
  }
}