// Metadata y datos estructurados (JSON-LD) del sitio.
//
// Cada página pública pide su metadata acá en vez de escribir `openGraph` a mano:
// si no, Next hereda el `url` del layout y todas las páginas declaran la portada
// como su propia URL. Los constructores de JSON-LD devuelven objetos listos para
// JSON.stringify; el componente `components/json-ld.tsx` los inyecta.
import type { Metadata } from 'next'
import { SITE_URL } from './site-url'

export const SITE_NAME = 'EcoCupon'

// Datos de contacto que ya se muestran en el sitio (footer, precios, legales).
// Si algún día hay redes sociales, van en `sameAs` de la organización.
export const SITE_EMAIL = 'ecocupon.cl@gmail.com'
// `SITE_PHONE` va en E.164 para el schema; la versión con espacios es la que se
// muestra en pantalla.
export const SITE_PHONE = '+56979540471'
export const SITE_PHONE_DISPLAY = '+56 9 7954 0471'
export const SITE_WHATSAPP = 'https://wa.me/56979540471'

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/producto/cupon-verano20.png`,
  width: 800,
  height: 600,
  alt: 'Cupón de descuento del 20 % con su código y su QR, generado con EcoCupon',
} as const

const ORGANIZATION_ID = `${SITE_URL}/#organizacion`
const WEBSITE_ID = `${SITE_URL}/#sitio`

interface OgImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

interface PageMetadataOptions {
  title: string
  description: string
  /** Ruta absoluta del sitio, p. ej. `/precios`. Se resuelve contra metadataBase. */
  path: string
  /**
   * La plantilla `%s · EcoCupon` del layout no se aplica a la portada, así que
   * ahí el título tiene que traer la marca escrito a mano.
   */
  absoluteTitle?: boolean
  type?: 'website' | 'article'
  image?: OgImage
}

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  type = 'website',
  image = DEFAULT_OG_IMAGE,
}: PageMetadataOptions): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'es_CL',
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/apple-icon.png`,
      width: 180,
      height: 180,
    },
    description:
      'EcoCupon es una plataforma chilena para que los comercios creen cupones de descuento con código y QR, los compartan por WhatsApp y midan sus vistas y compartidos.',
    areaServed: { '@type': 'Country', name: 'Chile' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: SITE_PHONE,
        email: SITE_EMAIL,
        availableLanguage: ['es-CL', 'Spanish'],
        url: `${SITE_URL}/contacto`,
      },
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: 'es-CL',
    publisher: { '@id': ORGANIZATION_ID },
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Cupones de descuento',
    operatingSystem: 'Web',
    url: SITE_URL,
    inLanguage: 'es-CL',
    description:
      'Crea cupones de descuento con código y QR, compártelos por WhatsApp o como imagen y mide cuántas personas los vieron y los compartieron.',
    publisher: { '@id': ORGANIZATION_ID },
    offers: [
      {
        '@type': 'Offer',
        name: 'Gratis',
        price: '0',
        priceCurrency: 'CLP',
        description: '3 cupones por mes, imagen con QR y cuponera pública.',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '9000',
        priceCurrency: 'CLP',
        description: '50 cupones por mes, logo del negocio en el cupón y soporte por WhatsApp. Valor mensual más IVA.',
      },
      {
        '@type': 'Offer',
        name: 'Business',
        price: '29990',
        priceCurrency: 'CLP',
        description: 'Cupones ilimitados, acompañamiento personalizado y soporte dedicado. Valor mensual más IVA.',
      },
    ],
  }
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function breadcrumbJsonLd(items: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

export function itemListJsonLd(items: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  }
}

interface CouponJsonLdInput {
  id: string
  title: string
  description: string | null
  businessName: string
  discount: number
  code: string
  image: string
  expiresAt: string | null
  expired: boolean
}

export function couponJsonLd({
  id,
  title,
  description,
  businessName,
  discount,
  code,
  image,
  expiresAt,
  expired,
}: CouponJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description:
      description ??
      `${discount}% de descuento en ${businessName}. Cupón canjeable en el comercio con el código ${code}.`,
    image: image.startsWith('http') ? image : `${SITE_URL}${image}`,
    url: `${SITE_URL}/cupon/${id}`,
    category: 'Cupón de descuento',
    brand: { '@type': 'Brand', name: businessName },
    offers: {
      '@type': 'Offer',
      name: `${discount}% de descuento`,
      url: `${SITE_URL}/cupon/${id}`,
      priceCurrency: 'CLP',
      availability: expired ? 'https://schema.org/Discontinued' : 'https://schema.org/InStock',
      ...(expiresAt ? { validThrough: expiresAt } : {}),
    },
  }
}

export function contactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contacto · ${SITE_NAME}`,
    url: `${SITE_URL}/contacto`,
    inLanguage: 'es-CL',
    about: { '@id': ORGANIZATION_ID },
    mainEntity: {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      email: SITE_EMAIL,
      telephone: SITE_PHONE,
      areaServed: { '@type': 'Country', name: 'Chile' },
    },
  }
}