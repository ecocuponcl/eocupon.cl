import Link from "next/link"
import type { Metadata } from "next"
import { Leaf } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Privacidad - EcoCupon",
  description: "Cómo EcoCupon recopila, usa y protege tus datos personales.",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">EcoCupon</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Política de Privacidad</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Última actualización: 14 de julio de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p>
              EcoCupon (en adelante, &quot;la App&quot;) es el responsable del tratamiento de los
              datos personales que nos proporciones al usar nuestro servicio de generación de
              cupones de descuento. Para consultas sobre privacidad puedes escribirnos a{" "}
              <a
                href="mailto:ecocupon.cl@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                ecocupon.cl@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Datos que recopilamos</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Datos de cuenta:</strong> correo electrónico, contraseña (almacenada de
                forma cifrada) y, si los proporcionas, el nombre de tu negocio.
              </li>
              <li>
                <strong>Contenido de los cupones:</strong> título, descripción, porcentaje de
                descuento, código, y la imagen (logo) que subes para personalizarlos.
              </li>
              <li>
                <strong>Datos de uso:</strong> número de vistas y compartidos de tus cupones,
                necesarios para mostrar estadísticas dentro de la App.
              </li>
              <li>
                <strong>Datos de autenticación de terceros:</strong> si inicias sesión con Google,
                recibimos tu correo y nombre público según lo autorizado por dicho proveedor.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Finalidades</h2>
            <p>Tratamos tus datos para:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Crear y gestionar tu cuenta.</li>
              <li>Generar, almacenar y publicar tus cupones de descuento.</li>
              <li>Permitir el inicio de sesión mediante Google u otro proveedor conectado.</li>
              <li>Mostrarte estadísticas de uso y mejorar el servicio.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Base de datos y almacenamiento</h2>
            <p>
              Los datos se almacenan en Supabase (infraestructura de base de datos y almacenamiento
              en la nube). Las imágenes que subes (logos) se guardan en un bucket de almacenamiento
              con acceso público limitado a la visualización de los cupones. No vendemos ni
              compartimos tus datos personales con terceros con fines comerciales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Tus derechos</h2>
            <p>
              Puedes solicitar en cualquier momento el acceso, rectificación o eliminación de tus
              datos escribiendo a{" "}
              <a
                href="mailto:ecocupon.cl@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                ecocupon.cl@gmail.com
              </a>
              . También puedes eliminar tu cuenta desde la configuración de la App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Cambios</h2>
            <p>
              Podemos actualizar esta política. Publicaremos la versión vigente en esta misma
              página con su fecha de actualización.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
