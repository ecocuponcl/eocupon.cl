/**
 * Bloque de datos estructurados JSON-LD. No se muestra al usuario: lo leen
 * Google, Bing y los buscadores con IA. El CSP ya permite scripts inline.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Se escapa `<` para que el texto de un cupón no pueda cerrar el <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}