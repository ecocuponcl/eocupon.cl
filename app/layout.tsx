import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_URL } from '@/lib/site-url'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  // Necesario para que `alternates.canonical` relativo se resuelva a una URL absoluta.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EcoCupon - Cupones de descuento para tu negocio',
    template: '%s · EcoCupon',
  },
  description: 'Crea cupones con descuento, código y QR, compártelos por WhatsApp y mide cuánta gente los vio.',
  generator: 'ecocupon.cl',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'EcoCupon',
    url: SITE_URL,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`bg-background ${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
