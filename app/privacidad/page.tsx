import Link from "next/link"
import type { Metadata } from "next"
import { Leaf } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Privacidad - EcoCupon",
  description:
    "Cómo EcoCupon.cl recopila, usa y protege tus datos personales según la Ley N° 19.628 de Protección de la Vida Privada de Chile.",
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
            <h2 className="text-xl font-semibold text-foreground">1. Marco legal</h2>
            <p>
              EcoCupon.cl trata los datos personales de sus usuarios conforme a la{" "}
              <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> (en adelante,
              &quot;la Ley&quot;), su reglamento y las normas complementarias chilenas. El
              tratamiento de datos se realiza con la finalidad de prestar el servicio y respetando
              el principio de proporcionalidad. Puedes conocer más sobre el cumplimiento de esta
              norma en guías como la{" "}
              <a
                href="https://preyproject.com/es/resources/guia-de-cumplimiento-ley-de-proteccion-de-datos-chile"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Guía de cumplimiento de la Ley de Protección de Datos de Chile
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos es <strong>EcoCupon.cl</strong>. Para
              ejercer tus derechos o consultas sobre privacidad puedes contactarnos en{" "}
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
            <h2 className="text-xl font-semibold text-foreground">
              3. Datos que recopilamos
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Datos de identificación y cuenta:</strong> correo electrónico, contraseña
                (almacenada de forma cifrada) y, si los proporcionas, el nombre de tu negocio.
              </li>
              <li>
                <strong>Datos de los cupones:</strong> título, descripción, porcentaje de
                descuento, código de cupón e imagen (logo) que subes para personalizarlos.
              </li>
              <li>
                <strong>Datos de uso:</strong> número de vistas y veces compartido de tus cupones,
                necesarios para mostrar estadísticas dentro de la App.
              </li>
              <li>
                <strong>Datos de autenticación con terceros:</strong> si inicias sesión con Google,
                recibimos tu correo y nombre público según lo autorizado a dicho proveedor.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              4. Finalidad del tratamiento
            </h2>
            <p>Tratamos tus datos personales para:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Crear y administrar tu cuenta en EcoCupon.cl.</li>
              <li>Generar, almacenar y publicar tus cupones de descuento.</li>
              <li>Permitir el inicio de sesión mediante Google u otro proveedor conectado.</li>
              <li>Mostrarte estadísticas de uso y mejorar el servicio.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              5. Almacenamiento y seguridad
            </h2>
            <p>
              Los datos se almacenan en infraestructura de Supabase (base de datos y almacenamiento
              en la nube). Las imágenes que subes (logos) se guardan en un bucket con acceso público
              limitado a la visualización de los cupones. Aplicamos medidas técnicas razonables para
              proteger la información, sin embargo, ningún sistema es infalible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              6. Transferencia internacional de datos
            </h2>
            <p>
              Los datos pueden ser procesados por proveedores de infraestructura en el extranjero
              (por ejemplo, Supabase y sus subcontratistas). En tal caso, el tratamiento se sujeta a
              las mismas obligaciones de confidencialidad y seguridad exigibles en Chile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              7. Derechos de los titulares (Ley N° 19.628)
            </h2>
            <p>
              Conforme a la Ley N° 19.628, tienes derecho a conocer, rectificar, cancelar y oponerte
              al tratamiento de tus datos personales (derechos reconocidos en el artículo 12 de la
              Ley). Para ejercerlos, escríbenos a{" "}
              <a
                href="mailto:ecocupon.cl@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                ecocupon.cl@gmail.com
              </a>{" "}
              e indica el derecho que deseas ejercer. También puedes eliminar tu cuenta desde la
              configuración de la App. La Agencia de Protección de Datos Personales es la entidad
              encargada de velar por el cumplimiento de esta Ley en Chile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Cambios</h2>
            <p>
              Podemos actualizar esta política. Publicaremos la versión vigente en esta misma
              página con su fecha de actualización.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
